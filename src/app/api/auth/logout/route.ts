import { clearSessionCookie } from "@/lib/auth";
import { handle, json } from "@/lib/http";

export async function POST() {
  return handle(async () => {
    await clearSessionCookie();
    return json({ ok: true });
  });
}
