import { db } from "@/db";
import { activities, notifications } from "@/db/schema";
import type { ApplicationStatus } from "@/lib/constants";

type ActivityType =
  | "APPLICATION_CREATED"
  | "STATUS_CHANGED"
  | "APPLICATION_UPDATED"
  | "INTERVIEW_SCHEDULED"
  | "INTERVIEW_UPDATED"
  | "NOTE_ADDED"
  | "REMINDER_CREATED"
  | "REMINDER_COMPLETED"
  | "CUSTOM_EVENT";

export async function logActivity(input: {
  userId: string;
  applicationId?: string | null;
  type: ActivityType;
  message: string;
  fromStatus?: ApplicationStatus | null;
  toStatus?: ApplicationStatus | null;
  occurredAt?: Date;
}) {
  const [row] = await db
    .insert(activities)
    .values({
      userId: input.userId,
      applicationId: input.applicationId ?? null,
      type: input.type,
      message: input.message,
      fromStatus: input.fromStatus ?? null,
      toStatus: input.toStatus ?? null,
      occurredAt: input.occurredAt ?? new Date(),
    })
    .returning();
  return row;
}

export async function notify(input: {
  userId: string;
  type: "INTERVIEW" | "REMINDER" | "STATUS" | "SYSTEM";
  title: string;
  body?: string;
  href?: string;
  createdAt?: Date;
}) {
  const [row] = await db
    .insert(notifications)
    .values({
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      href: input.href ?? null,
      createdAt: input.createdAt ?? new Date(),
    })
    .returning();
  return row;
}
