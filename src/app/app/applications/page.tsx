"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/ui/feedback";
import { ApplicationFilters } from "@/components/applications/application-filters";
import { ApplicationFormDialog } from "@/components/applications/application-form-dialog";
import { ApplicationTable } from "@/components/applications/application-table";
import { ViewToggle } from "@/components/applications/view-toggle";
import { useApplicationFilters } from "@/hooks/use-application-filters";
import { useApplications } from "@/hooks/use-applications";

export default function ApplicationsPage() {
  const { filters, setFilters, queryFilters, reset } = useApplicationFilters();
  const { data, isLoading, isError, error, refetch } = useApplications(queryFilters);
  const [createOpen, setCreateOpen] = useState(false);

  const items = data?.items ?? [];
  const hasQuery = Boolean(filters.search) ||
    Object.entries(filters).some(([key, value]) => value && key !== "sort" && key !== "search");

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <PageHeader
        title="Applications"
        description="Every opportunity you are tracking, in a sortable table."
        actions={
          <>
            <ViewToggle active="list" />
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
        <ListSkeleton rows={6} />
      ) : items.length === 0 && !hasQuery ? (
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
        <ApplicationTable applications={items} />
      )}

      <ApplicationFormDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
