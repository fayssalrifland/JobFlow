"use client";

import { useState } from "react";
import {
  CalendarClock,
  CheckCircle2,
  FilePlus2,
  MessageSquarePlus,
  MoveRight,
  Target,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-controls";
import { useAddActivity } from "@/hooks/use-applications";
import { formatDateTime } from "@/lib/utils";
import type { ActivityDTO } from "@/types";

const ICONS: Record<string, typeof MoveRight> = {
  APPLICATION_CREATED: FilePlus2,
  STATUS_CHANGED: MoveRight,
  APPLICATION_UPDATED: MessageSquarePlus,
  INTERVIEW_SCHEDULED: CalendarClock,
  INTERVIEW_UPDATED: CalendarClock,
  NOTE_ADDED: MessageSquarePlus,
  REMINDER_CREATED: Target,
  REMINDER_COMPLETED: CheckCircle2,
  CUSTOM_EVENT: MessageSquarePlus,
};

export function ActivityTimeline({
  applicationId,
  activities,
}: {
  applicationId: string;
  activities: ActivityDTO[];
}) {
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const addActivity = useAddActivity(applicationId);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (message.trim().length < 2) {
      setError("Describe what happened (at least 2 characters).");
      return;
    }
    setError(null);
    await addActivity.mutateAsync({ message: message.trim() });
    setMessage("");
  };

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="space-y-2" noValidate>
        <Field label="Add a timeline event" htmlFor="timeline-event" error={error ?? undefined}>
          <Input
            id="timeline-event"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="e.g. Recruiter asked for references"
          />
        </Field>
        <Button type="submit" size="sm" variant="secondary" loading={addActivity.isPending}>
          Add event
        </Button>
      </form>

      <ol className="relative space-y-4 border-l border-slate-200 pl-5 dark:border-slate-800">
        {activities.map((activity) => {
          const Icon = ICONS[activity.type] ?? MessageSquarePlus;
          return (
            <li key={activity.id} className="relative">
              <span className="absolute -left-[1.85rem] grid h-6 w-6 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
                <Icon className="h-3 w-3" aria-hidden />
              </span>
              <p className="text-sm text-slate-800 dark:text-slate-200">{activity.message}</p>
              <time
                dateTime={activity.occurredAt}
                className="text-[11px] uppercase tracking-wide text-slate-400"
              >
                {formatDateTime(activity.occurredAt)}
              </time>
            </li>
          );
        })}
        {activities.length === 0 ? (
          <li className="text-sm text-slate-500 dark:text-slate-400">No events recorded yet.</li>
        ) : null}
      </ol>
    </div>
  );
}
