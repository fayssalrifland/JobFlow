import { requireUser } from "@/lib/auth";
import { HttpError, clientKey, handle, json, rateLimit } from "@/lib/http";
import { resetDemoData } from "@/server/demo";

export async function POST(request: Request) {
  return handle(async () => {
    const user = await requireUser(request);
    if (!user.isDemo) throw new HttpError(403, "Only the demo account can be reset.");
    rateLimit(clientKey(request, "demo-reset"), 3, 60_000);
    await resetDemoData(user.id);
    return json({ ok: true });
  });
}
