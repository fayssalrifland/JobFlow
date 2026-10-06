import { z } from "zod";
import {
  APPLICATION_STATUSES,
  CURRENCIES,
  EMPLOYMENT_TYPES,
  INTERVIEW_TYPES,
  LOCATION_TYPES,
  PRIORITIES,
  SOURCES,
} from "@/lib/constants";

const str = z.string().trim();
const dateRe = /^\d{4}-\d{2}-\d{2}$/;
const timeRe = /^\d{2}:\d{2}$/;

const optionalUrl = z.union([z.literal(""), z.url("Enter a valid URL (https://…)")]).optional();
const optionalEmail = z.union([z.literal(""), z.email("Enter a valid email address")]).optional();
const optionalDate = z
  .union([z.literal(""), str.regex(dateRe, "Use the date picker")])
  .optional();
const money = z
  .union([z.literal(""), str.regex(/^\d{1,9}$/, "Use digits only")])
  .optional();

/* ---------------------------------- auth ---------------------------------- */

export const registerSchema = z
  .object({
    name: str.min(2, "Tell us your name").max(80),
    email: z.email("Enter a valid email address"),
    password: str.min(8, "Use at least 8 characters").max(100),
    confirmPassword: str.min(8, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.email("Enter a valid email address"),
  password: str.min(1, "Enter your password"),
});

export type RegisterValues = z.infer<typeof registerSchema>;
export type LoginValues = z.infer<typeof loginSchema>;

/* ------------------------------ applications ------------------------------ */

export const applicationFormSchema = z
  .object({
    company: str.min(1, "Company is required").max(120),
    position: str.min(1, "Position is required").max(120),
    location: str.max(120).optional(),
    locationType: z.enum(LOCATION_TYPES),
    employmentType: z.enum(EMPLOYMENT_TYPES),
    jobUrl: optionalUrl,
    appliedDate: str.regex(dateRe, "Application date is required"),
    status: z.enum(APPLICATION_STATUSES),
    priority: z.enum(PRIORITIES),
    source: z.enum(SOURCES),
    salaryMin: money,
    salaryMax: money,
    currency: z.enum(CURRENCIES),
    contactName: str.max(120).optional(),
    contactEmail: optionalEmail,
    contactLinkedin: optionalUrl,
    nextFollowUpDate: optionalDate,
    cvId: str.optional(),
    tags: z.array(str.min(1).max(24)).max(12).optional(),
    notes: str.max(5000).optional(),
    jobDescription: str.max(20000).optional(),
    coverLetter: str.max(20000).optional(),
  })
  .refine(
    (data) =>
      !data.salaryMin || !data.salaryMax || Number(data.salaryMax) >= Number(data.salaryMin),
    { message: "Maximum salary must be greater than the minimum", path: ["salaryMax"] },
  );

export type ApplicationFormValues = z.infer<typeof applicationFormSchema>;

export const statusUpdateSchema = z.object({
  status: z.enum(APPLICATION_STATUSES),
});

export const applicationQuerySchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  locationType: z.string().optional(),
  employmentType: z.string().optional(),
  tags: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  salaryMin: z.string().optional(),
  salaryMax: z.string().optional(),
  sort: z.string().optional(),
  page: z.string().optional(),
  pageSize: z.string().optional(),
});

/* -------------------------------- interviews ------------------------------- */

export const interviewFormSchema = z.object({
  applicationId: z.uuid("Pick an application"),
  type: z.enum(INTERVIEW_TYPES),
  date: str.regex(dateRe, "Pick a date"),
  time: str.regex(timeRe, "Pick a time"),
  durationMinutes: z.union([z.literal(""), str.regex(/^\d{1,3}$/, "Minutes only")]).optional(),
  meetingUrl: optionalUrl,
  interviewers: str.max(240).optional(),
  notes: str.max(2000).optional(),
  completed: z.boolean().optional(),
});

export type InterviewFormValues = z.infer<typeof interviewFormSchema>;

/* -------------------------------- reminders -------------------------------- */

export const reminderFormSchema = z.object({
  title: str.min(1, "What should we remind you about?").max(160),
  applicationId: str.optional(),
  date: str.regex(dateRe, "Pick a date"),
  time: z.union([z.literal(""), str.regex(timeRe, "Pick a time")]).optional(),
  notes: str.max(1000).optional(),
});

export type ReminderFormValues = z.infer<typeof reminderFormSchema>;

export const reminderPatchSchema = z.object({
  completed: z.boolean().optional(),
  title: str.min(1).max(160).optional(),
  dueDate: z.string().optional(),
  notes: z.string().max(1000).optional(),
});

/* ----------------------------------- cvs ----------------------------------- */

export const cvFormSchema = z.object({
  name: str.min(2, "Give this CV a recognisable name").max(120),
  version: str.max(40).optional(),
  notes: str.max(500).optional(),
  fileName: str.max(200).optional(),
  fileType: str.max(100).optional(),
  fileSize: z.number().int().max(4_000_000, "Files must be smaller than 4 MB").optional(),
  fileData: z.string().max(6_000_000).optional(),
  isDefault: z.boolean().optional(),
});

export type CvFormValues = z.infer<typeof cvFormSchema>;

/* -------------------------------- activities ------------------------------- */

export const activityFormSchema = z.object({
  message: str.min(2, "Describe what happened").max(240),
  occurredAt: optionalDate,
});

export type ActivityFormValues = z.infer<typeof activityFormSchema>;

/* --------------------------------- settings -------------------------------- */

export const profileSchema = z.object({
  name: str.min(2, "Name is too short").max(80),
  email: z.email("Enter a valid email address"),
  headline: str.max(120).optional(),
});

export const passwordSchema = z
  .object({
    currentPassword: str.min(1, "Enter your current password"),
    newPassword: str.min(8, "Use at least 8 characters").max(100),
    confirmPassword: str.min(8, "Confirm the new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const preferencesSchema = z.object({
  theme: z.enum(["light", "dark", "system"]).optional(),
  defaultCurrency: z.enum(CURRENCIES).optional(),
  defaultView: z.enum(["kanban", "list"]).optional(),
  emailReminders: z.boolean().optional(),
  inAppNotifications: z.boolean().optional(),
});

export type ProfileValues = z.infer<typeof profileSchema>;
export type PasswordValues = z.infer<typeof passwordSchema>;
export type PreferencesValues = z.infer<typeof preferencesSchema>;
