import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { tags } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { handle, json } from "@/lib/http";

export async function GET(request: Request) {
  return handle(async () => {
    const user = await requireUser(request);
    const items = await db
      .select({ id: tags.id, label: tags.label })
      .from(tags)
      .where(eq(tags.userId, user.id))
      .orderBy(asc(tags.label));
    return json({ items });
  });
}

export const dynamic = "force-dynamic";
