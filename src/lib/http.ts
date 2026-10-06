import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class HttpError extends Error {
  status: number;
  details?: unknown;

  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

export function json<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function errorResponse(error: unknown) {
  if (error instanceof HttpError) {
    return NextResponse.json({ error: error.message, details: error.details }, { status: error.status });
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 422 },
    );
  }
  console.error("[api] unexpected error", error);
  return NextResponse.json({ error: "Something went wrong on our side." }, { status: 500 });
}

export async function handle<T>(fn: () => Promise<T>) {
  try {
    const result = await fn();
    if (result instanceof NextResponse) return result;
    return NextResponse.json(result);
  } catch (error) {
    return errorResponse(error);
  }
}

/* --------------------------- simple rate limiting -------------------------- */

type Bucket = { count: number; resetAt: number };
const globalForLimiter = globalThis as typeof globalThis & {
  __jobflowRateLimiter?: Map<string, Bucket>;
};
const buckets = (globalForLimiter.__jobflowRateLimiter ??= new Map<string, Bucket>());

/** In-memory fixed-window limiter. Good enough for a single-node deployment. */
export function rateLimit(key: string, limit = 10, windowMs = 60_000) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }
  bucket.count += 1;
  if (bucket.count > limit) {
    throw new HttpError(429, "Too many requests. Please slow down and try again shortly.");
  }
}

export function clientKey(request: Request, scope: string) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "local";
  return `${scope}:${ip}`;
}
