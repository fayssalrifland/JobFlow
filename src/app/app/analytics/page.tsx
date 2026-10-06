"use client";

import dynamic from "next/dynamic";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/feedback";

/** Charts are heavy — load the analytics bundle only when this route is visited. */
const AnalyticsView = dynamic(
  () => import("@/components/analytics/analytics-view").then((mod) => mod.AnalyticsView),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-4">
        <Skeleton className="h-9 w-72 rounded-lg" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-72 rounded-xl" />
      </div>
    ),
  },
);

export default function AnalyticsPage() {
  return (
    <div className="mx-auto max-w-7xl">
      <PageHeader
        title="Analytics"
        description="Every metric below is computed from your own applications — nothing is hardcoded."
      />
      <AnalyticsView />
    </div>
  );
}
