"use client";

import Link from "next/link";
import { ArrowUpRight, CalendarClock, CheckCircle2, MoveRight } from "lucide-react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/feedback";
import { INTERVIEW_TYPE_LABEL } from "@/lib/constants";
import { cn, formatTime, isPast, relativeDay, relativeTime } from "@/lib/utils";
import { appHref } from "@/services/api";
import type { ActivityDTO, InterviewDTO, ReminderDTO } from "@/types";

export function RecentActivityPanel({ activities }: { activities: ActivityDTO[] }) {
  return (
    <Card className="h-full">
      <CardHeader title="Recent activity" description="Everything that happened across your pipeline" />
      <CardBody className="pt-3">
        {activities.length === 0 ? (
          <EmptyState title="No activity yet" description="Actions you take will show up here." />
        ) : (
          <ol className="space-y-3">
            {activities.map((activity) => (
              <li key={activity.id} className="flex gap-3">
                <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                  <MoveRight className="h-3.5 w-3.5" aria-hidden />
                </span>
                <div className="min-w-0">
                  <p className="text-sm text-slate-800 dark:text-slate-200">
                    {activity.applicationId ? (
                      <Link
                        href={appHref(`/app/applications/${activity.applicationId}`)}
                        className="hover:text-indigo-600 hover:underline dark:hover:text-indigo-400"
                      >
                        {activity.message}
                      </Link>
                    ) : (
                      activity.message
                    )}
                  </p>
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">
                    {relativeTime(activity.occurredAt)}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardBody>
    </Card>
  );
}

export function UpcomingInterviewsPanel({ interviews }: { interviews: InterviewDTO[] }) {
  return (
    <Card className="h-full">
      <CardHeader
        title="Upcoming interviews"
        description="Your next conversations"
        action={
          <Link
            href={appHref("/app/interviews")}
            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            All <ArrowUpRight className="h-3 w-3" aria-hidden />
          </Link>
        }
      />
      <CardBody className="pt-3">
        {interviews.length === 0 ? (
          <EmptyState
            title="No interviews scheduled"
            description="Add an interview from any application to see it here."
            icon={<CalendarClock className="h-5 w-5" aria-hidden />}
          />
        ) : (
          <ul className="space-y-3">
            {interviews.map((interview) => (
              <li key={interview.id} className="flex items-start gap-3">
                <div className="w-20 shrink-0 rounded-lg bg-indigo-50 px-2 py-1.5 text-center dark:bg-indigo-950/60">
                  <p className="text-[11px] font-semibold uppercase text-indigo-700 dark:text-indigo-300">
                    {relativeDay(interview.scheduledAt)}
                  </p>
                  <p className="text-sm font-semibold text-indigo-900 dark:text-indigo-200">
                    {formatTime(interview.scheduledAt)}
                  </p>
                </div>
                <div className="min-w-0">
                  <Link
                    href={appHref(`/app/applications/${interview.applicationId}`)}
                    className="block truncate text-sm font-medium text-slate-900 hover:underline dark:text-slate-100"
                  >
                    {interview.position}
                  </Link>
                  <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                    {interview.company} · {INTERVIEW_TYPE_LABEL[interview.type]}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

export function RemindersPanel({
  reminders,
  onComplete,
}: {
  reminders: ReminderDTO[];
  onComplete: (id: string) => void;
}) {
  return (
    <Card className="h-full">
      <CardHeader
        title="Follow-ups"
        description="Overdue and upcoming reminders"
        action={
          <Link
            href={appHref("/app/reminders")}
            className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400"
          >
            All <ArrowUpRight className="h-3 w-3" aria-hidden />
          </Link>
        }
      />
      <CardBody className="pt-3">
        {reminders.length === 0 ? (
          <EmptyState title="Nothing to follow up" description="You are on top of your job search." />
        ) : (
          <ul className="space-y-2">
            {reminders.map((reminder) => {
              const overdue = isPast(reminder.dueDate);
              return (
                <li
                  key={reminder.id}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-800"
                >
                  <button
                    type="button"
                    onClick={() => onComplete(reminder.id)}
                    aria-label={`Mark "${reminder.title}" as done`}
                    className="text-slate-300 transition-colors hover:text-emerald-500 dark:text-slate-600"
                  >
                    <CheckCircle2 className="h-5 w-5" aria-hidden />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100">
                      {reminder.title}
                    </p>
                    <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
                      {reminder.company ? `${reminder.company} · ` : ""}
                      <span className={cn(overdue && "font-semibold text-rose-600 dark:text-rose-400")}>
                        {overdue ? "Overdue" : "Due"} {relativeDay(reminder.dueDate)}
                      </span>
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}
