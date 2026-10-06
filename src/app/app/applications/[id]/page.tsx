"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  CalendarPlus,
  ExternalLink,
  Link2,
  Mail,
  Pencil,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { CompanyAvatar, PriorityBadge, StatusBadge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/dialog";
import { ErrorState, ListSkeleton } from "@/components/ui/feedback";
import { ActivityTimeline } from "@/components/applications/activity-timeline";
import { ApplicationFormDialog } from "@/components/applications/application-form-dialog";
import { JobDescriptionAnalysis } from "@/components/applications/job-description-analysis";
import { InterviewFormDialog } from "@/components/interviews/interview-form-dialog";
import { ReminderFormDialog } from "@/components/reminders/reminder-form-dialog";
import { useApplication, useDeleteApplication, useUpdateStatus } from "@/hooks/use-applications";
import { useUpdateInterview } from "@/hooks/use-interviews";
import {
  APPLICATION_STATUSES,
  EMPLOYMENT_TYPE_LABEL,
  INTERVIEW_TYPE_LABEL,
  LOCATION_TYPE_LABEL,
  SOURCE_LABEL,
  STATUS_META,
  type ApplicationStatus,
} from "@/lib/constants";
import { formatDate, formatDateTime, formatSalary, relativeDay } from "@/lib/utils";
import { appHref } from "@/services/api";

function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-slate-100 py-2.5 last:border-0 dark:border-slate-800">
      <dt className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="text-sm text-slate-800 dark:text-slate-200">{children}</dd>
    </div>
  );
}

