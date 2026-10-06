"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/services/api";
import type { InterviewDTO } from "@/types";
import type { InterviewFormValues } from "@/lib/validation";

export function useInterviews() {
  return useQuery({
    queryKey: ["interviews"],
    queryFn: () => api.get<{ items: InterviewDTO[] }>("/api/interviews"),
  });
}

function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["interviews"] });
  queryClient.invalidateQueries({ queryKey: ["applications"] });
  queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  queryClient.invalidateQueries({ queryKey: ["notifications"] });
}

export function useCreateInterview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: InterviewFormValues) => api.post("/api/interviews", values),
    onSuccess: () => {
      invalidate(queryClient);
      toast.success("Interview scheduled");
    },
    onError: (error: Error) => toast.error("Could not schedule interview", { description: error.message }),
  });
}

export function useUpdateInterview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...patch }: { id: string; completed?: boolean; notes?: string }) =>
      api.patch(`/api/interviews/${id}`, patch),
    onSuccess: () => {
      invalidate(queryClient);
      toast.success("Interview updated");
    },
    onError: (error: Error) => toast.error("Could not update interview", { description: error.message }),
  });
}

export function useDeleteInterview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/interviews/${id}`),
    onSuccess: () => {
      invalidate(queryClient);
      toast.success("Interview removed");
    },
    onError: (error: Error) => toast.error("Could not remove interview", { description: error.message }),
  });
}
