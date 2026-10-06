"use client";

import { useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select, TagInput, Textarea } from "@/components/ui/form-controls";
import { useCreateApplication, useTags, useUpdateApplication } from "@/hooks/use-applications";
import { useCvs } from "@/hooks/use-cvs";
import { useSession } from "@/hooks/use-session";
import {
  APPLICATION_STATUSES,
  CURRENCIES,
  EMPLOYMENT_TYPES,
  EMPLOYMENT_TYPE_LABEL,
  LOCATION_TYPES,
  LOCATION_TYPE_LABEL,
  PRIORITIES,
  PRIORITY_META,
  SOURCES,
  SOURCE_LABEL,
  STATUS_META,
} from "@/lib/constants";
import { applicationFormSchema, type ApplicationFormValues } from "@/lib/validation";
import { toIsoDate } from "@/lib/utils";
import type { ApplicationDetailDTO } from "@/types";

function SectionTitle({ children, hint }: { children: string; hint?: string }) {
  return (
    <div className="mb-3 mt-6 border-b border-slate-200 pb-1.5 first:mt-0 dark:border-slate-800">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {children}
      </h3>
      {hint ? <p className="mt-0.5 text-[11px] text-slate-400">{hint}</p> : null}
    </div>
  );
}

export function ApplicationFormDialog({
  open,
  onClose,
  application,
}: {
  open: boolean;
  onClose: () => void;
  application?: ApplicationDetailDTO;
}) {
  const { data: session } = useSession();
  const { data: cvData } = useCvs();
  const { data: tagData } = useTags();
  const create = useCreateApplication();
  const update = useUpdateApplication(application?.id ?? "");

  const defaults = useMemo<ApplicationFormValues>(
    () => ({
      company: application?.company.name ?? "",
      position: application?.position ?? "",
      location: application?.location ?? "",
      locationType: application?.locationType ?? "REMOTE",
      employmentType: application?.employmentType ?? "FULL_TIME",
      jobUrl: application?.jobUrl ?? "",
      appliedDate: application?.appliedDate ?? toIsoDate(new Date()),
      status: application?.status ?? "APPLIED",
      priority: application?.priority ?? "MEDIUM",
      source: application?.source ?? "LINKEDIN",
      salaryMin: application?.salaryMin ? String(application.salaryMin) : "",
      salaryMax: application?.salaryMax ? String(application.salaryMax) : "",
      currency: (application?.currency ?? session?.user.defaultCurrency ?? "USD") as ApplicationFormValues["currency"],
      contactName: application?.contact?.name ?? "",
      contactEmail: application?.contact?.email ?? "",
      contactLinkedin: application?.contact?.linkedinUrl ?? "",
      nextFollowUpDate: application?.nextFollowUpDate ?? "",
      cvId: application?.cv?.id ?? "",
      tags: application?.tags ?? [],
      notes: application?.notes ?? "",
      jobDescription: application?.jobDescription ?? "",
      coverLetter: application?.coverLetter ?? "",
    }),
    [application, session?.user.defaultCurrency],
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationFormSchema),
    defaultValues: defaults,
    mode: "onBlur",
  });

  useEffect(() => {
    if (open) reset(defaults);
  }, [open, defaults, reset]);

  const onSubmit = handleSubmit(async (values) => {
    if (application) {
      await update.mutateAsync(values);
    } else {
      await create.mutateAsync(values);
    }
    onClose();
  });

  const errorSummary = Object.values(errors).filter(Boolean).length;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={application ? "Edit application" : "Add application"}
      description={
        application
          ? "Update the details of this application."
          : "Track a new opportunity from the first click to the offer."
      }
      size="xl"
      footer={
        <>
          <Button variant="secondary" size="sm" onClick={onClose} type="button">
            Cancel
          </Button>
          <Button size="sm" form="application-form" type="submit" loading={isSubmitting}>
            {application ? "Save changes" : "Create application"}
          </Button>
        </>
      }
    >
      <form id="application-form" onSubmit={onSubmit} noValidate>
        {errorSummary > 0 ? (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300"
          >
            Please fix {errorSummary} field{errorSummary > 1 ? "s" : ""} before saving.
          </div>
        ) : null}

        <SectionTitle>Job information</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Company" htmlFor="company" error={errors.company?.message} required>
            <Input id="company" autoComplete="organization" {...register("company")} />
          </Field>
          <Field label="Position" htmlFor="position" error={errors.position?.message} required>
            <Input id="position" {...register("position")} />
          </Field>
          <Field label="Location" htmlFor="location" error={errors.location?.message} hint="City, country or “Remote (EU)”">
            <Input id="location" {...register("location")} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Work setup" htmlFor="locationType">
              <Select id="locationType" {...register("locationType")}>
                {LOCATION_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {LOCATION_TYPE_LABEL[type]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Employment" htmlFor="employmentType">
              <Select id="employmentType" {...register("employmentType")}>
                {EMPLOYMENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {EMPLOYMENT_TYPE_LABEL[type]}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Job URL" htmlFor="jobUrl" error={errors.jobUrl?.message} className="sm:col-span-2">
            <Input id="jobUrl" type="url" placeholder="https://" {...register("jobUrl")} />
          </Field>
        </div>

        <SectionTitle>Application</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Applied on" htmlFor="appliedDate" error={errors.appliedDate?.message} required>
            <Input id="appliedDate" type="date" {...register("appliedDate")} />
          </Field>
          <Field label="Status" htmlFor="status">
            <Select id="status" {...register("status")}>
              {APPLICATION_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {STATUS_META[status].label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Priority" htmlFor="priority">
            <Select id="priority" {...register("priority")}>
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {PRIORITY_META[priority].label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Source" htmlFor="source">
            <Select id="source" {...register("source")}>
              {SOURCES.map((source) => (
                <option key={source} value={source}>
                  {SOURCE_LABEL[source]}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Next follow-up"
            htmlFor="nextFollowUpDate"
            error={errors.nextFollowUpDate?.message}
            className="sm:col-span-2"
          >
            <Input id="nextFollowUpDate" type="date" {...register("nextFollowUpDate")} />
          </Field>
          <Field label="CV used" htmlFor="cvId" className="sm:col-span-2">
            <Select id="cvId" {...register("cvId")}>
              <option value="">Not specified</option>
              {cvData?.items.map((cv) => (
                <option key={cv.id} value={cv.id}>
                  {cv.name}
                  {cv.version ? ` (${cv.version})` : ""}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <SectionTitle>Compensation</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Minimum salary" htmlFor="salaryMin" error={errors.salaryMin?.message}>
            <Input id="salaryMin" inputMode="numeric" placeholder="80000" {...register("salaryMin")} />
          </Field>
          <Field label="Maximum salary" htmlFor="salaryMax" error={errors.salaryMax?.message}>
            <Input id="salaryMax" inputMode="numeric" placeholder="110000" {...register("salaryMax")} />
          </Field>
          <Field label="Currency" htmlFor="currency">
            <Select id="currency" {...register("currency")}>
              {CURRENCIES.map((currency) => (
                <option key={currency} value={currency}>
                  {currency}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <SectionTitle>Contact</SectionTitle>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Name" htmlFor="contactName" error={errors.contactName?.message}>
            <Input id="contactName" {...register("contactName")} />
          </Field>
          <Field label="Email" htmlFor="contactEmail" error={errors.contactEmail?.message}>
            <Input id="contactEmail" type="email" {...register("contactEmail")} />
          </Field>
          <Field label="LinkedIn URL" htmlFor="contactLinkedin" error={errors.contactLinkedin?.message}>
            <Input id="contactLinkedin" type="url" placeholder="https://" {...register("contactLinkedin")} />
          </Field>
        </div>

        <SectionTitle>Additional</SectionTitle>
        <div className="space-y-4">
          <Field label="Tags" htmlFor="tags" hint="Press Enter to add. Up to 12 tags.">
            <Controller
              control={control}
              name="tags"
              render={({ field }) => (
                <TagInput
                  id="tags"
                  value={field.value ?? []}
                  onChange={field.onChange}
                  suggestions={tagData?.items.map((tag) => tag.label) ?? []}
                />
              )}
            />
          </Field>
          <Field label="Notes" htmlFor="notes" error={errors.notes?.message}>
            <Textarea id="notes" rows={3} {...register("notes")} />
          </Field>
          <Field
            label="Job description"
            htmlFor="jobDescription"
            hint="Paste the full description to unlock skill analysis on the detail page."
            error={errors.jobDescription?.message}
          >
            <Textarea id="jobDescription" rows={5} {...register("jobDescription")} />
          </Field>
          <Field label="Cover letter used" htmlFor="coverLetter" error={errors.coverLetter?.message}>
            <Textarea id="coverLetter" rows={3} {...register("coverLetter")} />
          </Field>
        </div>
      </form>
    </Dialog>
  );
}
