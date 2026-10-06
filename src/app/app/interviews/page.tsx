"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarPlus, Clock, ExternalLink, Trash2, Users } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/ui/feedback";
import { InterviewFormDialog } from "@/components/interviews/interview-form-dialog";
import { useDeleteInterview, useInterviews, useUpdateInterview } from "@/hooks/use-interviews";
import { INTERVIEW_TYPE_LABEL } from "@/lib/constants";
import { cn, formatDate, formatTime, isPast, relativeDay } from "@/lib/utils";
import { appHref } from "@/services/api";
import type { InterviewDTO } from "@/types";

function InterviewCard({
  interview,
  onComplete,
  onDelete,
}: {
  interview: InterviewDTO;
  onComplete: () => void;
  onDelete: () => void;
}) {
  return (
    <li className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center dark:border-slate-800 dark:bg-slate-900">
      <div className="w-full shrink-0 rounded-lg bg-slate-50 px-3 py-2 text-center sm:w-24 dark:bg-slate-800/60">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {relativeDay(interview.scheduledAt)}
        </p>
        <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          {formatTime(interview.scheduledAt)}
        </p>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
          <Link href={appHref(`/app/applications/${interview.applicationId}`)} className="hover:underline">
            {interview.position}
          </Link>
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {interview.company} · {INTERVIEW_TYPE_LABEL[interview.type]} · {interview.durationMinutes} min
        </p>
        {interview.interviewers ? (
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
            <Users className="h-3 w-3" aria-hidden />
            {interview.interviewers}
          </p>
        ) : null}
        {interview.notes ? (
          <p className="mt-1 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">{interview.notes}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {interview.meetingUrl ? (
          <a
            href={interview.meetingUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200"
          >
            Join <ExternalLink className="h-3 w-3" aria-hidden />
          </a>
        ) : null}
        {!interview.completed ? (
          <Button variant="secondary" size="sm" onClick={onComplete}>
            Complete
          </Button>
        ) : (
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
            Completed
          </span>
        )}
        <Button variant="ghost" size="icon" onClick={onDelete} aria-label="Delete interview">
          <Trash2 className="h-4 w-4" aria-hidden />
        </Button>
      </div>
    </li>
  );
}

export default function InterviewsPage() {
  const { data, isLoading, isError, error, refetch } = useInterviews();
  const update = useUpdateInterview();
  const remove = useDeleteInterview();
  const [createOpen, setCreateOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);

  const { upcoming, past, week } = useMemo(() => {
    const items = data?.items ?? [];
    const upcomingItems = items.filter((item) => !isPast(item.scheduledAt));
    const pastItems = items.filter((item) => isPast(item.scheduledAt)).reverse();

    const days = Array.from({ length: 7 }).map((_, index) => {
      const day = new Date();
      day.setHours(0, 0, 0, 0);
      day.setDate(day.getDate() + index);
      const next = new Date(day);
      next.setDate(next.getDate() + 1);
      return {
        date: day,
        items: items.filter((item) => {
          const at = new Date(item.scheduledAt).getTime();
          return at >= day.getTime() && at < next.getTime();
        }),
      };
    });

    return { upcoming: upcomingItems, past: pastItems, week: days };
  }, [data]);

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <PageHeader
        title="Interviews"
        description="Everything scheduled across your applications."
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <CalendarPlus className="h-4 w-4" aria-hidden />
            Schedule interview
          </Button>
        }
      />

      {isError ? (
        <ErrorState description={(error as Error)?.message} onRetry={() => refetch()} />
      ) : isLoading ? (
        <ListSkeleton rows={4} />
      ) : (
        <>
          <Card>
            <CardHeader title="Next 7 days" description="A quick agenda view of the week ahead" />
            <CardBody className="pt-2">
              <div className="thin-scrollbar grid grid-cols-7 gap-2 overflow-x-auto">
                {week.map(({ date, items }) => (
                  <div
                    key={date.toISOString()}
                    className={cn(
                      "min-w-24 rounded-lg border p-2 text-center",
                      items.length > 0
                        ? "border-indigo-200 bg-indigo-50 dark:border-indigo-900 dark:bg-indigo-950/40"
                        : "border-slate-200 dark:border-slate-800",
                    )}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      {new Intl.DateTimeFormat("en-US", { weekday: "short" }).format(date)}
                    </p>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                      {date.getDate()}
                    </p>
                    <ul className="mt-1 space-y-1">
                      {items.map((item) => (
                        <li
                          key={item.id}
                          className="truncate rounded bg-white px-1 py-0.5 text-[10px] font-medium text-indigo-700 dark:bg-slate-900 dark:text-indigo-300"
                          title={`${item.position} · ${item.company}`}
                        >
                          {formatTime(item.scheduledAt)}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>

          <section aria-labelledby="upcoming-heading" className="space-y-3">
            <h2 id="upcoming-heading" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Upcoming
            </h2>
            {upcoming.length === 0 ? (
              <EmptyState
                title="No upcoming interviews"
                description="Schedule an interview to see it here and on your dashboard."
                icon={<Clock className="h-5 w-5" aria-hidden />}
                action={
                  <Button size="sm" onClick={() => setCreateOpen(true)}>
                    Schedule interview
                  </Button>
                }
              />
            ) : (
              <ul className="space-y-3">
                {upcoming.map((interview) => (
                  <InterviewCard
                    key={interview.id}
                    interview={interview}
                    onComplete={() => update.mutate({ id: interview.id, completed: true })}
                    onDelete={() => setPendingDelete(interview.id)}
                  />
                ))}
              </ul>
            )}
          </section>

          {past.length > 0 ? (
            <section aria-labelledby="past-heading" className="space-y-3">
              <h2 id="past-heading" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Past interviews
              </h2>
              <ul className="space-y-3">
                {past.map((interview) => (
                  <InterviewCard
                    key={interview.id}
                    interview={interview}
                    onComplete={() => update.mutate({ id: interview.id, completed: true })}
                    onDelete={() => setPendingDelete(interview.id)}
                  />
                ))}
              </ul>
              <p className="text-xs text-slate-400">
                Oldest interview on record: {formatDate(past[past.length - 1]?.scheduledAt)}
              </p>
            </section>
          ) : null}
        </>
      )}

      <InterviewFormDialog open={createOpen} onClose={() => setCreateOpen(false)} />
      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this interview?"
        description="The interview will be removed from your calendar and dashboard."
        confirmLabel="Delete"
        destructive
        loading={remove.isPending}
        onClose={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (pendingDelete) await remove.mutateAsync(pendingDelete);
          setPendingDelete(null);
        }}
      />
    </div>
  );
}
