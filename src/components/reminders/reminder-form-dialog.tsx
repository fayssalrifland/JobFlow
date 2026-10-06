"use client";

import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { useApplications } from "@/hooks/use-applications";
import { useCreateReminder } from "@/hooks/use-reminders";
import { reminderFormSchema, type ReminderFormValues } from "@/lib/validation";
import { toIsoDate } from "@/lib/utils";

export function ReminderFormDialog({
  open,
  onClose,
  applicationId,
  defaultTitle,
}: {
  open: boolean;
  onClose: () => void;
  applicationId?: string;
  defaultTitle?: string;
}) {
  const { data } = useApplications({ sort: "updated" });
  const create = useCreateReminder();

  const makeDefaults = useCallback<() => ReminderFormValues>(
    () => ({
      title: defaultTitle ?? "Follow up",
      applicationId: applicationId ?? "",
      date: toIsoDate(new Date(Date.now() + 2 * 86_400_000)),
      time: "09:00",
      notes: "",
    }),
    [applicationId, defaultTitle],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ReminderFormValues>({
    resolver: zodResolver(reminderFormSchema),
    defaultValues: {
      title: defaultTitle ?? "Follow up",
      applicationId: applicationId ?? "",
      date: "",
      time: "09:00",
      notes: "",
    },
  });

  useEffect(() => {
    if (open) reset(makeDefaults());
  }, [open, makeDefaults, reset]);

  const onSubmit = handleSubmit(async (values) => {
    await create.mutateAsync(values);
    onClose();
  });

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="New reminder"
      description="Stay on top of follow-ups — overdue reminders are highlighted everywhere."
      footer={
        <>
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" type="submit" form="reminder-form" loading={isSubmitting}>
            Create reminder
          </Button>
        </>
      }
    >
      <form id="reminder-form" onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Title" htmlFor="reminder-title" error={errors.title?.message} required>
          <Input id="reminder-title" {...register("title")} />
        </Field>

        {!applicationId ? (
          <Field label="Related application" htmlFor="reminder-application">
            <Select id="reminder-application" {...register("applicationId")}>
              <option value="">No specific application</option>
              {data?.items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.position} — {item.company.name}
                </option>
              ))}
            </Select>
          </Field>
        ) : (
          <input type="hidden" {...register("applicationId")} />
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Due date" htmlFor="reminder-date" error={errors.date?.message} required>
            <Input id="reminder-date" type="date" {...register("date")} />
          </Field>
          <Field label="Time" htmlFor="reminder-time" error={errors.time?.message}>
            <Input id="reminder-time" type="time" {...register("time")} />
          </Field>
        </div>

        <Field label="Notes" htmlFor="reminder-notes">
          <Textarea id="reminder-notes" rows={3} {...register("notes")} />
        </Field>
      </form>
    </Dialog>
  );
}
