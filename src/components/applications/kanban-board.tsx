"use client";

import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { ApplicationCard } from "@/components/applications/application-card";
import { EmptyState } from "@/components/ui/feedback";
import { APPLICATION_STATUSES, STATUS_META, type ApplicationStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { ApplicationDTO } from "@/types";

function DraggableCard({
  application,
  onStatusChange,
}: {
  application: ApplicationDTO;
  onStatusChange: (status: ApplicationStatus) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: application.id,
    data: { status: application.status },
  });

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={cn("touch-manipulation", isDragging && "z-10")}
    >
      <ApplicationCard
        application={application}
        onStatusChange={onStatusChange}
        dragHandleProps={{ ...listeners, ...attributes }}
        isDragging={isDragging}
      />
    </li>
  );
}

function Column({
  status,
  applications,
  onStatusChange,
}: {
  status: ApplicationStatus;
  applications: ApplicationDTO[];
  onStatusChange: (id: string, status: ApplicationStatus) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const meta = STATUS_META[status];

  return (
    <section
      aria-label={`${meta.label} column, ${applications.length} applications`}
      className="flex w-[17.5rem] shrink-0 flex-col rounded-xl bg-slate-100/70 dark:bg-slate-900/60 lg:w-auto lg:min-w-0"
    >
      <header className="flex items-center justify-between gap-2 px-3 py-2.5">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300">
          <span className={cn("h-2 w-2 rounded-full", meta.dot)} aria-hidden />
          {meta.label}
        </h2>
        <span className="rounded-full bg-white px-1.5 py-0.5 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          {applications.length}
        </span>
      </header>
      <ul
        ref={setNodeRef}
        className={cn(
          "thin-scrollbar flex min-h-32 flex-1 flex-col gap-2 overflow-y-auto rounded-lg p-2 transition-colors",
          isOver && "bg-indigo-50 ring-2 ring-inset ring-indigo-300 dark:bg-indigo-950/40",
        )}
      >
        {applications.map((application) => (
          <DraggableCard
            key={application.id}
            application={application}
            onStatusChange={(next) => onStatusChange(application.id, next)}
          />
        ))}
        {applications.length === 0 ? (
          <li className="rounded-lg border border-dashed border-slate-300 px-3 py-6 text-center text-[11px] text-slate-400 dark:border-slate-700">
            Drop applications here
          </li>
        ) : null}
      </ul>
    </section>
  );
}

export function KanbanBoard({
  applications,
  onStatusChange,
}: {
  applications: ApplicationDTO[];
  onStatusChange: (id: string, status: ApplicationStatus) => void;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [mobileStatus, setMobileStatus] = useState<ApplicationStatus>("APPLIED");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const grouped = useMemo(() => {
    const map = new Map<ApplicationStatus, ApplicationDTO[]>();
    for (const status of APPLICATION_STATUSES) map.set(status, []);
    for (const application of applications) {
      map.get(application.status)?.push(application);
    }
    return map;
  }, [applications]);

  const active = applications.find((application) => application.id === activeId) ?? null;

  const handleDragStart = (event: DragStartEvent) => setActiveId(String(event.active.id));

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active: dragged, over } = event;
    if (!over) return;
    const nextStatus = over.id as ApplicationStatus;
    if (!APPLICATION_STATUSES.includes(nextStatus)) return;
    const current = dragged.data.current?.status as ApplicationStatus | undefined;
    if (current === nextStatus) return;
    onStatusChange(String(dragged.id), nextStatus);
  };

  if (applications.length === 0) {
    return (
      <EmptyState
        title="No applications match your filters"
        description="Try clearing the filters or add a new application to get started."
      />
    );
  }

  const mobileList = grouped.get(mobileStatus) ?? [];

  return (
    <>
      {/* Mobile: stage switcher + vertical list (no horizontal dragging on small screens) */}
      <div className="md:hidden">
        <div
          role="tablist"
          aria-label="Application stages"
          className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-3"
        >
          {APPLICATION_STATUSES.map((status) => {
            const count = grouped.get(status)?.length ?? 0;
            const selected = status === mobileStatus;
            return (
              <button
                key={status}
                role="tab"
                aria-selected={selected}
                onClick={() => setMobileStatus(status)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                  selected
                    ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
                )}
              >
                {STATUS_META[status].label} · {count}
              </button>
            );
          })}
        </div>
        <ul className="space-y-2">
          {mobileList.map((application) => (
            <li key={application.id}>
              <ApplicationCard
                application={application}
                onStatusChange={(next) => onStatusChange(application.id, next)}
              />
            </li>
          ))}
          {mobileList.length === 0 ? (
            <li className="rounded-lg border border-dashed border-slate-300 px-3 py-8 text-center text-xs text-slate-400 dark:border-slate-700">
              Nothing in {STATUS_META[mobileStatus].label} yet.
            </li>
          ) : null}
        </ul>
      </div>

      {/* Tablet & desktop: drag-and-drop board */}
      <div className="hidden md:block">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveId(null)}
          accessibility={{
            announcements: {
              onDragStart: ({ active: item }) => `Picked up application ${item.id}`,
              onDragOver: ({ over }) =>
                over ? `Moved over ${STATUS_META[over.id as ApplicationStatus]?.label ?? over.id}` : "",
              onDragEnd: ({ over }) =>
                over
                  ? `Dropped into ${STATUS_META[over.id as ApplicationStatus]?.label ?? over.id}`
                  : "Drag cancelled",
              onDragCancel: () => "Drag cancelled",
            },
          }}
        >
          <div className="thin-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 pb-4 xl:grid xl:grid-cols-7 xl:overflow-visible">
            {APPLICATION_STATUSES.map((status) => (
              <Column
                key={status}
                status={status}
                applications={grouped.get(status) ?? []}
                onStatusChange={onStatusChange}
              />
            ))}
          </div>
          <DragOverlay dropAnimation={{ duration: 180, easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)" }}>
            {active ? <ApplicationCard application={active} isOverlay /> : null}
          </DragOverlay>
        </DndContext>
      </div>
    </>
  );
}
