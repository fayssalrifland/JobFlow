import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { HttpError, handle, json } from "@/lib/http";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({ read: z.boolean() });

export async function PATCH(request: Request, { params }: Params) {
  return handle(async () => {
    const user = await requireUser(request);
    const { id } = await params;
    const data = patchSchema.parse(await request.json());
    const [updated] = await db
      .update(notifications)
      .set({ read: data.read })
      .where(and(eq(notifications.id, id), eq(notifications.userId, user.id)))
      .returning();
    if (!updated) throw new HttpError(404, "Notification not found");
    return json({ ...updated, createdAt: updated.createdAt.toISOString() });
  });
}
