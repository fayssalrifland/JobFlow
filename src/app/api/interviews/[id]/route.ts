import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { interviews } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { HttpError, handle, json } from "@/lib/http";
import { logActivity } from "@/server/activity";

type Params = { params: Promise<{ id: string }> };

const patchSchema = z.object({
  type: z.enum(["PHONE", "VIDEO", "TECHNICAL", "HR", "FINAL"]).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  durationMinutes: z.number().int().min(5).max(600).optional(),
  meetingUrl: z.string().optional(),
  interviewers: z.string().optional(),
  notes: z.string().optional(),
  completed: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: Params) {
  return handle(async () => {
    const user = await requireUser(request);
    const { id } = await params;
    const data = patchSchema.parse(await request.json());

    const [existing] = await db
      .select()
      .from(interviews)
      .where(and(eq(interviews.id, id), eq(interviews.userId, user.id)))
      .limit(1);
    if (!existing) throw new HttpError(404, "Interview not found");

    const scheduledAt =
      data.date || data.time
        ? new Date(
            `${data.date ?? existing.scheduledAt.toISOString().slice(0, 10)}T${
              data.time ?? existing.scheduledAt.toTimeString().slice(0, 5)
            }:00`,
          )
        : existing.scheduledAt;

    const [updated] = await db
      .update(interviews)
      .set({
        ...(data.type ? { type: data.type } : {}),
        scheduledAt,
        ...(data.durationMinutes ? { durationMinutes: data.durationMinutes } : {}),
        ...(data.meetingUrl !== undefined ? { meetingUrl: data.meetingUrl || null } : {}),
        ...(data.interviewers !== undefined ? { interviewers: data.interviewers || null } : {}),
        ...(data.notes !== undefined ? { notes: data.notes || null } : {}),
        ...(data.completed !== undefined ? { completed: data.completed } : {}),
      })
      .where(eq(interviews.id, id))
      .returning();

    await logActivity({
      userId: user.id,
      applicationId: existing.applicationId,
      type: "INTERVIEW_UPDATED",
      message: data.completed
        ? "Marked an interview as completed"
        : "Updated interview details",
    });

    return json(updated);
  });
}

export async function DELETE(request: Request, { params }: Params) {
  return handle(async () => {
    const user = await requireUser(request);
    const { id } = await params;
    const [existing] = await db
      .select()
      .from(interviews)
      .where(and(eq(interviews.id, id), eq(interviews.userId, user.id)))
      .limit(1);
    if (!existing) throw new HttpError(404, "Interview not found");
    await db.delete(interviews).where(eq(interviews.id, id));
    return json({ id });
  });
}
