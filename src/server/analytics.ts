import { and, asc, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  activities as activitiesTable,
  applications,
  companies,
  interviews,
  reminders,
} from "@/db/schema";
import {
  EMPLOYMENT_TYPE_LABEL,
  FUNNEL_STAGES,
  LOCATION_TYPE_LABEL,
  SOURCE_LABEL,
  STATUS_META,
  type ApplicationStatus,
  type EmploymentType,
  type LocationType,
  type Source,
} from "@/lib/constants";
import type { ActivityDTO, AnalyticsData, DashboardData, InterviewDTO, ReminderDTO } from "@/types";

const STAGE_INDEX: Record<string, number> = {
  APPLIED: 0,
  SCREENING: 1,
  INTERVIEW: 2,
  TECHNICAL_TEST: 3,
  OFFER: 4,
  ACCEPTED: 5,
};

export const RANGES = ["7d", "30d", "90d", "6m", "1y", "all"] as const;
export type Range = (typeof RANGES)[number];

export function rangeStart(range: Range): Date | null {
  const now = new Date();
  switch (range) {
    case "7d":
      return new Date(now.getTime() - 7 * 86_400_000);
    case "30d":
      return new Date(now.getTime() - 30 * 86_400_000);
    case "90d":
      return new Date(now.getTime() - 90 * 86_400_000);
    case "6m": {
      const d = new Date(now);
      d.setMonth(d.getMonth() - 6);
      return d;
    }
    case "1y": {
      const d = new Date(now);
      d.setFullYear(d.getFullYear() - 1);
      return d;
    }
    default:
      return null;
  }
}

type AppRecord = {
  id: string;
  status: ApplicationStatus;
  appliedDate: string;
  respondedAt: Date | null;
  source: Source;
  locationType: LocationType;
  employmentType: EmploymentType;
  location: string | null;
};

async function loadApplications(userId: string, start: Date | null): Promise<AppRecord[]> {
  const filters = [eq(applications.userId, userId)];
  if (start) filters.push(gte(applications.appliedDate, start.toISOString().slice(0, 10)));
  return db
    .select({
      id: applications.id,
      status: applications.status,
      appliedDate: applications.appliedDate,
      respondedAt: applications.respondedAt,
      source: applications.source,
      locationType: applications.locationType,
      employmentType: applications.employmentType,
      location: applications.location,
    })
    .from(applications)
    .where(and(...filters));
}

async function loadStageHistory(userId: string, applicationIds: Set<string>) {
  const rows = await db
    .select({
      applicationId: activitiesTable.applicationId,
      toStatus: activitiesTable.toStatus,
      occurredAt: activitiesTable.occurredAt,
    })
    .from(activitiesTable)
    .where(eq(activitiesTable.userId, userId))
    .orderBy(asc(activitiesTable.occurredAt));

  const history = new Map<string, { status: ApplicationStatus; at: Date }[]>();
  for (const row of rows) {
    if (!row.applicationId || !row.toStatus) continue;
    if (!applicationIds.has(row.applicationId)) continue;
    const list = history.get(row.applicationId) ?? [];
    list.push({ status: row.toStatus, at: row.occurredAt });
    history.set(row.applicationId, list);
  }
  return history;
}

function computeFunnel(
  apps: AppRecord[],
  history: Map<string, { status: ApplicationStatus; at: Date }[]>,
) {
  const reached = new Map<string, number>();
  for (const app of apps) {
    let max = 0;
    for (const entry of history.get(app.id) ?? []) {
      const idx = STAGE_INDEX[entry.status];
      if (idx !== undefined && idx > max) max = idx;
    }
    const currentIdx = STAGE_INDEX[app.status];
    if (currentIdx !== undefined && currentIdx > max) max = currentIdx;
    reached.set(app.id, max);
  }
  const total = apps.length;
  return FUNNEL_STAGES.map((stage, index) => {
    const count = apps.filter((app) => (reached.get(app.id) ?? 0) >= index).length;
    return {
      stage: stage as ApplicationStatus,
      label: STATUS_META[stage].label,
      count,
      rate: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
    };
  });
}

