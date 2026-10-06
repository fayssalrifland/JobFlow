import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { applications, companies, reminders } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { HttpError, handle, json } from "@/lib/http";
import { reminderFormSchema } from "@/lib/validation";
import { logActivity } from "@/server/activity";
import type { ReminderDTO } from "@/types";

export async function GET(request: Request) {
  return handle(async () => {
    const user = await requireUser(request);
    const rows = await db
      .select({ reminder: reminders, company: companies.name, position: applications.position })
      .from(reminders)
      .leftJoin(applications, eq(applications.id, reminders.applicationId))
      .leftJoin(companies, eq(companies.id, applications.companyId))
      .where(eq(reminders.userId, user.id))
      .orderBy(asc(reminders.dueDate));

    const items: ReminderDTO[] = rows.map((row) => ({
      id: row.reminder.id,
      applicationId: row.reminder.applicationId,
      title: row.reminder.title,
      notes: row.reminder.notes,
      dueDate: row.reminder.dueDate.toISOString(),
      completed: row.reminder.completed,
      completedAt: row.reminder.completedAt?.toISOString() ?? null,
      company: row.company,
      position: row.position,
    }));

    return json({ items });
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    const user = await requireUser(request);
    const data = reminderFormSchema.parse(await request.json());

    if (data.applicationId) {
      const [owned] = await db
        .select({ id: applications.id })
        .from(applications)
        .where(and(eq(applications.id, data.applicationId), eq(applications.userId, user.id)))
        .limit(1);
      if (!owned) throw new HttpError(404, "Application not found");
    }

    const dueDate = new Date(`${data.date}T${data.time || "09:00"}:00`);
    if (Number.isNaN(dueDate.getTime())) throw new HttpError(422, "Invalid due date");

    const [created] = await db
      .insert(reminders)
      .values({
        userId: user.id,
        applicationId: data.applicationId || null,
        title: data.title,
        notes: data.notes || null,
        dueDate,
      })
      .returning();

    await logActivity({
      userId: user.id,
      applicationId: data.applicationId || null,
      type: "REMINDER_CREATED",
      message: `Reminder added: ${data.title}`,
    });

    return json(created, 201);
  });
}

export const dynamic = "force-dynamic";
