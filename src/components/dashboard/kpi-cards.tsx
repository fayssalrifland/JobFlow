"use client";

import type { LucideIcon } from "lucide-react";
import { Briefcase, CalendarCheck, Percent, ThumbsDown, Trophy, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/feedback";
import { cn } from "@/lib/utils";
import type { DashboardData } from "@/types";

function KpiCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "slate",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  tone?: "slate" | "indigo" | "emerald" | "amber" | "rose";
}) {
  const tones = {
    slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
    indigo: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-300",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-300",
    rose: "bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-300",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
        <span className={cn("grid h-7 w-7 place-items-center rounded-lg", tones[tone])}>
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-[11px] text-slate-400">{hint}</p> : null}
    </div>
  );
}

export function KpiCards({ data, loading }: { data?: DashboardData["kpis"]; loading?: boolean }) {
  if (loading || !data) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-[5.5rem] rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
      <KpiCard label="Total applications" value={data.total} icon={Briefcase} />
      <KpiCard label="Active" value={data.active} icon={Zap} tone="indigo" hint="Still in the pipeline" />
      <KpiCard label="Interviews" value={data.interviews} icon={CalendarCheck} tone="indigo" />
      <KpiCard label="Offers" value={data.offers} icon={Trophy} tone="emerald" />
      <KpiCard label="Rejections" value={data.rejections} icon={ThumbsDown} tone="rose" />
      <KpiCard
        label="Response rate"
        value={`${data.responseRate}%`}
        icon={Percent}
        tone="amber"
        hint="Responses ÷ applications"
      />
    </div>
  );
}
