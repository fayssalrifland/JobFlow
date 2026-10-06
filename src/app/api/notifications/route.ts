import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { handle, json } from "@/lib/http";

export async function GET(request: Request) {
  return handle(async () => {
    const user = await requireUser(request);
    const items = await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, user.id))
      .orderBy(desc(notifications.createdAt))
      .limit(40);
    const [{ unread }] = await db
      .select({ unread: sql<number>`count(*)::int` })
      .from(notifications)
      .where(and(eq(notifications.userId, user.id), eq(notifications.read, false)));

    return json({
      items: items.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })),
      unread,
    });
  });
}

const patchSchema = z.object({ markAllRead: z.literal(true) });

export async function PATCH(request: Request) {
  return handle(async () => {
    const user = await requireUser(request);
    patchSchema.parse(await request.json());
    await db
      .update(notifications)
      .set({ read: true })
      .where(and(eq(notifications.userId, user.id), eq(notifications.read, false)));
    return json({ ok: true });
  });
}

export const dynamic = "force-dynamic";