export default function ApplicationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const { data, isLoading, isError, error, refetch } = useApplication(id);
  const updateStatus = useUpdateStatus();
  const remove = useDeleteApplication();
  const updateInterview = useUpdateInterview();

  const [editOpen, setEditOpen] = useState(false);
  const [interviewOpen, setInterviewOpen] = useState(false);
  const [reminderOpen, setReminderOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (isLoading) return <ListSkeleton rows={4} />;
  if (isError || !data) {
    return (
      <ErrorState
        title="Application not found"
        description={(error as Error)?.message ?? "It may have been deleted."}
        onRetry={() => refetch()}
      />
    );
  }

  const handleStatus = (status: ApplicationStatus) => {
    const previous = data.status;
    updateStatus.mutate(
      { id: data.id, status },
      {
        onSuccess: () =>
          toast.success(`Moved to ${STATUS_META[status].label}`, {
            action: {
              label: "Undo",
              onClick: () => updateStatus.mutate({ id: data.id, status: previous }),
            },
          }),
      },
    );
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <Link
        href={appHref("/app/board")}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Back to pipeline
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <CompanyAvatar name={data.company.name} accent={data.company.accent} size="lg" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-50 sm:text-2xl">
              {data.position}
            </h1>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
              {data.company.name} · {data.location || LOCATION_TYPE_LABEL[data.locationType]} ·{" "}
              {EMPLOYMENT_TYPE_LABEL[data.employmentType]}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <StatusBadge status={data.status} />
              <PriorityBadge priority={data.priority} />
              {data.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div>
            <label htmlFor="detail-status" className="sr-only">
              Change status
            </label>
            <select
              id="detail-status"
              value={data.status}
              onChange={(event) => handleStatus(event.target.value as ApplicationStatus)}
              className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              {APPLICATION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_META[status].label}
                </option>
              ))}
            </select>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setInterviewOpen(true)}>
            <CalendarPlus className="h-4 w-4" aria-hidden />
            Interview
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setReminderOpen(true)}>
            <Bell className="h-4 w-4" aria-hidden />
            Reminder
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" aria-hidden />
            Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(true)}>
            <Trash2 className="h-4 w-4" aria-hidden />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-3">
          <Card>
            <CardHeader title="Application information" />
            <CardBody className="pt-1">
              <dl className="grid gap-x-8 sm:grid-cols-2">
                <InfoRow label="Company">{data.company.name}</InfoRow>
                <InfoRow label="Position">{data.position}</InfoRow>
                <InfoRow label="Location">
                  {data.location || "—"} · {LOCATION_TYPE_LABEL[data.locationType]}
                </InfoRow>
                <InfoRow label="Salary range">
                  {formatSalary(data.salaryMin, data.salaryMax, data.currency)}
                </InfoRow>
                <InfoRow label="Applied on">{formatDate(data.appliedDate)}</InfoRow>
                <InfoRow label="Source">{SOURCE_LABEL[data.source]}</InfoRow>
                <InfoRow label="Next follow-up">
                  {data.nextFollowUpDate ? relativeDay(data.nextFollowUpDate) : "Not scheduled"}
                </InfoRow>
                <InfoRow label="CV used">{data.cv?.name ?? "Not specified"}</InfoRow>
                <InfoRow label="Job posting">
                  {data.jobUrl ? (
                    <a
                      href={data.jobUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      Open posting <ExternalLink className="h-3 w-3" aria-hidden />
                    </a>
                  ) : (
                    "—"
                  )}
                </InfoRow>
                <InfoRow label="Contact">
                  {data.contact ? (
                    <span className="space-y-0.5">
                      <span className="block">{data.contact.name}</span>
                      {data.contact.email ? (
                        <a
                          href={`mailto:${data.contact.email}`}
                          className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                          <Mail className="h-3 w-3" aria-hidden /> {data.contact.email}
                        </a>
                      ) : null}
                      {data.contact.linkedinUrl ? (
                        <a
                          href={data.contact.linkedinUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="ml-2 inline-flex items-center gap-1 text-xs text-indigo-600 hover:underline dark:text-indigo-400"
                        >
                          <Link2 className="h-3 w-3" aria-hidden /> LinkedIn
                        </a>
                      ) : null}
                    </span>
                  ) : (
                    "—"
                  )}
                </InfoRow>
              </dl>
              {data.notes ? (
                <div className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-700 dark:bg-slate-800/50 dark:text-slate-300">
                  <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    Notes
                  </p>
                  {data.notes}
                </div>
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Job description analysis"
              description="Extract required skills, technologies and keywords"
            />
            <CardBody className="pt-2">
              <JobDescriptionAnalysis text={data.jobDescription} />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader
              title="Interviews"
              action={
                <Button variant="ghost" size="sm" onClick={() => setInterviewOpen(true)}>
                  Add
                </Button>
              }
            />
            <CardBody className="pt-2">
              {data.interviews.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">No interviews yet.</p>
              ) : (
                <ul className="space-y-2">
                  {data.interviews.map((interview) => (
                    <li
                      key={interview.id}
                      className="rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                          {INTERVIEW_TYPE_LABEL[interview.type]}
                        </p>
                        <span className="text-[11px] text-slate-400">
                          {formatDateTime(interview.scheduledAt)}
                        </span>
                      </div>
                      {interview.interviewers ? (
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                          {interview.interviewers}
                        </p>
                      ) : null}
                      <div className="mt-1.5 flex items-center gap-3">
                        {interview.meetingUrl ? (
                          <a
                            href={interview.meetingUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="text-[11px] font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                          >
                            Join meeting
                          </a>
                        ) : null}
                        {!interview.completed ? (
                          <button
                            type="button"
                            onClick={() => updateInterview.mutate({ id: interview.id, completed: true })}
                            className="text-[11px] font-medium text-slate-500 hover:text-emerald-600"
                          >
                            Mark completed
                          </button>
                        ) : (
                          <span className="text-[11px] text-emerald-600 dark:text-emerald-400">
                            Completed
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Timeline" description="Automatic and manual events" />
            <CardBody className="pt-2">
              <ActivityTimeline applicationId={data.id} activities={data.activities} />
            </CardBody>
          </Card>
        </div>
      </div>

      <ApplicationFormDialog open={editOpen} onClose={() => setEditOpen(false)} application={data} />
      <InterviewFormDialog
        open={interviewOpen}
        onClose={() => setInterviewOpen(false)}
        applicationId={data.id}
      />
      <ReminderFormDialog
        open={reminderOpen}
        onClose={() => setReminderOpen(false)}
        applicationId={data.id}
        defaultTitle={`Follow up with ${data.company.name}`}
      />
      <ConfirmDialog
        open={confirmOpen}
        title="Delete this application?"
        description="This permanently removes the application, its interviews, reminders and timeline."
        confirmLabel="Delete"
        destructive
        loading={remove.isPending}
        onClose={() => setConfirmOpen(false)}
        onConfirm={async () => {
          await remove.mutateAsync(data.id);
          setConfirmOpen(false);
          router.push("/app/board");
        }}
      />
    </div>
  );
}
