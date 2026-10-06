"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { api, getToken, setToken } from "@/services/api";
import { AppShell } from "@/components/layout/app-shell";
import type { SessionUserDTO } from "@/types";

type Props = {
  children: ReactNode;
  /** Provided by the server layout when the session was resolved server-side. */
  initialUser?: SessionUserDTO;
  initialToken?: string | null;
};

/**
 * Client-side auth boundary.
 *
 * The session cookie is http-only, but the hosted preview runs the app inside a
 * cross-site iframe where third-party cookies are frequently blocked. To stay
 * reliable the session is resolved server-side (see `app/app/layout.tsx`) and
 * ALSO kept as a bearer token that `/api/me` accepts from either the cookie or
 * the `Authorization` header.
 */
export function AuthGuard({ children, initialUser, initialToken }: Props) {
  // Register the session token DURING RENDER, not in an effect.
  //
  // React renders a parent to completion before its children, so doing this
  // here guarantees every child component — and therefore every TanStack Query
  // request it kicks off on mount — already has a valid token. Doing it in a
  // `useEffect` was too late: the dashboard request went out unauthenticated
  // and the user saw a "you need to be signed in" error.
  if (initialToken) {
    setToken(initialToken);
  } else if (typeof window !== "undefined") {
    const fromUrl = new URLSearchParams(window.location.search).get("token");
    if (fromUrl) setToken(fromUrl);
  }

  // Guarantee the address bar carries the session token, so every in-app
  // navigation and every API request (which reads it from the URL) stays
  // authenticated even if cookies and Web Storage are both unavailable.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.has("token")) return;
    const token = getToken();
    if (!token) return;
    params.set("token", token);
    window.history.replaceState(
      window.history.state,
      "",
      `${window.location.pathname}?${params.toString()}`,
    );
  }, [initialUser, initialToken]);

  const [user, setUser] = useState<SessionUserDTO | null>(initialUser ?? null);
  const [status, setStatus] = useState<"loading" | "ready" | "unauth">(
    initialUser ? "ready" : "loading",
  );


  useEffect(() => {
    // Already resolved on the server — nothing to verify.
    if (status !== "loading") return;

    let active = true;
    (async () => {
      try {
        const { user: me } = await api.get<{ user: SessionUserDTO }>("/api/me");
        if (!active) return;
        setUser(me);
        setStatus("ready");
      } catch {
        if (!active) return;
        setToken(null);
        setStatus("unauth");
        const next = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.replace(`/login?next=${next}`);
      }
    })();
    return () => {
      active = false;
    };
  }, [status]);

  if (status !== "ready" || !user) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3 text-slate-500 dark:text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" aria-hidden />
          <p className="text-sm">Loading your workspace…</p>
        </div>
      </div>
    );
  }

  return <AppShell user={user}>{children}</AppShell>;
}
