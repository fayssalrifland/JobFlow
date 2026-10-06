"use client";

import { useMemo, useState } from "react";
import { useDebouncedValue } from "@/hooks/use-debounce";
import { EMPTY_FILTERS } from "@/components/applications/application-filters";
import type { ApplicationFilters } from "@/hooks/use-applications";

/** Keeps raw (instant) filter state for the UI and a debounced copy for queries. */
export function useApplicationFilters() {
  const [filters, setFilters] = useState<ApplicationFilters>(EMPTY_FILTERS);
  const debouncedSearch = useDebouncedValue(filters.search ?? "", 300);

  const queryFilters = useMemo(
    () => ({ ...filters, search: debouncedSearch }),
    [filters, debouncedSearch],
  );

  return {
    filters,
    setFilters,
    queryFilters,
    reset: () => setFilters(EMPTY_FILTERS),
  };
}
