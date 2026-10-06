import { requireUser } from "@/lib/auth";
import { handle, json } from "@/lib/http";
import { getDashboard } from "@/server/analytics";

export async function GET(request: Request) {
  return handle(async () => {
    const user = await requireUser(request);
    return json(await getDashboard(user.id));
  });
}

export const dynamic = "force-dynamic";