function computeTimeInStage(
  apps: AppRecord[],
  history: Map<string, { status: ApplicationStatus; at: Date }[]>,
) {
  const totals = new Map<ApplicationStatus, { days: number; samples: number }>();
  for (const app of apps) {
    const entries = history.get(app.id) ?? [];
    for (let i = 0; i < entries.length - 1; i += 1) {
      const current = entries[i];
      const next = entries[i + 1];
      if (STAGE_INDEX[current.status] === undefined) continue;
      const days = (next.at.getTime() - current.at.getTime()) / 86_400_000;
      if (days < 0) continue;
      const bucket = totals.get(current.status) ?? { days: 0, samples: 0 };
      bucket.days += days;
      bucket.samples += 1;
      totals.set(current.status, bucket);
    }
  }
  return FUNNEL_STAGES.slice(0, 5).map((stage) => {
    const bucket = totals.get(stage as ApplicationStatus);
    return {
      stage: stage as ApplicationStatus,
      label: STATUS_META[stage].label,
      days: bucket && bucket.samples > 0 ? Math.round((bucket.days / bucket.samples) * 10) / 10 : 0,
      samples: bucket?.samples ?? 0,
    };
  });
}

function groupCount<T extends string>(
  apps: AppRecord[],
  pick: (app: AppRecord) => T | null,
  label: (key: T) => string,
) {
  const map = new Map<T, number>();
  for (const app of apps) {
    const key = pick(app);
    if (!key) continue;
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([key, count]) => ({ key, label: label(key), count }))
    .sort((a, b) => b.count - a.count);
}

function weekKey(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - day + 1);
  return d.toISOString().slice(0, 10);
}

function respondedCheck(app: AppRecord) {
  return Boolean(app.respondedAt) || app.status !== "APPLIED";
}

