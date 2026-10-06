import { and, asc, eq, gte } from "drizzle-orm";
import { db } from "@/db";
import { applications, companies, interviews } from "@/db/schema";
import { requireUser } from "@/lib/auth";
import { HttpError, handle, json } from "@/lib/http";
import { interviewFormSchema } from "@/lib/validation";
import { logActivity, notify } from "@/server/activity";
import { INTERVIEW_TYPE_LABEL } from "@/lib/constants";
import type { InterviewDTO } from "@/types";

export async function GET(request: Request) {
  return handle(async () => {
    const user = await requireUser(request);
    const url = new URL(request.url);
    const upcomingOnly = url.searchParams.get("upcoming") === "1";

    const filters = [eq(interviews.userId, user.id)];
    if (upcomingOnly) filters.push(gte(interviews.scheduledAt, new Date()));

    const rows = await db
      .select({ interview: interviews, company: companies.name, position: applications.position })
      .from(interviews)
      .innerJoin(applications, eq(applications.id, interviews.applicationId))
      .innerJoin(companies, eq(companies.id, applications.companyId))
      .where(and(...filters))
      .orderBy(asc(interviews.scheduledAt));

    const items: InterviewDTO[] = rows.map((row) => ({
      id: row.interview.id,
      applicationId: row.interview.applicationId,
      type: row.interview.type,
      scheduledAt: row.interview.scheduledAt.toISOString(),
      durationMinutes: row.interview.durationMinutes,
      meetingUrl: row.interview.meetingUrl,
      interviewers: row.interview.interviewers,
      notes: row.interview.notes,
      completed: row.interview.completed,
      company: row.company,
      position: row.position,
    }));

    return json({ items });
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    const user = await requireUser(request);
    const data = interviewFormSchema.parse(await request.json());

    const [row] = await db
      .select({ application: applications, company: companies.name })
      .from(applications)
      .innerJoin(companies, eq(companies.id, applications.companyId))
      .where(and(eq(applications.id, data.applicationId), eq(applications.userId, user.id)))
      .limit(1);
    if (!row) throw new HttpError(404, "Application not found");

    const scheduledAt = new Date(`${data.date}T${data.time}:00`);
    if (Number.isNaN(scheduledAt.getTime())) throw new HttpError(422, "Invalid date or time");

    const [created] = await db
      .insert(interviews)
      .values({
        userId: user.id,
        applicationId: data.applicationId,
        type: data.type,
        scheduledAt,
        durationMinutes: data.durationMinutes ? Number(data.durationMinutes) : 60,
        meetingUrl: data.meetingUrl || null,
        interviewers: data.interviewers || null,
        notes: data.notes || null,
      })
      .returning();

    await logActivity({
      userId: user.id,
      applicationId: data.applicationId,
      type: "INTERVIEW_SCHEDULED",
      message: `Added ${INTERVIEW_TYPE_LABEL[data.type].toLowerCase()} for ${row.application.position} at ${row.company}`,
    });
    await notify({
      userId: user.id,
      type: "INTERVIEW",
      title: `Interview scheduled — ${row.company}`,
      body: `${INTERVIEW_TYPE_LABEL[data.type]} on ${scheduledAt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}`,
      href: `/app/applications/${data.applicationId}`,
    });

    return json(created, 201);
  });
}

export const dynamic = "force-dynamic";
