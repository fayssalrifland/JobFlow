import { and, asc, desc, eq, gte, ilike, inArray, lte, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db";
import {
  applicationTags,
  applications,
  activities as activitiesTable,
  companies,
  contacts,
  cvs,
  interviews,
  reminders,
  tags as tagsTable,
} from "@/db/schema";
import { HttpError } from "@/lib/http";
import { logActivity, notify } from "@/server/activity";
import { ACCENTS, STATUS_META, type ApplicationStatus } from "@/lib/constants";
import type { ApplicationFormValues } from "@/lib/validation";
import type {
  ActivityDTO,
  ApplicationDTO,
  ApplicationDetailDTO,
  ApplicationListResponse,
  InterviewDTO,
  ReminderDTO,
} from "@/types";

const baseSelection = {
  application: applications,
  company: companies,
  contact: contacts,
  cv: { id: cvs.id, name: cvs.name },
};

type Row = {
  application: typeof applications.$inferSelect;
  company: typeof companies.$inferSelect;
  contact: typeof contacts.$inferSelect | null;
  cv: { id: string | null; name: string | null } | null;
};

function toIso(value: Date | string | null): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function mapRow(
  row: Row,
  tagMap: Map<string, string[]>,
  interviewMap: Map<string, { id: string; type: InterviewDTO["type"]; scheduledAt: string }>,
): ApplicationDTO {
  const a = row.application;
  return {
    id: a.id,
    position: a.position,
    location: a.location,
    locationType: a.locationType,
    employmentType: a.employmentType,
    jobUrl: a.jobUrl,
    salaryMin: a.salaryMin,
    salaryMax: a.salaryMax,
    currency: a.currency,
    appliedDate: a.appliedDate,
    status: a.status,
    priority: a.priority,
    source: a.source,
    jobDescription: a.jobDescription,
    coverLetter: a.coverLetter,
    notes: a.notes,
    nextFollowUpDate: a.nextFollowUpDate,
    statusChangedAt: toIso(a.statusChangedAt)!,
    createdAt: toIso(a.createdAt)!,
    updatedAt: toIso(a.updatedAt)!,
    company: {
      id: row.company.id,
      name: row.company.name,
      website: row.company.website,
      industry: row.company.industry,
      accent: row.company.accent,
    },
    contact: row.contact?.id
      ? {
          id: row.contact.id,
          name: row.contact.name,
          email: row.contact.email,
          linkedinUrl: row.contact.linkedinUrl,
        }
      : null,
    cv: row.cv?.id && row.cv.name ? { id: row.cv.id, name: row.cv.name } : null,
    tags: tagMap.get(a.id) ?? [],
    nextInterview: interviewMap.get(a.id) ?? null,
  };
}

async function loadTagMap(applicationIds: string[]) {
  const map = new Map<string, string[]>();
  if (applicationIds.length === 0) return map;
  const rows = await db
    .select({ applicationId: applicationTags.applicationId, label: tagsTable.label })
    .from(applicationTags)
    .innerJoin(tagsTable, eq(tagsTable.id, applicationTags.tagId))
    .where(inArray(applicationTags.applicationId, applicationIds));
  for (const row of rows) {
    const list = map.get(row.applicationId) ?? [];
    list.push(row.label);
    map.set(row.applicationId, list);
  }
  return map;
}

async function loadNextInterviews(applicationIds: string[]) {
  const map = new Map<string, { id: string; type: InterviewDTO["type"]; scheduledAt: string }>();
  if (applicationIds.length === 0) return map;
  const rows = await db
    .select({
      id: interviews.id,
      applicationId: interviews.applicationId,
      type: interviews.type,
      scheduledAt: interviews.scheduledAt,
    })
    .from(interviews)
    .where(and(inArray(interviews.applicationId, applicationIds), eq(interviews.completed, false)))
    .orderBy(asc(interviews.scheduledAt));
  for (const row of rows) {
    if (!map.has(row.applicationId)) {
      map.set(row.applicationId, {
        id: row.id,
        type: row.type,
        scheduledAt: row.scheduledAt.toISOString(),
      });
    }
  }
  return map;
}

export type ApplicationQuery = {
  search?: string;
  status?: string;
  priority?: string;
  locationType?: string;
  employmentType?: string;
  tags?: string;
  from?: string;
  to?: string;
  salaryMin?: string;
  salaryMax?: string;
  sort?: string;
  page?: string;
  pageSize?: string;
};

function csv(value?: string) {
  return (value ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export async function listApplications(
  userId: string,
  query: ApplicationQuery,
): Promise<ApplicationListResponse> {
  const filters: SQL[] = [eq(applications.userId, userId)];

  const search = query.search?.trim();
  if (search) {
    const pattern = `%${search}%`;
    const clause = or(
      ilike(companies.name, pattern),
      ilike(applications.position, pattern),
      ilike(applications.location, pattern),
      ilike(contacts.name, pattern),
      ilike(contacts.email, pattern),
    );
    if (clause) filters.push(clause);
  }

  const statuses = csv(query.status) as ApplicationStatus[];
  if (statuses.length) filters.push(inArray(applications.status, statuses));

  const priorities = csv(query.priority) as ("LOW" | "MEDIUM" | "HIGH")[];
  if (priorities.length) filters.push(inArray(applications.priority, priorities));

  const locationTypes = csv(query.locationType) as ("REMOTE" | "HYBRID" | "ONSITE")[];
  if (locationTypes.length) filters.push(inArray(applications.locationType, locationTypes));

  const employmentTypes = csv(query.employmentType) as (
    | "FULL_TIME"
    | "PART_TIME"
    | "CONTRACT"
    | "INTERNSHIP"
    | "FREELANCE"
  )[];
  if (employmentTypes.length) filters.push(inArray(applications.employmentType, employmentTypes));

  if (query.from) filters.push(gte(applications.appliedDate, query.from));
  if (query.to) filters.push(lte(applications.appliedDate, query.to));

  if (query.salaryMin) {
    filters.push(gte(sql`coalesce(${applications.salaryMax}, ${applications.salaryMin}, 0)`, Number(query.salaryMin)));
  }
  if (query.salaryMax) {
    filters.push(lte(sql`coalesce(${applications.salaryMin}, ${applications.salaryMax}, 0)`, Number(query.salaryMax)));
  }

  const tagList = csv(query.tags);
  if (tagList.length) {
    filters.push(
      sql`exists (select 1 from ${applicationTags} at inner join ${tagsTable} t on t.id = at.tag_id where at.application_id = ${applications.id} and t.label in (${sql.join(
        tagList.map((tag) => sql`${tag}`),
        sql`, `,
      )}))`,
    );
  }

  const where = and(...filters);

  const orderBy = (() => {
    switch (query.sort) {
      case "oldest":
        return [asc(applications.appliedDate), asc(applications.createdAt)];
      case "company":
        return [asc(companies.name)];
      case "salary":
        return [desc(sql`coalesce(${applications.salaryMax}, ${applications.salaryMin}, 0)`)];
      case "priority":
        return [
          desc(sql`case ${applications.priority} when 'HIGH' then 3 when 'MEDIUM' then 2 else 1 end`),
          desc(applications.appliedDate),
        ];
      case "updated":
        return [desc(applications.updatedAt)];
      default:
        return [desc(applications.appliedDate), desc(applications.createdAt)];
    }
  })();

  const page = Math.max(1, Number(query.page ?? "1") || 1);
  const pageSize = Math.min(200, Math.max(1, Number(query.pageSize ?? "100") || 100));

  const rows = (await db
    .select(baseSelection)
    .from(applications)
    .innerJoin(companies, eq(companies.id, applications.companyId))
    .leftJoin(contacts, eq(contacts.id, applications.contactId))
    .leftJoin(cvs, eq(cvs.id, applications.cvId))
    .where(where)
    .orderBy(...orderBy)
    .limit(pageSize)
    .offset((page - 1) * pageSize)) as Row[];

  const [{ total }] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(applications)
    .innerJoin(companies, eq(companies.id, applications.companyId))
    .leftJoin(contacts, eq(contacts.id, applications.contactId))
    .where(where);

  const ids = rows.map((row) => row.application.id);
  const [tagMap, interviewMap] = await Promise.all([loadTagMap(ids), loadNextInterviews(ids)]);

  return {
    items: rows.map((row) => mapRow(row, tagMap, interviewMap)),
    total,
    page,
    pageSize,
  };
}

export async function getApplicationDetail(
  userId: string,
  id: string,
): Promise<ApplicationDetailDTO> {
  const rows = (await db
    .select(baseSelection)
    .from(applications)
    .innerJoin(companies, eq(companies.id, applications.companyId))
    .leftJoin(contacts, eq(contacts.id, applications.contactId))
    .leftJoin(cvs, eq(cvs.id, applications.cvId))
    .where(and(eq(applications.id, id), eq(applications.userId, userId)))
    .limit(1)) as Row[];

  const row = rows[0];
  if (!row) throw new HttpError(404, "Application not found");

  const [tagMap, interviewMap] = await Promise.all([loadTagMap([id]), loadNextInterviews([id])]);
  const base = mapRow(row, tagMap, interviewMap);

  const [interviewRows, activityRows, reminderRows] = await Promise.all([
    db.select().from(interviews).where(eq(interviews.applicationId, id)).orderBy(asc(interviews.scheduledAt)),
    db
      .select()
      .from(activitiesTable)
      .where(eq(activitiesTable.applicationId, id))
      .orderBy(desc(activitiesTable.occurredAt)),
    db.select().from(reminders).where(eq(reminders.applicationId, id)).orderBy(asc(reminders.dueDate)),
  ]);

  const interviewDtos: InterviewDTO[] = interviewRows.map((i) => ({
    id: i.id,
    applicationId: i.applicationId,
    type: i.type,
    scheduledAt: i.scheduledAt.toISOString(),
    durationMinutes: i.durationMinutes,
    meetingUrl: i.meetingUrl,
    interviewers: i.interviewers,
    notes: i.notes,
    completed: i.completed,
    company: base.company.name,
    position: base.position,
  }));

  const activityDtos: ActivityDTO[] = activityRows.map((a) => ({
    id: a.id,
    applicationId: a.applicationId,
    type: a.type,
    message: a.message,
    fromStatus: a.fromStatus,
    toStatus: a.toStatus,
    occurredAt: a.occurredAt.toISOString(),
  }));

  const reminderDtos: ReminderDTO[] = reminderRows.map((r) => ({
    id: r.id,
    applicationId: r.applicationId,
    title: r.title,
    notes: r.notes,
    dueDate: r.dueDate.toISOString(),
    completed: r.completed,
    completedAt: r.completedAt ? r.completedAt.toISOString() : null,
  }));

  return { ...base, interviews: interviewDtos, activities: activityDtos, reminders: reminderDtos };
}

export async function ensureCompany(userId: string, name: string) {
  const trimmed = name.trim();
  const [existing] = await db
    .select()
    .from(companies)
    .where(and(eq(companies.userId, userId), ilike(companies.name, trimmed)))
    .limit(1);
  if (existing) return existing;
  const accent = ACCENTS[Math.abs(hash(trimmed)) % ACCENTS.length];
  const [created] = await db
    .insert(companies)
    .values({ userId, name: trimmed, accent })
    .returning();
  return created;
}

function hash(value: string) {
  let h = 0;
  for (let i = 0; i < value.length; i += 1) h = (h << 5) - h + value.charCodeAt(i);
  return h;
}

async function syncTags(userId: string, applicationId: string, labels: string[]) {
  await db.delete(applicationTags).where(eq(applicationTags.applicationId, applicationId));
  const unique = Array.from(new Set(labels.map((label) => label.trim()).filter(Boolean))).slice(0, 12);
  if (unique.length === 0) return;
  const ids: string[] = [];
  for (const label of unique) {
    const [existing] = await db
      .select()
      .from(tagsTable)
      .where(and(eq(tagsTable.userId, userId), eq(tagsTable.label, label)))
      .limit(1);
    if (existing) {
      ids.push(existing.id);
    } else {
      const [created] = await db.insert(tagsTable).values({ userId, label }).returning();
      ids.push(created.id);
    }
  }
  await db.insert(applicationTags).values(ids.map((tagId) => ({ applicationId, tagId })));
}

async function syncContact(
  userId: string,
  companyId: string,
  values: ApplicationFormValues,
  existingContactId?: string | null,
) {
  const name = values.contactName?.trim();
  const email = values.contactEmail?.trim() || null;
  const linkedinUrl = values.contactLinkedin?.trim() || null;
  if (!name) return null;
  if (existingContactId) {
    await db
      .update(contacts)
      .set({ name, email, linkedinUrl, companyId })
      .where(and(eq(contacts.id, existingContactId), eq(contacts.userId, userId)));
    return existingContactId;
  }
  const [created] = await db
    .insert(contacts)
    .values({ userId, companyId, name, email, linkedinUrl })
    .returning();
  return created.id;
}

function num(value?: string) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function createApplication(userId: string, values: ApplicationFormValues) {
  const company = await ensureCompany(userId, values.company);
  const contactId = await syncContact(userId, company.id, values);
  const isResponse = values.status !== "APPLIED";

  const [created] = await db
    .insert(applications)
    .values({
      userId,
      companyId: company.id,
      contactId,
      cvId: values.cvId ? values.cvId : null,
      position: values.position,
      location: values.location || null,
      locationType: values.locationType,
      employmentType: values.employmentType,
      jobUrl: values.jobUrl || null,
      salaryMin: num(values.salaryMin),
      salaryMax: num(values.salaryMax),
      currency: values.currency,
      appliedDate: values.appliedDate,
      status: values.status,
      priority: values.priority,
      source: values.source,
      jobDescription: values.jobDescription || null,
      coverLetter: values.coverLetter || null,
      notes: values.notes || null,
      nextFollowUpDate: values.nextFollowUpDate || null,
      respondedAt: isResponse ? new Date() : null,
    })
    .returning();

  await syncTags(userId, created.id, values.tags ?? []);
  await logActivity({
    userId,
    applicationId: created.id,
    type: "APPLICATION_CREATED",
    message: `Created application for ${values.position} at ${company.name}`,
    toStatus: values.status,
    occurredAt: new Date(`${values.appliedDate}T09:00:00`),
  });

  return getApplicationDetail(userId, created.id);
}

export async function updateApplication(
  userId: string,
  id: string,
  values: ApplicationFormValues,
) {
  const [existing] = await db
    .select()
    .from(applications)
    .where(and(eq(applications.id, id), eq(applications.userId, userId)))
    .limit(1);
  if (!existing) throw new HttpError(404, "Application not found");

  const company = await ensureCompany(userId, values.company);
  const contactId = await syncContact(userId, company.id, values, existing.contactId);
  const statusChanged = existing.status !== values.status;

  await db
    .update(applications)
    .set({
      companyId: company.id,
      contactId,
      cvId: values.cvId ? values.cvId : null,
      position: values.position,
      location: values.location || null,
      locationType: values.locationType,
      employmentType: values.employmentType,
      jobUrl: values.jobUrl || null,
      salaryMin: num(values.salaryMin),
      salaryMax: num(values.salaryMax),
      currency: values.currency,
      appliedDate: values.appliedDate,
      status: values.status,
      priority: values.priority,
      source: values.source,
      jobDescription: values.jobDescription || null,
      coverLetter: values.coverLetter || null,
      notes: values.notes || null,
      nextFollowUpDate: values.nextFollowUpDate || null,
      statusChangedAt: statusChanged ? new Date() : existing.statusChangedAt,
      respondedAt:
        existing.respondedAt ?? (values.status !== "APPLIED" ? new Date() : null),
      updatedAt: new Date(),
    })
    .where(eq(applications.id, id));

  await syncTags(userId, id, values.tags ?? []);

  if (statusChanged) {
    await logActivity({
      userId,
      applicationId: id,
      type: "STATUS_CHANGED",
      message: `Moved ${values.position} at ${company.name} from ${STATUS_META[existing.status].label} → ${STATUS_META[values.status].label}`,
      fromStatus: existing.status,
      toStatus: values.status,
    });
  } else {
    await logActivity({
      userId,
      applicationId: id,
      type: "APPLICATION_UPDATED",
      message: `Updated details for ${values.position} at ${company.name}`,
    });
  }

  return getApplicationDetail(userId, id);
}

export async function updateApplicationStatus(
  userId: string,
  id: string,
  status: ApplicationStatus,
) {
  const [existing] = await db
    .select({ application: applications, company: companies })
    .from(applications)
    .innerJoin(companies, eq(companies.id, applications.companyId))
    .where(and(eq(applications.id, id), eq(applications.userId, userId)))
    .limit(1);
  if (!existing) throw new HttpError(404, "Application not found");

  const previous = existing.application.status;
  if (previous === status) return getApplicationDetail(userId, id);

  await db
    .update(applications)
    .set({
      status,
      statusChangedAt: new Date(),
      respondedAt: existing.application.respondedAt ?? (status !== "APPLIED" ? new Date() : null),
      updatedAt: new Date(),
    })
    .where(eq(applications.id, id));

  const message = `Moved ${existing.application.position} at ${existing.company.name} from ${STATUS_META[previous].label} → ${STATUS_META[status].label}`;

  await logActivity({
    userId,
    applicationId: id,
    type: "STATUS_CHANGED",
    message,
    fromStatus: previous,
    toStatus: status,
  });

  await notify({
    userId,
    type: "STATUS",
    title: `${existing.application.position} → ${STATUS_META[status].label}`,
    body: message,
    href: `/app/applications/${id}`,
  });

  return getApplicationDetail(userId, id);
}

export async function deleteApplication(userId: string, id: string) {
  const [existing] = await db
    .select()
    .from(applications)
    .where(and(eq(applications.id, id), eq(applications.userId, userId)))
    .limit(1);
  if (!existing) throw new HttpError(404, "Application not found");
  await db.delete(applications).where(eq(applications.id, id));
  return { id };
}
