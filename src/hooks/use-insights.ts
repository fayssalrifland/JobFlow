"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { AnalyticsData, DashboardData } from "@/types";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get<DashboardData>("/api/dashboard"),
  });
}

export function useAnalytics(range: string) {
  return useQuery({
    queryKey: ["analytics", range],
    queryFn: () => api.get<AnalyticsData>(`/api/analytics?range=${range}`),
    placeholderData: (previous) => previous,
  });
}
