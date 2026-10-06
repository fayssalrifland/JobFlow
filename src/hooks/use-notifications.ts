"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/services/api";
import type { NotificationDTO } from "@/types";

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => api.get<{ items: NotificationDTO[]; unread: number }>("/api/notifications"),
    refetchInterval: 120_000,
  });
}

export function useMarkNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, read }: { id: string; read: boolean }) =>
      api.patch(`/api/notifications/${id}`, { read }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useMarkAllNotifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch("/api/notifications", { markAllRead: true }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
}
