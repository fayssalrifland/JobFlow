"use client";

import { useCallback, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { useCreateInterview } from "@/hooks/use-interviews";
import { useApplications } from "@/hooks/use-applications";
import { INTERVIEW_TYPES, INTERVIEW_TYPE_LABEL } from "@/lib/constants";
import { interviewFormSchema, type InterviewFormValues } from "@/lib/validation";
import { toIsoDate } from "@/lib/utils";

export function InterviewFormDialog({
  open,
  onClose,
  applicationId,
}: {
  open: boolean;
  onClose: () => void;
  applicationId?: string;
}) {
  const { data } = useApplications({ sort: "updated" });
  const create = useCreateInterview();

  const makeDefaults = useCallback<() => InterviewFormValues>(
    () => ({
      applicationId: applicationId ?? "",
      type: "VIDEO",
      date: toIsoDate(new Date(Date.now() + 86_400_000)),
      time: "10:00",
      durationMinutes: "60",
      meetingUrl: "",
      interviewers: "",
      notes: "",
    }),
    [applicationId],
  );

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<InterviewFormValues>({
    resolver: zodResolver(interviewFormSchema),
    defaultValues: {
      applicationId: applicationId ?? "",
      type: "VIDEO",
      date: "",
      time: "10:00",
      durationMinutes: "60",
      meetingUrl: "",
      interviewers: "",
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
      title="Schedule interview"
      description="Interviews appear on your dashboard and in the interview calendar."
      footer={
        <>
          <Button variant="secondary" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button size="sm" type="submit" form="interview-form" loading={isSubmitting}>
            Schedule
          </Button>
        </>
      }
    >
      <form id="interview-form" onSubmit={onSubmit} className="space-y-4" noValidate>
        {!applicationId ? (
          <Field label="Application" htmlFor="interview-application" error={errors.applicationId?.message} required>
            <Select id="interview-application" {...register("applicationId")}>
              <option value="">Select an application…</option>
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
          <Field label="Interview type" htmlFor="interview-type">
            <Select id="interview-type" {...register("type")}>
              {INTERVIEW_TYPES.map((type) => (
                <option key={type} value={type}>
                  {INTERVIEW_TYPE_LABEL[type]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Duration (minutes)" htmlFor="interview-duration" error={errors.durationMinutes?.message}>
            <Input id="interview-duration" inputMode="numeric" {...register("durationMinutes")} />
          </Field>
          <Field label="Date" htmlFor="interview-date" error={errors.date?.message} required>
            <Input id="interview-date" type="date" {...register("date")} />
          </Field>
          <Field label="Time" htmlFor="interview-time" error={errors.time?.message} required>
            <Input id="interview-time" type="time" {...register("time")} />
          </Field>
        </div>

        <Field label="Meeting URL" htmlFor="interview-url" error={errors.meetingUrl?.message}>
          <Input id="interview-url" type="url" placeholder="https://" {...register("meetingUrl")} />
        </Field>
        <Field label="Interviewers" htmlFor="interview-people" hint="Comma separated names and roles">
          <Input id="interview-people" {...register("interviewers")} />
        </Field>
        <Field label="Notes" htmlFor="interview-notes">
          <Textarea id="interview-notes" rows={3} {...register("notes")} />
        </Field>
      </form>
    </Dialog>
  );
}
