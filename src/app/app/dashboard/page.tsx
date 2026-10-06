"use client";

import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { ErrorState, ListSkeleton, Skeleton } from "@/components/ui/feedback";
import { PageHeader } from "@/components/layout/page-header";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import {
  ApplicationsOverTimeChart,
  FunnelChart,
  TimeInStageChart,
} from "@/components/dashboard/charts";
import {
  RecentActivityPanel,
  RemindersPanel,
  UpcomingInterviewsPanel,
} from "@/components/dashboard/panels";
import { useDashboard } from "@/hooks/use-insights";
import { useToggleReminder } from "@/hooks/use-reminders";
import { useSession } from "@/hooks/use-session";

export default function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useDashboard();
  const { data: session } = useSession();
  const toggleReminder = useToggleReminder();

  if (isError) {
    return (
      <ErrorState
        title="We could not load your dashboard"
        description={(error as Error)?.message}
        onRetry={() => refetch()}
      />
    );
  }

  const firstName = session?.user.name.split(" ")[0] ?? "there";

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="A live view of your job search — every number is calculated from your own records."
      />

      <KpiCards data={data?.kpis} loading={isLoading} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Applications over time"
            description="Submissions and responses per week (last 12 weeks)"
          />
          <CardBody className="pt-2">
            {isLoading || !data ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ApplicationsOverTimeChart data={data.overTime} />
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Application funnel" description="How far your applications travel" />
          <CardBody className="pt-3">
            {isLoading || !data ? <Skeleton className="h-56 w-full" /> : <FunnelChart data={data.funnel} />}
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader
            title="Average time in stage"
            description="Measured from your real status changes"
          />
          <CardBody className="pt-2">
            {isLoading || !data ? (
              <Skeleton className="h-56 w-full" />
            ) : data.timeInStage.every((stage) => stage.samples === 0) ? (
              <p className="py-10 text-center text-sm text-slate-500 dark:text-slate-400">
                Move applications between stages to unlock this metric.
              </p>
            ) : (
              <TimeInStageChart data={data.timeInStage} />
            )}
          </CardBody>
        </Card>

        <div className="lg:col-span-2">
          {isLoading || !data ? (
            <Card>
              <CardBody>
                <ListSkeleton rows={3} />
              </CardBody>
            </Card>
          ) : (
            <RecentActivityPanel activities={data.recentActivity} />
          )}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {isLoading || !data ? (
          <>
            <Skeleton className="h-64 rounded-xl" />
            <Skeleton className="h-64 rounded-xl" />
          </>
        ) : (
          <>
            <UpcomingInterviewsPanel interviews={data.upcomingInterviews} />
            <RemindersPanel
              reminders={data.dueReminders}
              onComplete={(id) => toggleReminder.mutate({ id, completed: true })}
            />
          </>
        )}
      </div>
    </div>
  );
}
