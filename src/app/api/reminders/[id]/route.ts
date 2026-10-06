import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { reminders } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { HttpError, handle, json } from "@/lib/http";
import { reminderPatchSchema } from "@/lib/validation";
import { logActivity } from "@/server/activity";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  return handle(async () => {
    const user = await requireUser(request);
    const { id } = await params;
    const data = reminderPatchSchema.parse(await request.json());

    const [existing] = await db
      .select()
      .from(reminders)
      .where(and(eq(reminders.id, id), eq(reminders.userId, user.id)))
      .limit(1);
    if (!existing) throw new HttpError(404, "Reminder not found");

    const [updated] = await db
      .update(reminders)
      .set({
        ...(data.title ? { title: data.title } : {}),
        ...(data.notes !== undefined ? { notes: data.notes || null } : {}),
        ...(data.dueDate ? { dueDate: new Date(data.dueDate) } : {}),
        ...(data.completed !== undefined
          ? { completed: data.completed, completedAt: data.completed ? new Date() : null }
          : {}),
      })
      .where(eq(reminders.id, id))
      .returning();

    if (data.completed) {
      await logActivity({
        userId: user.id,
        applicationId: existing.applicationId,
        type: "REMINDER_COMPLETED",
        message: `Completed reminder: ${existing.title}`,
      });
    }

    return json(updated);
  });
}

export async function DELETE(request: Request, { params }: Params) {
  return handle(async () => {
    const user = await requireUser(request);
    const { id } = await params;
    const [existing] = await db
      .select()
      .from(reminders)
      .where(and(eq(reminders.id, id), eq(reminders.userId, user.id)))
      .limit(1);
    if (!existing) throw new HttpError(404, "Reminder not found");
    await db.delete(reminders).where(eq(reminders.id, id));
    return json({ id });
  });
}