export async function getDashboard(userId: string): Promise<DashboardData> {
  const apps = await loadApplications(userId, null);
  const ids = new Set(apps.map((app) => app.id));
  const history = await loadStageHistory(userId, ids);

  const total = apps.length;
  const active = apps.filter((app) => !["ACCEPTED", "REJECTED"].includes(app.status)).length;
  const interviewCount = apps.filter((app) =>
    ["INTERVIEW", "TECHNICAL_TEST", "OFFER", "ACCEPTED"].includes(app.status),
  ).length;
  const offers = apps.filter((app) => ["OFFER", "ACCEPTED"].includes(app.status)).length;
  const accepted = apps.filter((app) => app.status === "ACCEPTED").length;
  const rejections = apps.filter((app) => app.status === "REJECTED").length;
  const responses = apps.filter(respondedCheck).length;

  // last 12 ISO weeks of submissions + responses
  const weeks: { period: string; label: string; applications: number; responses: number }[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i -= 1) {
    const ref = new Date(now.getTime() - i * 7 * 86_400_000);
    const key = weekKey(ref);
    weeks.push({
      period: key,
      label: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(key)),
      applications: 0,
      responses: 0,
    });
  }
  const weekIndex = new Map(weeks.map((week, index) => [week.period, index]));
  for (const app of apps) {
    const key = weekKey(new Date(`${app.appliedDate}T12:00:00`));
    const index = weekIndex.get(key);
    if (index !== undefined) weeks[index].applications += 1;
    if (app.respondedAt) {
      const rKey = weekKey(app.respondedAt);
      const rIndex = weekIndex.get(rKey);
      if (rIndex !== undefined) weeks[rIndex].responses += 1;
    }
  }

  const recentActivityRows = await db
    .select({
      activity: activitiesTable,
      company: companies.name,
      position: applications.position,
    })
    .from(activitiesTable)
    .leftJoin(applications, eq(applications.id, activitiesTable.applicationId))
    .leftJoin(companies, eq(companies.id, applications.companyId))
    .where(eq(activitiesTable.userId, userId))
    .orderBy(desc(activitiesTable.occurredAt))
    .limit(8);

  const recentActivity: ActivityDTO[] = recentActivityRows.map((row) => ({
    id: row.activity.id,
    applicationId: row.activity.applicationId,
    type: row.activity.type,
    message: row.activity.message,
    fromStatus: row.activity.fromStatus,
    toStatus: row.activity.toStatus,
    occurredAt: row.activity.occurredAt.toISOString(),
    company: row.company,
    position: row.position,
  }));

  const upcomingRows = await db
    .select({ interview: interviews, company: companies.name, position: applications.position })
    .from(interviews)
    .innerJoin(applications, eq(applications.id, interviews.applicationId))
    .innerJoin(companies, eq(companies.id, applications.companyId))
    .where(and(eq(interviews.userId, userId), eq(interviews.completed, false)))
    .orderBy(asc(interviews.scheduledAt))
    .limit(5);

  const upcomingInterviews: InterviewDTO[] = upcomingRows.map((row) => ({
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

  const reminderRows = await db
    .select({ reminder: reminders, company: companies.name, position: applications.position })
    .from(reminders)
    .leftJoin(applications, eq(applications.id, reminders.applicationId))
    .leftJoin(companies, eq(companies.id, applications.companyId))
    .where(and(eq(reminders.userId, userId), eq(reminders.completed, false)))
    .orderBy(asc(reminders.dueDate))
    .limit(5);

  const dueReminders: ReminderDTO[] = reminderRows.map((row) => ({
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

  return {
    kpis: {
      total,
      active,
      interviews: interviewCount,
      offers,
      rejections,
      accepted,
      responseRate: total > 0 ? Math.round((responses / total) * 100) : 0,
    },
    funnel: computeFunnel(apps, history),
    overTime: weeks,
    timeInStage: computeTimeInStage(apps, history),
    recentActivity,
    upcomingInterviews,
    dueReminders,
    statusBreakdown: (Object.keys(STATUS_META) as ApplicationStatus[]).map((status) => ({
      status,
      label: STATUS_META[status].label,
      count: apps.filter((app) => app.status === status).length,
    })),
  };
}

export async function getAnalytics(userId: string, range: Range): Promise<AnalyticsData> {
  const start = rangeStart(range);
  const apps = await loadApplications(userId, start);
  const ids = new Set(apps.map((app) => app.id));
  const history = await loadStageHistory(userId, ids);

  const total = apps.length;
  const responses = apps.filter(respondedCheck).length;
  const interviewsReached = apps.filter((app) => {
    const entries = history.get(app.id) ?? [];
    return (
      ["INTERVIEW", "TECHNICAL_TEST", "OFFER", "ACCEPTED"].includes(app.status) ||
      entries.some((entry) => ["INTERVIEW", "TECHNICAL_TEST", "OFFER", "ACCEPTED"].includes(entry.status))
    );
  }).length;
  const offers = apps.filter((app) => {
    const entries = history.get(app.id) ?? [];
    return (
      ["OFFER", "ACCEPTED"].includes(app.status) ||
      entries.some((entry) => ["OFFER", "ACCEPTED"].includes(entry.status))
    );
  }).length;
  const rejections = apps.filter((app) => app.status === "REJECTED").length;

  const responseDurations = apps
    .filter((app) => app.respondedAt)
    .map(
      (app) =>
        (app.respondedAt!.getTime() - new Date(`${app.appliedDate}T12:00:00`).getTime()) / 86_400_000,
    )
    .filter((days) => days >= 0);
  const avgResponseDays =
    responseDurations.length > 0
      ? Math.round((responseDurations.reduce((a, b) => a + b, 0) / responseDurations.length) * 10) / 10
      : null;

  // applications per month across the selected window
  const monthMap = new Map<string, number>();
  for (const app of apps) {
    const key = app.appliedDate.slice(0, 7);
    monthMap.set(key, (monthMap.get(key) ?? 0) + 1);
  }
  const perMonth = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([period, applicationsCount]) => ({
      period,
      label: new Intl.DateTimeFormat("en-US", { month: "short", year: "2-digit" }).format(
        new Date(`${period}-01T12:00:00`),
      ),
      applications: applicationsCount,
    }));

  const pct = (value: number) => (total > 0 ? Math.round((value / total) * 1000) / 10 : 0);

  return {
    range,
    totals: {
      applications: total,
      responses,
      interviews: interviewsReached,
      offers,
      rejections,
      responseRate: pct(responses),
      interviewRate: pct(interviewsReached),
      offerRate: pct(offers),
      avgResponseDays,
    },
    perMonth,
    bySource: groupCount(apps, (app) => app.source, (key) => SOURCE_LABEL[key]),
    byStatus: groupCount(apps, (app) => app.status, (key) => STATUS_META[key].label),
    byLocationType: groupCount(apps, (app) => app.locationType, (key) => LOCATION_TYPE_LABEL[key]),
    byEmploymentType: groupCount(
      apps,
      (app) => app.employmentType,
      (key) => EMPLOYMENT_TYPE_LABEL[key],
    ),
    byLocation: groupCount(
      apps,
      (app) => (app.location?.trim() || "Not specified") as string,
      (key) => key,
    ).slice(0, 8),
    timeInStage: computeTimeInStage(apps, history),
    funnel: computeFunnel(apps, history),
  };
}

export async function countUnreadNotifications(userId: string) {
  const [row] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(activitiesTable)
    .where(eq(activitiesTable.userId, userId));
  return row?.count ?? 0;
}
