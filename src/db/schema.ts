import {
  boolean,
  date,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

/* ---------------------------------- enums --------------------------------- */

export const applicationStatusEnum = pgEnum("application_status", [
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "TECHNICAL_TEST",
  "OFFER",
  "ACCEPTED",
  "REJECTED",
]);

export const priorityEnum = pgEnum("priority", ["LOW", "MEDIUM", "HIGH"]);

export const locationTypeEnum = pgEnum("location_type", ["REMOTE", "HYBRID", "ONSITE"]);

export const employmentTypeEnum = pgEnum("employment_type", [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERNSHIP",
  "FREELANCE",
]);

export const sourceEnum = pgEnum("application_source", [
  "LINKEDIN",
  "INDEED",
  "COMPANY_WEBSITE",
  "REFERRAL",
  "RECRUITER",
  "OTHER",
]);

export const interviewTypeEnum = pgEnum("interview_type", [
  "PHONE",
  "VIDEO",
  "TECHNICAL",
  "HR",
  "FINAL",
]);

export const activityTypeEnum = pgEnum("activity_type", [
  "APPLICATION_CREATED",
  "STATUS_CHANGED",
  "APPLICATION_UPDATED",
  "INTERVIEW_SCHEDULED",
  "INTERVIEW_UPDATED",
  "NOTE_ADDED",
  "REMINDER_CREATED",
  "REMINDER_COMPLETED",
  "CUSTOM_EVENT",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "INTERVIEW",
  "REMINDER",
  "STATUS",
  "SYSTEM",
]);

export const themeEnum = pgEnum("theme", ["light", "dark", "system"]);
export const viewEnum = pgEnum("default_view", ["kanban", "list"]);

/* ---------------------------------- tables -------------------------------- */

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  headline: text("headline"),
  theme: themeEnum("theme").notNull().default("system"),
  defaultCurrency: text("default_currency").notNull().default("USD"),
  defaultView: viewEnum("default_view").notNull().default("kanban"),
  emailReminders: boolean("email_reminders").notNull().default(false),
  inAppNotifications: boolean("in_app_notifications").notNull().default(true),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const companies = pgTable(
  "companies",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    website: text("website"),
    industry: text("industry"),
    accent: text("accent").notNull().default("slate"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("companies_user_name_idx").on(table.userId, table.name)],
);

export const contacts = pgTable("contacts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  companyId: uuid("company_id").references(() => companies.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  email: text("email"),
  linkedinUrl: text("linkedin_url"),
  role: text("role"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const cvs = pgTable("cvs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  version: text("version"),
  notes: text("notes"),
  fileName: text("file_name"),
  fileType: text("file_type"),
  fileSize: integer("file_size"),
  fileData: text("file_data"),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const applications = pgTable("applications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  companyId: uuid("company_id")
    .notNull()
    .references(() => companies.id, { onDelete: "cascade" }),
  contactId: uuid("contact_id").references(() => contacts.id, { onDelete: "set null" }),
  cvId: uuid("cv_id").references(() => cvs.id, { onDelete: "set null" }),
  position: text("position").notNull(),
  location: text("location"),
  locationType: locationTypeEnum("location_type").notNull().default("REMOTE"),
  employmentType: employmentTypeEnum("employment_type").notNull().default("FULL_TIME"),
  jobUrl: text("job_url"),
  salaryMin: integer("salary_min"),
  salaryMax: integer("salary_max"),
  currency: text("currency").notNull().default("USD"),
  appliedDate: date("applied_date").notNull(),
  status: applicationStatusEnum("status").notNull().default("APPLIED"),
  priority: priorityEnum("priority").notNull().default("MEDIUM"),
  source: sourceEnum("source").notNull().default("OTHER"),
  jobDescription: text("job_description"),
  coverLetter: text("cover_letter"),
  notes: text("notes"),
  nextFollowUpDate: date("next_follow_up_date"),
  respondedAt: timestamp("responded_at", { withTimezone: true }),
  statusChangedAt: timestamp("status_changed_at", { withTimezone: true }).notNull().defaultNow(),
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const tags = pgTable(
  "tags",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("tags_user_label_idx").on(table.userId, table.label)],
);

export const applicationTags = pgTable(
  "application_tags",
  {
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.applicationId, table.tagId] })],
);

export const interviews = pgTable("interviews", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  applicationId: uuid("application_id")
    .notNull()
    .references(() => applications.id, { onDelete: "cascade" }),
  type: interviewTypeEnum("type").notNull().default("VIDEO"),
  scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(60),
  meetingUrl: text("meeting_url"),
  interviewers: text("interviewers"),
  notes: text("notes"),
  completed: boolean("completed").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const reminders = pgTable("reminders", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  notes: text("notes"),
  dueDate: timestamp("due_date", { withTimezone: true }).notNull(),
  completed: boolean("completed").notNull().default(false),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const activities = pgTable("activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  applicationId: uuid("application_id").references(() => applications.id, { onDelete: "cascade" }),
  type: activityTypeEnum("type").notNull(),
  message: text("message").notNull(),
  fromStatus: applicationStatusEnum("from_status"),
  toStatus: applicationStatusEnum("to_status"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: notificationTypeEnum("type").notNull().default("SYSTEM"),
  title: text("title").notNull(),
  body: text("body"),
  href: text("href"),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Company = typeof companies.$inferSelect;
export type Contact = typeof contacts.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type Interview = typeof interviews.$inferSelect;
export type Reminder = typeof reminders.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Cv = typeof cvs.$inferSelect;
export type Tag = typeof tags.$inferSelect;
