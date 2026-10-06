import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, type User } from "@/db/schema";
import { HttpError } from "@/lib/http";

export const SESSION_COOKIE = "jobflow_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 14; // 14 days

function secretKey() {
  const secret = process.env.SESSION_SECRET ?? process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === "production" && process.env.ALLOW_DEV_SECRET !== "1") {
    // Fall back but make the weak configuration obvious in logs.
    console.warn("[auth] SESSION_SECRET is not set — using a development fallback secret.");
  }
  return new TextEncoder().encode(secret ?? "jobflow-development-secret-change-me");
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(userId: string) {
  return new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer("jobflow")
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

export async function setSessionCookie(userId: string) {
  const token = await createSessionToken(userId);
  const store = await cookies();
  const isProd = process.env.NODE_ENV === "production";
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    // The preview runs inside a cross-site iframe, so the cookie must be
    // SameSite=None (which also requires Secure) to be sent back at all.
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  const isProd = process.env.NODE_ENV === "production";
  store.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: isProd ? "none" : "lax",
    secure: isProd,
    path: "/",
    maxAge: 0,
  });
}

export async function getUserIdFromToken(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), { issuer: "jobflow" });
    return typeof payload.sub === "string" ? payload.sub : null;
  } catch {
    return null;
  }
}

export type SessionUser = Omit<User, "passwordHash">;

export function publicUser(user: User): SessionUser {
  const { passwordHash: _passwordHash, ...rest } = user;
  void _passwordHash;
  return rest;
}

/** Request header the middleware uses to promote a `?token=` query param. */
const TOKEN_HEADER = "x-jobflow-token";

export async function resolveUserId(request?: Request, token?: string | null): Promise<string | null> {
  if (token) {
    const fromToken = await getUserIdFromToken(token);
    if (fromToken) return fromToken;
  }
  if (request) {
    // 1. Bearer header sent by the client API layer.
    const auth = request.headers.get("authorization");
    if (auth?.startsWith("Bearer ")) {
      const fromHeader = await getUserIdFromToken(auth.slice(7).trim());
      if (fromHeader) return fromHeader;
    }
    // 2. Header promoted by the middleware from a `?token=` query param. This is
    //    the transport that keeps API calls authenticated inside the hosted
    //    preview iframe, where cookies and client storage are often blocked.
    const promoted = request.headers.get(TOKEN_HEADER);
    if (promoted) {
      const fromPromoted = await getUserIdFromToken(promoted);
      if (fromPromoted) return fromPromoted;
    }
  }
  // 3. http-only session cookie (normal, non-iframed usage).
  const store = await cookies();
  return getUserIdFromToken(store.get(SESSION_COOKIE)?.value);
}

export async function getCurrentUser(request?: Request, token?: string | null): Promise<SessionUser | null> {
  const userId = await resolveUserId(request, token);
  if (!userId) return null;
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return user ? publicUser(user) : null;
}

/** Use inside API route handlers — throws a 401 HttpError when unauthenticated. */
export async function requireUser(request?: Request): Promise<SessionUser> {
  const user = await getCurrentUser(request);
  if (!user) throw new HttpError(401, "You need to be signed in to do that.");
  return user;
}
