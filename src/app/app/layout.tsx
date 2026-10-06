import type { ReactNode } from "react";
import { headers } from "next/headers";
import { createSessionToken, getCurrentUser } from "@/lib/auth";
import { AuthGuard } from "@/components/layout/auth-guard";
import type { SessionUserDTO } from "@/types";

export const dynamic = "force-dynamic";

const TOKEN_HEADER = "x-jobflow-token";

function toDto(user: {
  id: string;
  name: string;
  email: string;
  headline: string | null;
  theme: "light" | "dark" | "system";
  defaultCurrency: string;
  defaultView: "kanban" | "list";
  emailReminders: boolean;
  inAppNotifications: boolean;
  isDemo: boolean;
}): SessionUserDTO {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    headline: user.headline,
    theme: user.theme,
    defaultCurrency: user.defaultCurrency,
    defaultView: user.defaultView,
    emailReminders: user.emailReminders,
    inAppNotifications: user.inAppNotifications,
    isDemo: user.isDemo,
  };
}

/**
 * Resolves the session on the server so the app works even inside a sandboxed,
 * cross-site iframe where cookies and Web Storage are unavailable.
 *
 * Sign-in redirects here with `?token=<jwt>`, which the middleware forwards as
 * a request header. Whatever way the session was resolved, we ALWAYS mint a
 * token to hand to the client — without it, the client's API calls (which run
 * in the iframe, where cookies are often blocked) would go out unauthenticated.
 */
export default async function AppLayout({ children }: { children: ReactNode }) {
  const headerList = await headers();
  const urlToken = headerList.get(TOKEN_HEADER);

  const user = urlToken ? await getCurrentUser(undefined, urlToken) : await getCurrentUser();

  if (!user) {
    // No server-side session: fall through to the client guard, which reads the
    // token from the URL / storage and redirects to /login if unauthenticated.
    return <AuthGuard>{children}</AuthGuard>;
  }

  const clientToken = urlToken ?? (await createSessionToken(user.id));

  return (
    <AuthGuard initialUser={toDto(user)} initialToken={clientToken}>
      {children}
    </AuthGuard>
  );
}
