"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/services/api";
import type { SessionUserDTO } from "@/types";

export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: () => api.get<{ user: SessionUserDTO }>("/api/me"),
    staleTime: 5 * 60_000,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: Record<string, unknown>) => api.patch<{ user: SessionUserDTO }>("/api/me", values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["session"] });
      toast.success("Settings saved");
    },
    onError: (error: Error) => toast.error("Could not save settings", { description: error.message }),
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (values: { currentPassword: string; newPassword: string; confirmPassword: string }) =>
      api.patch("/api/me/password", values),
    onSuccess: () => toast.success("Password updated"),
    onError: (error: Error) => toast.error("Could not update password", { description: error.message }),
  });
}
