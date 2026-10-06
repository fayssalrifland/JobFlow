import { requireUser } from "@/lib/auth";
import { handle, json } from "@/lib/http";
import { RANGES, getAnalytics, type Range } from "@/server/analytics";

export async function GET(request: Request) {
  return handle(async () => {
    const user = await requireUser(request);
    const url = new URL(request.url);
    const raw = url.searchParams.get("range") ?? "90d";
    const range = (RANGES as readonly string[]).includes(raw) ? (raw as Range) : "90d";
    return json(await getAnalytics(user.id, range));
  });
}

export const dynamic = "force-dynamic";
