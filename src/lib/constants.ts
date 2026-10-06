export const APPLICATION_STATUSES = [
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "TECHNICAL_TEST",
  "OFFER",
  "ACCEPTED",
  "REJECTED",
] as const;

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number];

/** Stages that make up the forward funnel (REJECTED is a terminal side state). */
export const FUNNEL_STAGES = [
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "TECHNICAL_TEST",
  "OFFER",
  "ACCEPTED",
] as const;

export const ACTIVE_STATUSES: ApplicationStatus[] = [
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "TECHNICAL_TEST",
  "OFFER",
];

export const STATUS_META: Record<
  ApplicationStatus,
  { label: string; short: string; dot: string; chip: string; bar: string }
> = {
  APPLIED: {
    label: "Applied",
    short: "Applied",
    dot: "bg-slate-400",
    chip: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
    bar: "#94a3b8",
  },
  SCREENING: {
    label: "Screening",
    short: "Screening",
    dot: "bg-sky-500",
    chip: "bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
    bar: "#0ea5e9",
  },
  INTERVIEW: {
    label: "Interview",
    short: "Interview",
    dot: "bg-indigo-500",
    chip: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
    bar: "#6366f1",
  },
  TECHNICAL_TEST: {
    label: "Technical Test",
    short: "Tech test",
    dot: "bg-violet-500",
    chip: "bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
    bar: "#8b5cf6",
  },
  OFFER: {
    label: "Offer",
    short: "Offer",
    dot: "bg-amber-500",
    chip: "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
    bar: "#f59e0b",
  },
  ACCEPTED: {
    label: "Accepted",
    short: "Accepted",
    dot: "bg-emerald-500",
    chip: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
    bar: "#10b981",
  },
  REJECTED: {
    label: "Rejected",
    short: "Rejected",
    dot: "bg-rose-500",
    chip: "bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
    bar: "#f43f5e",
  },
};

export const PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;
export type Priority = (typeof PRIORITIES)[number];

export const PRIORITY_META: Record<Priority, { label: string; chip: string; weight: number }> = {
  LOW: { label: "Low", chip: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300", weight: 1 },
  MEDIUM: { label: "Medium", chip: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300", weight: 2 },
  HIGH: { label: "High", chip: "bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300", weight: 3 },
};

export const LOCATION_TYPES = ["REMOTE", "HYBRID", "ONSITE"] as const;
export type LocationType = (typeof LOCATION_TYPES)[number];
export const LOCATION_TYPE_LABEL: Record<LocationType, string> = {
  REMOTE: "Remote",
  HYBRID: "Hybrid",
  ONSITE: "On-site",
};

export const EMPLOYMENT_TYPES = [
  "FULL_TIME",
  "PART_TIME",
  "CONTRACT",
  "INTERNSHIP",
  "FREELANCE",
] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];
export const EMPLOYMENT_TYPE_LABEL: Record<EmploymentType, string> = {
  FULL_TIME: "Full-time",
  PART_TIME: "Part-time",
  CONTRACT: "Contract",
  INTERNSHIP: "Internship",
  FREELANCE: "Freelance",
};

export const SOURCES = [
  "LINKEDIN",
  "INDEED",
  "COMPANY_WEBSITE",
  "REFERRAL",
  "RECRUITER",
  "OTHER",
] as const;
export type Source = (typeof SOURCES)[number];
export const SOURCE_LABEL: Record<Source, string> = {
  LINKEDIN: "LinkedIn",
  INDEED: "Indeed",
  COMPANY_WEBSITE: "Company Website",
  REFERRAL: "Referral",
  RECRUITER: "Recruiter",
  OTHER: "Other",
};

export const INTERVIEW_TYPES = ["PHONE", "VIDEO", "TECHNICAL", "HR", "FINAL"] as const;
export type InterviewType = (typeof INTERVIEW_TYPES)[number];
export const INTERVIEW_TYPE_LABEL: Record<InterviewType, string> = {
  PHONE: "Phone interview",
  VIDEO: "Video interview",
  TECHNICAL: "Technical interview",
  HR: "HR interview",
  FINAL: "Final interview",
};

export const CURRENCIES = ["USD", "EUR", "GBP", "PLN", "CAD", "AUD", "CHF", "SEK"] as const;

export const CHART_COLORS = [
  "#6366f1",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#f43f5e",
  "#8b5cf6",
  "#14b8a6",
  "#64748b",
];

export const ACCENTS = [
  "indigo",
  "sky",
  "emerald",
  "amber",
  "rose",
  "violet",
  "teal",
  "slate",
] as const;

export const ACCENT_CLASS: Record<string, string> = {
  indigo: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  sky: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300",
  violet: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  teal: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300",
  slate: "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
};
