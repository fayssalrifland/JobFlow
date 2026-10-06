import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { clientKey, handle, json, rateLimit } from "@/lib/http";
import { analyzeJobDescription } from "@/lib/job-analysis";

const schema = z.object({ text: z.string().max(40_000) });

export async function POST(request: Request) {
  return handle(async () => {
    await requireUser(request);
    rateLimit(clientKey(request, "analyze"), 30, 60_000);
    const { text } = schema.parse(await request.json());
    return json({ analysis: analyzeJobDescription(text), engine: "rules" });
  });
}
