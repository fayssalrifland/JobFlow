"use client";

import { useState } from "react";
import { Filter, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/form-controls";
import {
  APPLICATION_STATUSES,
  EMPLOYMENT_TYPES,
  EMPLOYMENT_TYPE_LABEL,
  LOCATION_TYPES,
  LOCATION_TYPE_LABEL,
  PRIORITIES,
  PRIORITY_META,
  STATUS_META,
} from "@/lib/constants";
import { useTags } from "@/hooks/use-applications";
import type { ApplicationFilters as Filters } from "@/hooks/use-applications";
import { cn } from "@/lib/utils";

export const EMPTY_FILTERS: Filters = {
  search: "",
  status: "",
  priority: "",
  locationType: "",
  employmentType: "",
  tags: "",
  from: "",
  to: "",
  salaryMin: "",
  salaryMax: "",
  sort: "newest",
};

const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "company", label: "Company A–Z" },
  { value: "salary", label: "Highest salary" },
  { value: "priority", label: "Priority" },
  { value: "updated", label: "Recently updated" },
];

export function ApplicationFilters({
  filters,
  onChange,
  onReset,
  resultCount,
}: {
  filters: Filters;
  onChange: (next: Filters) => void;
  onReset: () => void;
  resultCount?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const { data: tagData } = useTags();

  const activeCount = Object.entries(filters).filter(
    ([key, value]) => value && key !== "search" && key !== "sort",
  ).length;

  const set = (key: keyof Filters, value: string) => onChange({ ...filters, [key]: value });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-sm">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden
          />
          <label htmlFor="application-search" className="sr-only">
            Search applications by company, position, location or contact
          </label>
          <Input
            id="application-search"
            type="search"
            value={filters.search ?? ""}
            onChange={(event) => set("search", event.target.value)}
            placeholder="Search company, role, location, contact…"
            className="pl-9"
          />
        </div>

        <Button
          variant="secondary"
          size="md"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
          aria-controls="filter-panel"
        >
          <Filter className="h-4 w-4" aria-hidden />
          Filters
          {activeCount > 0 ? (
            <span className="rounded-full bg-indigo-600 px-1.5 text-[10px] font-semibold text-white">
              {activeCount}
            </span>
          ) : null}
        </Button>

        <div className="hidden sm:block">
          <label htmlFor="sort" className="sr-only">
            Sort applications
          </label>
          <Select id="sort" value={filters.sort ?? "newest"} onChange={(event) => set("sort", event.target.value)}>
            {SORTS.map((sort) => (
              <option key={sort.value} value={sort.value}>
                {sort.label}
              </option>
            ))}
          </Select>
        </div>

        {typeof resultCount === "number" ? (
          <p className="ml-auto text-xs text-slate-500 dark:text-slate-400" aria-live="polite">
            {resultCount} result{resultCount === 1 ? "" : "s"}
          </p>
        ) : null}
      </div>

      <div
        id="filter-panel"
        className={cn(
          "grid gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4 dark:border-slate-800 dark:bg-slate-900",
          !expanded && "hidden",
        )}
      >
        <Field label="Status" htmlFor="filter-status">
          <Select id="filter-status" value={filters.status ?? ""} onChange={(event) => set("status", event.target.value)}>
            <option value="">All statuses</option>
            {APPLICATION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_META[status].label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Priority" htmlFor="filter-priority">
          <Select
            id="filter-priority"
            value={filters.priority ?? ""}
            onChange={(event) => set("priority", event.target.value)}
          >
            <option value="">Any priority</option>
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {PRIORITY_META[priority].label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Work setup" htmlFor="filter-location-type">
          <Select
            id="filter-location-type"
            value={filters.locationType ?? ""}
            onChange={(event) => set("locationType", event.target.value)}
          >
            <option value="">Any setup</option>
            {LOCATION_TYPES.map((type) => (
              <option key={type} value={type}>
                {LOCATION_TYPE_LABEL[type]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Employment type" htmlFor="filter-employment">
          <Select
            id="filter-employment"
            value={filters.employmentType ?? ""}
            onChange={(event) => set("employmentType", event.target.value)}
          >
            <option value="">Any type</option>
            {EMPLOYMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {EMPLOYMENT_TYPE_LABEL[type]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Applied from" htmlFor="filter-from">
          <Input id="filter-from" type="date" value={filters.from ?? ""} onChange={(event) => set("from", event.target.value)} />
        </Field>
        <Field label="Applied to" htmlFor="filter-to">
          <Input id="filter-to" type="date" value={filters.to ?? ""} onChange={(event) => set("to", event.target.value)} />
        </Field>
        <Field label="Minimum salary" htmlFor="filter-salary-min">
          <Input
            id="filter-salary-min"
            inputMode="numeric"
            placeholder="e.g. 80000"
            value={filters.salaryMin ?? ""}
            onChange={(event) => set("salaryMin", event.target.value.replace(/\D/g, ""))}
          />
        </Field>
        <Field label="Tag" htmlFor="filter-tag">
          <Select id="filter-tag" value={filters.tags ?? ""} onChange={(event) => set("tags", event.target.value)}>
            <option value="">Any tag</option>
            {tagData?.items.map((tag) => (
              <option key={tag.id} value={tag.label}>
                #{tag.label}
              </option>
            ))}
          </Select>
        </Field>
        <div className="sm:col-span-2 lg:col-span-4">
          <Button variant="ghost" size="sm" onClick={onReset} disabled={activeCount === 0 && !filters.search}>
            <X className="h-4 w-4" aria-hidden />
            Reset filters
          </Button>
        </div>
      </div>
    </div>
  );
}
