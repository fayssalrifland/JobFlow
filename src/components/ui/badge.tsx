import type { ReactNode } from "react";
import {
  ACCENT_CLASS,
  PRIORITY_META,
  STATUS_META,
  type ApplicationStatus,
  type Priority,
} from "@/lib/constants";
import { cn, initialsOf } from "@/lib/utils";

export function Badge({
  children,
  className,
  title,
}: {
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status, className }: { status: ApplicationStatus; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <Badge className={cn(meta.chip, className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", meta.dot)} aria-hidden />
      {meta.label}
    </Badge>
  );
}

export function PriorityBadge({ priority, className }: { priority: Priority; className?: string }) {
  const meta = PRIORITY_META[priority];
  return (
    <Badge className={cn(meta.chip, className)} title={`Priority: ${meta.label}`}>
      {meta.label}
    </Badge>
  );
}

export function CompanyAvatar({
  name,
  accent = "slate",
  size = "md",
}: {
  name: string;
  accent?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "h-7 w-7 text-[10px]",
    md: "h-9 w-9 text-xs",
    lg: "h-12 w-12 text-sm",
  } as const;
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-lg font-semibold uppercase tracking-wide",
        ACCENT_CLASS[accent] ?? ACCENT_CLASS.slate,
        sizes[size],
      )}
    >
      {initialsOf(name)}
    </span>
  );
}
