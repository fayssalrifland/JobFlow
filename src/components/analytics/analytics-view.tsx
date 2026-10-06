"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState, ErrorState, Skeleton } from "@/components/ui/feedback";
import {
  CategoryBarChart,
  DonutChart,
  FunnelChart,
  MonthlyTrendChart,
  TimeInStageChart,
} from "@/components/dashboard/charts";
import { useAnalytics } from "@/hooks/use-insights";
import { cn } from "@/lib/utils";

const RANGES = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "6m", label: "6 months" },
  { value: "1y", label: "1 year" },
  { value: "all", label: "All time" },
];

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
        {value}
      </p>
      {hint ? <p className="mt-0.5 text-[11px] text-slate-400">{hint}</p> : null}
    </div>
  );
}

export function AnalyticsView() {
  const [range, setRange] = useState("90d");
  const { data, isLoading, isError, error, refetch, isFetching } = useAnalytics(range);

  return (
    <div className="space-y-5">
      <div
        role="group"
        aria-label="Date range"
        className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1"
      >
        {RANGES.map((item) => (
          <button
            key={item.value}
            type="button"
            aria-pressed={range === item.value}
            onClick={() => setRange(item.value)}
            className={cn(
              "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
              range === item.value
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                : "bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700",
            )}
          >
            {item.label}
          </button>
        ))}
        {isFetching ? <span className="self-center text-[11px] text-slate-400">Updating…</span> : null}
      </div>

      {isError ? (
        <ErrorState description={(error as Error)?.message} onRetry={() => refetch()} />
      ) : isLoading || !data ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-72 rounded-xl" />
        </div>
      ) : data.totals.applications === 0 ? (
        <EmptyState
          title="No data in this range"
          description="Pick a longer date range, or add applications to start building your analytics."
        />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Metric
              label="Applications"
              value={String(data.totals.applications)}
              hint={`${data.totals.responses} responses`}
            />
            <Metric
              label="Response rate"
              value={`${data.totals.responseRate}%`}
              hint="Any reply beyond “Applied”"
            />
            <Metric
              label="Interview rate"
              value={`${data.totals.interviewRate}%`}
              hint={`${data.totals.interviews} reached interview`}
            />
            <Metric
              label="Offer rate"
              value={`${data.totals.offerRate}%`}
              hint={`${data.totals.offers} offers`}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader title="Applications per month" description="Submission volume over time" />
              <CardBody className="pt-2">
                <MonthlyTrendChart data={data.perMonth} />
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Conversion funnel" description="Share of applications reaching each stage" />
              <CardBody className="pt-3">
                <FunnelChart data={data.funnel} />
              </CardBody>
            </Card>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader title="Applications by source" description="Where your applications come from" />
              <CardBody className="pt-2">
                <DonutChart data={data.bySource} />
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Applications by status" description="Current pipeline distribution" />
              <CardBody className="pt-2">
                <CategoryBarChart data={data.byStatus} />
              </CardBody>
            </Card>
            <Card>
              <CardHeader
                title="Average time in stage"
                description="Derived from your recorded status changes"
              />
              <CardBody className="pt-2">
                {data.timeInStage.every((stage) => stage.samples === 0) ? (
                  <p className="py-10 text-center text-sm text-slate-500">
                    Not enough stage transitions yet.
                  </p>
                ) : (
                  <TimeInStageChart data={data.timeInStage} />
                )}
              </CardBody>
            </Card>
            <Card>
              <CardHeader
                title="Average time to first response"
                description="From application date to the first status change"
              />
              <CardBody>
                <p className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                  {data.totals.avgResponseDays === null ? "—" : `${data.totals.avgResponseDays} days`}
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Based on {data.totals.responses} responded application
                  {data.totals.responses === 1 ? "" : "s"} in this range.
                </p>
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Applications by location" description="Top locations you target" />
              <CardBody className="pt-2">
                <CategoryBarChart data={data.byLocation} color="#0ea5e9" />
              </CardBody>
            </Card>
            <Card>
              <CardHeader title="Employment & work setup" description="Contract shape of your search" />
              <CardBody className="space-y-4 pt-2">
                <DonutChart data={data.byEmploymentType} />
                <ul className="grid grid-cols-3 gap-2 text-center text-xs">
                  {data.byLocationType.map((item) => (
                    <li
                      key={item.key}
                      className="rounded-lg bg-slate-50 px-2 py-2 dark:bg-slate-800/60"
                    >
                      <p className="text-base font-semibold text-slate-900 dark:text-slate-100">
                        {item.count}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400">{item.label}</p>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
