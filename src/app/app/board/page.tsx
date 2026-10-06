"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/ui/feedback";
import { ApplicationFilters } from "@/components/applications/application-filters";
import { ApplicationFormDialog } from "@/components/applications/application-form-dialog";
import { KanbanBoard } from "@/components/applications/kanban-board";
import { ViewToggle } from "@/components/applications/view-toggle";
import { useApplicationFilters } from "@/hooks/use-application-filters";
import { useApplications, useUpdateStatus } from "@/hooks/use-applications";
import { STATUS_META, type ApplicationStatus } from "@/lib/constants";

export default function BoardPage() {
  const { filters, setFilters, queryFilters, reset } = useApplicationFilters();
  const { data, isLoading, isError, error, refetch } = useApplications(queryFilters);
  const updateStatus = useUpdateStatus();
  const [createOpen, setCreateOpen] = useState(false);

  const items = data?.items ?? [];
  const hasFilters = Object.entries(filters).some(
    ([key, value]) => value && key !== "sort" && key !== "search",
  );

  const handleStatusChange = (id: string, status: ApplicationStatus) => {
    const application = items.find((item) => item.id === id);
    const previous = application?.status;
    if (!previous || previous === status) return;

    updateStatus.mutate(
      { id, status },
      {
        onSuccess: () => {
          toast.success(`Moved to ${STATUS_META[status].label}`, {
            description: `${application.position} · ${application.company.name}`,
            action: {
              label: "Undo",
              onClick: () => updateStatus.mutate({ id, status: previous }),
            },
          });
        },
      },
    );
  };

  return (
    <div className="mx-auto max-w-[110rem] space-y-4">
      <PageHeader
        title="Pipeline"
        description="Drag cards between stages, or use the select on each card to move them with the keyboard."
        actions={
          <>
            <ViewToggle active="kanban" />
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden />
              Add application
            </Button>
          </>
        }
      />

      <ApplicationFilters
        filters={filters}
        onChange={setFilters}
        onReset={reset}
        resultCount={data?.total}
      />

      {isError ? (
        <ErrorState description={(error as Error)?.message} onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <ListSkeleton rows={2} />
          <ListSkeleton rows={2} />
          <ListSkeleton rows={2} />
        </div>
      ) : items.length === 0 && !hasFilters && !filters.search ? (
        <EmptyState
          title="No applications yet."
          description="Start tracking your job search by adding your first application."
          action={
            <Button onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden />
              Add Application
            </Button>
          }
        />
      ) : (
        <KanbanBoard applications={items} onStatusChange={handleStatusChange} />
      )}

      <ApplicationFormDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
