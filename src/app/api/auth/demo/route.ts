import { createSessionToken, publicUser, setSessionCookie } from "@/lib/auth";
import { clientKey, handle, json, rateLimit } from "@/lib/http";
import { ensureDemoUser } from "@/server/demo";

/** Signs the visitor into the shared, clearly-labelled demo account. */
export async function POST(request: Request) {
  return handle(async () => {
    rateLimit(clientKey(request, "demo"), 12, 60_000);
    const user = await ensureDemoUser();
    await setSessionCookie(user.id);
    return json({ user: publicUser(user), token: await createSessionToken(user.id) });
  });
}
