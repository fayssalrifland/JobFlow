import { NextResponse, type NextRequest } from "next/server";

const TOKEN_PARAM = "token";
const TOKEN_HEADER = "x-jobflow-token";
const SESSION_COOKIE = "jobflow_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 14;

/**
 * Security headers + session hand-off.
 *
 * Route protection is intentionally NOT enforced here: the hosted preview runs
 * the app inside a sandboxed, cross-site iframe where the http-only session
 * cookie is frequently blocked, so a cookie-based edge guard would produce
 * false redirects. The real boundary is `requireUser()` in every API route.
 *
 * Sign-in redirects to `/app/...?token=<jwt>`. We forward that token three ways
 * so the session survives whatever the browser allows:
 *   1. a request header (layouts do not receive `searchParams`)
 *   2. a refreshed session cookie (normal, non-iframed usage)
 *   3. left in the URL, which `appHref()` carries across in-app navigation
 *
 * X-Frame-Options is deliberately omitted so the preview can frame the app.
 */
export function middleware(request: NextRequest) {
  const token = request.nextUrl.searchParams.get(TOKEN_PARAM);
  const requestHeaders = new Headers(request.headers);
  if (token) requestHeaders.set(TOKEN_HEADER, token);

  const response = NextResponse.next({ request: { headers: requestHeaders } });

  if (token) {
    const isProd = process.env.NODE_ENV === "production";
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: isProd ? "none" : "lax",
      secure: isProd,
      path: "/",
      maxAge: SESSION_MAX_AGE,
    });
  }

  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
