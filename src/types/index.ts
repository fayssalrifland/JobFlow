import type {
  ApplicationStatus,
  EmploymentType,
  InterviewType,
  LocationType,
  Priority,
  Source,
} from "@/lib/constants";

export type CompanyDTO = {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  accent: string;
};

export type ContactDTO = {
  id: string;
  name: string;
  email: string | null;
  linkedinUrl: string | null;
};

export type CvDTO = {
  id: string;
  name: string;
  version: string | null;
  notes: string | null;
  fileName: string | null;
  fileType: string | null;
  fileSize: number | null;
  hasFile: boolean;
  isDefault: boolean;
  createdAt: string;
  usageCount?: number;
};

export type InterviewDTO = {
  id: string;
  applicationId: string;
  type: InterviewType;
  scheduledAt: string;
  durationMinutes: number;
  meetingUrl: string | null;
  interviewers: string | null;
  notes: string | null;
  completed: boolean;
  company?: string;
  position?: string;
};

export type ReminderDTO = {
  id: string;
  applicationId: string | null;
  title: string;
  notes: string | null;
  dueDate: string;
  completed: boolean;
  completedAt: string | null;
  company?: string | null;
  position?: string | null;
};

export type ActivityDTO = {
  id: string;
  applicationId: string | null;
  type: string;
  message: string;
  fromStatus: ApplicationStatus | null;
  toStatus: ApplicationStatus | null;
  occurredAt: string;
  company?: string | null;
  position?: string | null;
};

export type NotificationDTO = {
  id: string;
  type: "INTERVIEW" | "REMINDER" | "STATUS" | "SYSTEM";
  title: string;
  body: string | null;
  href: string | null;
  read: boolean;
  createdAt: string;
};

export type ApplicationDTO = {
  id: string;
  position: string;
  location: string | null;
  locationType: LocationType;
  employmentType: EmploymentType;
  jobUrl: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  currency: string;
  appliedDate: string;
  status: ApplicationStatus;
  priority: Priority;
  source: Source;
  jobDescription: string | null;
  coverLetter: string | null;
  notes: string | null;
  nextFollowUpDate: string | null;
  statusChangedAt: string;
  createdAt: string;
  updatedAt: string;
  company: CompanyDTO;
  contact: ContactDTO | null;
  cv: { id: string; name: string } | null;
  tags: string[];
  nextInterview: { id: string; type: InterviewType; scheduledAt: string } | null;
};

export type ApplicationDetailDTO = ApplicationDTO & {
  interviews: InterviewDTO[];
  activities: ActivityDTO[];
  reminders: ReminderDTO[];
};

export type ApplicationListResponse = {
  items: ApplicationDTO[];
  total: number;
  page: number;
  pageSize: number;
};

export type SessionUserDTO = {
  id: string;
  name: string;
  email: string;
  headline: string | null;
  theme: "light" | "dark" | "system";
  defaultCurrency: string;
  defaultView: "kanban" | "list";
  emailReminders: boolean;
  inAppNotifications: boolean;
  isDemo: boolean;
};

export type DashboardData = {
  kpis: {
    total: number;
    active: number;
    interviews: number;
    offers: number;
    rejections: number;
    responseRate: number;
    accepted: number;
  };
  funnel: { stage: ApplicationStatus; label: string; count: number; rate: number }[];
  overTime: { period: string; label: string; applications: number; responses: number }[];
  timeInStage: { stage: ApplicationStatus; label: string; days: number; samples: number }[];
  recentActivity: ActivityDTO[];
  upcomingInterviews: InterviewDTO[];
  dueReminders: ReminderDTO[];
  statusBreakdown: { status: ApplicationStatus; label: string; count: number }[];
};

export type AnalyticsData = {
  range: string;
  totals: {
    applications: number;
    responses: number;
    interviews: number;
    offers: number;
    rejections: number;
    responseRate: number;
    interviewRate: number;
    offerRate: number;
    avgResponseDays: number | null;
  };
  perMonth: { period: string; label: string; applications: number }[];
  bySource: { key: string; label: string; count: number }[];
  byStatus: { key: string; label: string; count: number }[];
  byLocationType: { key: string; label: string; count: number }[];
  byEmploymentType: { key: string; label: string; count: number }[];
  byLocation: { key: string; label: string; count: number }[];
  timeInStage: { stage: ApplicationStatus; label: string; days: number; samples: number }[];
  funnel: { stage: ApplicationStatus; label: string; count: number; rate: number }[];
};
