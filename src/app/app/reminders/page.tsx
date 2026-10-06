"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BellPlus, CheckCircle2, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/ui/feedback";
import { ReminderFormDialog } from "@/components/reminders/reminder-form-dialog";
import { useDeleteReminder, useReminders, useToggleReminder } from "@/hooks/use-reminders";
import { cn, formatDateTime, isPast, relativeDay } from "@/lib/utils";
import { appHref } from "@/services/api";
import type { ReminderDTO } from "@/types";

function ReminderCard({
  reminder,
  tone,
  onToggle,
  onDelete,
}: {
  reminder: ReminderDTO;
  tone: "overdue" | "upcoming" | "done";
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <li
      className={cn(
        "flex items-start gap-3 rounded-xl border bg-white p-4 dark:bg-slate-900",
        tone === "overdue"
          ? "border-rose-200 dark:border-rose-900"
          : "border-slate-200 dark:border-slate-800",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-label={
          reminder.completed ? `Reopen reminder ${reminder.title}` : `Complete reminder ${reminder.title}`
        }
        className={cn(
          "mt-0.5 transition-colors",
          reminder.completed
            ? "text-emerald-500"
            : "text-slate-300 hover:text-emerald-500 dark:text-slate-600",
        )}
      >
        <CheckCircle2 className="h-5 w-5" aria-hidden />
      </button>
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-medium text-slate-900 dark:text-slate-100",
            reminder.completed && "line-through opacity-60",
          )}
        >
          {reminder.title}
        </p>
        <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
          {reminder.applicationId && reminder.position ? (
            <>
              <Link href={appHref(`/app/applications/${reminder.applicationId}`)} className="hover:underline">
                {reminder.position} · {reminder.company}
              </Link>{" "}
              ·{" "}
            </>
          ) : null}
          <span
            className={cn(tone === "overdue" && "font-semibold text-rose-600 dark:text-rose-400")}
          >
            {tone === "done" ? "Completed" : tone === "overdue" ? "Overdue" : "Due"}{" "}
            {relativeDay(reminder.completedAt ?? reminder.dueDate)}
          </span>{" "}
          · {formatDateTime(reminder.dueDate)}
        </p>
        {reminder.notes ? (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{reminder.notes}</p>
        ) : null}
      </div>
      <Button variant="ghost" size="icon" onClick={onDelete} aria-label={`Delete reminder ${reminder.title}`}>
        <Trash2 className="h-4 w-4" aria-hidden />
      </Button>
    </li>
  );
}

export default function RemindersPage() {
  const { data, isLoading, isError, error, refetch } = useReminders();
  const toggle = useToggleReminder();
  const remove = useDeleteReminder();
  const [createOpen, setCreateOpen] = useState(false);

  const groups = useMemo(() => {
    const items = data?.items ?? [];
    return {
      overdue: items.filter((item) => !item.completed && isPast(item.dueDate)),
      upcoming: items.filter((item) => !item.completed && !isPast(item.dueDate)),
      completed: items.filter((item) => item.completed),
    };
  }, [data]);

  const sections: { key: "overdue" | "upcoming" | "done"; title: string; items: ReminderDTO[] }[] = [
    { key: "overdue", title: "Overdue", items: groups.overdue },
    { key: "upcoming", title: "Upcoming", items: groups.upcoming },
    { key: "done", title: "Completed", items: groups.completed },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <PageHeader
        title="Reminders"
        description="Follow-ups that keep your applications moving."
        actions={
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <BellPlus className="h-4 w-4" aria-hidden />
            New reminder
          </Button>
        }
      />

      {isError ? (
        <ErrorState description={(error as Error)?.message} onRetry={() => refetch()} />
      ) : isLoading ? (
        <ListSkeleton rows={4} />
      ) : (data?.items.length ?? 0) === 0 ? (
        <EmptyState
          title="No reminders yet"
          description="Create a follow-up so you never leave an application waiting."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <BellPlus className="h-4 w-4" aria-hidden />
              New reminder
            </Button>
          }
        />
      ) : (
        sections.map((section) =>
          section.items.length > 0 ? (
            <section key={section.key} aria-labelledby={`${section.key}-heading`} className="space-y-3">
              <h2
                id={`${section.key}-heading`}
                className="text-sm font-semibold text-slate-900 dark:text-slate-100"
              >
                {section.title}
                <span className="ml-2 text-xs font-normal text-slate-400">{section.items.length}</span>
              </h2>
              <ul className="space-y-2">
                {section.items.map((reminder) => (
                  <ReminderCard
                    key={reminder.id}
                    reminder={reminder}
                    tone={section.key}
                    onToggle={() => toggle.mutate({ id: reminder.id, completed: !reminder.completed })}
                    onDelete={() => remove.mutate(reminder.id)}
                  />
                ))}
              </ul>
            </section>
          ) : null,
        )
      )}

      <ReminderFormDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
