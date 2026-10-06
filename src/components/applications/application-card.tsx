"use client";

import Link from "next/link";
import { CalendarClock, GripVertical, MapPin } from "lucide-react";
import { CompanyAvatar, PriorityBadge } from "@/components/ui/badge";
import {
  APPLICATION_STATUSES,
  EMPLOYMENT_TYPE_LABEL,
  INTERVIEW_TYPE_LABEL,
  LOCATION_TYPE_LABEL,
  STATUS_META,
  type ApplicationStatus,
} from "@/lib/constants";
import { cn, formatShortDate, relativeDay } from "@/lib/utils";
import { appHref } from "@/services/api";
import type { ApplicationDTO } from "@/types";

type Props = {
  application: ApplicationDTO;
  onStatusChange?: (status: ApplicationStatus) => void;
  dragHandleProps?: Record<string, unknown>;
  isDragging?: boolean;
  isOverlay?: boolean;
};

export function ApplicationCard({
  application,
  onStatusChange,
  dragHandleProps,
  isDragging,
  isOverlay,
}: Props) {
  const nextAction = application.nextInterview
    ? {
        label: INTERVIEW_TYPE_LABEL[application.nextInterview.type],
        date: relativeDay(application.nextInterview.scheduledAt),
      }
    : application.nextFollowUpDate
      ? { label: "Follow up", date: relativeDay(application.nextFollowUpDate) }
      : null;

  return (
    <article
      className={cn(
        "group rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-shadow dark:border-slate-800 dark:bg-slate-900",
        isDragging && "opacity-40",
        isOverlay && "rotate-2 scale-[1.02] shadow-xl ring-2 ring-indigo-400",
      )}
    >
      <div className="flex items-start gap-2.5">
        <CompanyAvatar name={application.company.name} accent={application.company.accent} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {application.company.name}
          </p>
          <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-50">
            <Link
              href={appHref(`/app/applications/${application.id}`)}
              className="hover:text-indigo-600 hover:underline dark:hover:text-indigo-400"
            >
              {application.position}
            </Link>
          </h3>
        </div>
        {dragHandleProps ? (
          <button
            type="button"
            aria-label={`Drag ${application.position} at ${application.company.name}`}
            className="cursor-grab rounded p-1 text-slate-300 opacity-0 transition-opacity hover:text-slate-500 focus-visible:opacity-100 group-hover:opacity-100 active:cursor-grabbing dark:text-slate-600"
            {...dragHandleProps}
          >
            <GripVertical className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>

      <dl className="mt-2.5 space-y-1 text-[11px] text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3 w-3 shrink-0" aria-hidden />
          <dt className="sr-only">Location</dt>
          <dd className="truncate">
            {application.location || LOCATION_TYPE_LABEL[application.locationType]} ·{" "}
            {EMPLOYMENT_TYPE_LABEL[application.employmentType]}
          </dd>
        </div>
        <div className="flex items-center gap-1.5">
          <CalendarClock className="h-3 w-3 shrink-0" aria-hidden />
          <dt className="sr-only">Applied</dt>
          <dd>Applied {formatShortDate(application.appliedDate)}</dd>
        </div>
      </dl>

      <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
        <PriorityBadge priority={application.priority} />
        {application.tags.slice(0, 2).map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
          >
            #{tag}
          </span>
        ))}
        {application.tags.length > 2 ? (
          <span className="text-[10px] text-slate-400">+{application.tags.length - 2}</span>
        ) : null}
      </div>

      {nextAction ? (
        <p className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-indigo-50 px-2 py-1.5 text-[11px] font-medium text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300">
          <CalendarClock className="h-3 w-3" aria-hidden />
          {nextAction.label} · {nextAction.date}
        </p>
      ) : null}

      {onStatusChange ? (
        <div className="mt-2.5">
          <label className="sr-only" htmlFor={`move-${application.id}`}>
            Move {application.position} to another stage
          </label>
          <select
            id={`move-${application.id}`}
            value={application.status}
            onChange={(event) => onStatusChange(event.target.value as ApplicationStatus)}
            className="w-full rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-600 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
          >
            {APPLICATION_STATUSES.map((status) => (
              <option key={status} value={status}>
                Move to {STATUS_META[status].label}
              </option>
            ))}
          </select>
        </div>
      ) : null}
    </article>
  );
}
