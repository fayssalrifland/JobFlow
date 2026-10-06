"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, buildQuery } from "@/services/api";
import type { ApplicationDTO, ApplicationDetailDTO, ApplicationListResponse } from "@/types";
import type { ApplicationStatus } from "@/lib/constants";
import type { ApplicationFormValues } from "@/lib/validation";

export type ApplicationFilters = {
  search?: string;
  status?: string;
  priority?: string;
  locationType?: string;
  employmentType?: string;
  tags?: string;
  from?: string;
  to?: string;
  salaryMin?: string;
  salaryMax?: string;
  sort?: string;
};

export const applicationKeys = {
  all: ["applications"] as const,
  list: (filters: ApplicationFilters) => ["applications", "list", filters] as const,
  detail: (id: string) => ["applications", "detail", id] as const,
};

export function useApplications(filters: ApplicationFilters = {}) {
  return useQuery({
    queryKey: applicationKeys.list(filters),
    queryFn: () =>
      api.get<ApplicationListResponse>(`/api/applications${buildQuery({ ...filters, pageSize: 200 })}`),
    placeholderData: (previous) => previous,
  });
}

export function useApplication(id: string | undefined) {
  return useQuery({
    queryKey: applicationKeys.detail(id ?? "none"),
    queryFn: () => api.get<ApplicationDetailDTO>(`/api/applications/${id}`),
    enabled: Boolean(id),
  });
}

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["applications"] });
  queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  queryClient.invalidateQueries({ queryKey: ["analytics"] });
  queryClient.invalidateQueries({ queryKey: ["notifications"] });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: ApplicationFormValues) =>
      api.post<ApplicationDetailDTO>("/api/applications", values),
    onSuccess: (data) => {
      invalidateAll(queryClient);
      toast.success("Application created", {
        description: `${data.position} at ${data.company.name}`,
      });
    },
    onError: (error: Error) => toast.error("Could not save application", { description: error.message }),
  });
}

export function useUpdateApplication(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: ApplicationFormValues) =>
      api.patch<ApplicationDetailDTO>(`/api/applications/${id}`, values),
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success("Application updated");
    },
    onError: (error: Error) => toast.error("Could not update application", { description: error.message }),
  });
}

/**
 * Status changes are the hot path of the Kanban board: we patch every cached
 * list immediately, then reconcile with the server response (or roll back).
 */
export function useUpdateStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: ApplicationStatus; previous?: ApplicationStatus }) =>
      api.patch<ApplicationDetailDTO>(`/api/applications/${id}/status`, { status }),
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["applications"] });
      const snapshots = queryClient.getQueriesData<ApplicationListResponse>({
        queryKey: ["applications", "list"],
      });
      for (const [key, data] of snapshots) {
        if (!data) continue;
        queryClient.setQueryData<ApplicationListResponse>(key, {
          ...data,
          items: data.items.map((item: ApplicationDTO) =>
            item.id === id ? { ...item, status, statusChangedAt: new Date().toISOString() } : item,
          ),
        });
      }
      return { snapshots };
    },
    onError: (error: Error, _variables, context) => {
      context?.snapshots.forEach(([key, data]) => queryClient.setQueryData(key, data));
      toast.error("Could not move the application", { description: error.message });
    },
    onSettled: () => invalidateAll(queryClient),
  });
}

export function useDeleteApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<{ id: string }>(`/api/applications/${id}`),
    onSuccess: () => {
      invalidateAll(queryClient);
      toast.success("Application deleted");
    },
    onError: (error: Error) => toast.error("Could not delete application", { description: error.message }),
  });
}

export function useAddActivity(applicationId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: { message: string; occurredAt?: string }) =>
      api.post(`/api/applications/${applicationId}/activities`, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: applicationKeys.detail(applicationId) });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("Timeline event added");
    },
    onError: (error: Error) => toast.error("Could not add event", { description: error.message }),
  });
}

export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: () => api.get<{ items: { id: string; label: string }[] }>("/api/tags"),
  });
}
