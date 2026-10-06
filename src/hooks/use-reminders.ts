"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/services/api";
import type { ReminderDTO } from "@/types";
import type { ReminderFormValues } from "@/lib/validation";

export function useReminders() {
  return useQuery({
    queryKey: ["reminders"],
    queryFn: () => api.get<{ items: ReminderDTO[] }>("/api/reminders"),
  });
}

function invalidate(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["reminders"] });
  queryClient.invalidateQueries({ queryKey: ["dashboard"] });
  queryClient.invalidateQueries({ queryKey: ["applications"] });
}

export function useCreateReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: ReminderFormValues) => api.post("/api/reminders", values),
    onSuccess: () => {
      invalidate(queryClient);
      toast.success("Reminder created");
    },
    onError: (error: Error) => toast.error("Could not create reminder", { description: error.message }),
  });
}

export function useToggleReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      api.patch(`/api/reminders/${id}`, { completed }),
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: ["reminders"] });
      const previous = queryClient.getQueryData<{ items: ReminderDTO[] }>(["reminders"]);
      if (previous) {
        queryClient.setQueryData(["reminders"], {
          items: previous.items.map((item) => (item.id === id ? { ...item, completed } : item)),
        });
      }
      return { previous };
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(["reminders"], context.previous);
      toast.error("Could not update reminder", { description: error.message });
    },
    onSettled: () => invalidate(queryClient),
  });
}

export function useDeleteReminder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/reminders/${id}`),
    onSuccess: () => {
      invalidate(queryClient);
      toast.success("Reminder deleted");
    },
    onError: (error: Error) => toast.error("Could not delete reminder", { description: error.message }),
  });
}
