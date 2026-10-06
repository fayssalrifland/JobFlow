"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/services/api";
import type { CvDTO } from "@/types";
import type { CvFormValues } from "@/lib/validation";

export function useCvs() {
  return useQuery({
    queryKey: ["cvs"],
    queryFn: () => api.get<{ items: CvDTO[] }>("/api/cvs"),
  });
}

export function useCreateCv() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: CvFormValues) => api.post<CvDTO>("/api/cvs", values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cvs"] });
      toast.success("CV saved");
    },
    onError: (error: Error) => toast.error("Could not save CV", { description: error.message }),
  });
}

export function useDeleteCv() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/cvs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cvs"] });
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success("CV deleted");
    },
    onError: (error: Error) => toast.error("Could not delete CV", { description: error.message }),
  });
}
