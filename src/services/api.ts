export class ApiError extends Error {
  status: number;
  details?: { path: string; message: string }[];

  constructor(status: number, message: string, details?: { path: string; message: string }[]) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

type Options = Omit<RequestInit, "body"> & { body?: unknown };

const TOKEN_KEY = "jobflow_token";

/**
 * The session token is held in memory first, then mirrored to Web Storage
 * best-effort. The in-memory copy is what keeps auth working inside the
 * sandboxed preview iframe, where cookies and localStorage can both be
 * unavailable (opaque origin / third-party restrictions).
 */
let memoryToken: string | null = null;

/**
 * Bootstrap the token SYNCHRONOUSLY, at module-evaluation time — before React
 * renders anything. Child components start their queries before a parent's
 * `useEffect` runs, which is what previously made the first request go out
 * unauthenticated and showed a spurious "could not load your dashboard" error.
 */
if (typeof window !== "undefined") {
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("token");
    memoryToken =
      fromUrl ?? window.localStorage.getItem(TOKEN_KEY) ?? window.sessionStorage.getItem(TOKEN_KEY);
  } catch {
    memoryToken = null;
  }
}

export function getToken(): string | null {
  if (memoryToken) return memoryToken;
  if (typeof window === "undefined") return null;
  try {
    const stored =
      window.localStorage.getItem(TOKEN_KEY) ?? window.sessionStorage.getItem(TOKEN_KEY);
    if (stored) memoryToken = stored;
    return stored;
  } catch {
    return null;
  }
}

export function setToken(token: string | null) {
  memoryToken = token;
  if (typeof window === "undefined") return;
  try {
    if (token) {
      window.localStorage.setItem(TOKEN_KEY, token);
      window.sessionStorage.setItem(TOKEN_KEY, token);
    } else {
      window.localStorage.removeItem(TOKEN_KEY);
      window.sessionStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    /* storage unavailable — the in-memory copy still works */
  }
}

/**
 * Resolves the token at REQUEST time, synchronously, straight from the current
 * URL if necessary. Doing this lazily (rather than relying on a value captured
 * during render) means an API call can never go out unauthenticated as long as
 * the session token is present in the address bar — which `appHref()`
 * guarantees for every in-app navigation.
 */
function currentToken(): string | null {
  if (memoryToken) return memoryToken;
  if (typeof window === "undefined") return null;
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("token");
    if (fromUrl) {
      memoryToken = fromUrl;
      return fromUrl;
    }
  } catch {
    /* ignore */
  }
  return getToken();
}

async function send(path: string, options: Options): Promise<Response> {
  const { body, headers, ...rest } = options;
  const token = currentToken();
  // Carry the token in the request URL as well as the header. The middleware
  // promotes `?token=` into a request header, so the server can authenticate
  // the call even when cookies and the Authorization header are unavailable.
  const url = token ? withToken(path, token) : path;
  return fetch(url, {
    ...rest,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    // "include" so the session cookie is also sent when the app is served from a
    // different origin than the API (e.g. the hosted preview's proxy).
    credentials: "include",
  });
}

export async function apiFetch<T>(path: string, options: Options = {}): Promise<T> {
  let response = await send(path, options);

  // Safety net: if the very first request went out unauthenticated but a token
  // is present in the URL, adopt it and retry once instead of failing.
  if (response.status === 401 && typeof window !== "undefined") {
    const fromUrl = new URLSearchParams(window.location.search).get("token");
    if (fromUrl && fromUrl !== memoryToken) {
      setToken(fromUrl);
      response = await send(path, options);
    }
  }

  if (response.status === 204) return undefined as T;

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json") ? await response.json() : null;

  if (!response.ok) {
    const message =
      (payload && typeof payload.error === "string" && payload.error) ||
      "Something went wrong. Please try again.";
    throw new ApiError(response.status, message, payload?.details);
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string) => apiFetch<T>(path),
  post: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) => apiFetch<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
};

/**
 * Builds the post-sign-in URL, carrying the session token as a query param so
 * the server layout can resolve the session even when cookies and Web Storage
 * are unavailable (sandboxed cross-site iframe).
 */
export function withToken(target: string, token?: string | null) {
  if (!token) return target;
  const [path, existing] = target.split("?");
  const params = new URLSearchParams(existing ?? "");
  params.set("token", token);
  return `${path}?${params.toString()}`;
}

/**
 * Appends the current session token to an in-app path so EVERY page load
 * (client navigation or hard refresh) can resolve the session server-side.
 * This transport survives when both cookies and Web Storage are unavailable
 * inside the sandboxed preview iframe.
 */
export function appHref(path: string) {
  const token = getToken();
  if (!token) return path;
  const [pathname, existing] = path.split("?");
  const params = new URLSearchParams(existing ?? "");
  if (params.has("token")) return path;
  params.set("token", token);
  return `${pathname}?${params.toString()}`;
}

export function buildQuery(params: Record<string, string | number | undefined | null>) {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}
