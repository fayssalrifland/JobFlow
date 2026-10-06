"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Checkbox, Field, Input, Select } from "@/components/ui/form-controls";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Skeleton } from "@/components/ui/feedback";
import { useChangePassword, useSession, useUpdateProfile } from "@/hooks/use-session";
import { useUiStore } from "@/stores/ui-store";
import { CURRENCIES } from "@/lib/constants";
import {
  passwordSchema,
  profileSchema,
  type PasswordValues,
  type ProfileValues,
} from "@/lib/validation";

export default function SettingsPage() {
  const { data, isLoading } = useSession();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const setView = useUiStore((state) => state.setView);
  const view = useUiStore((state) => state.view);

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", email: "", headline: "" },
  });

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  useEffect(() => {
    if (data?.user) {
      profileForm.reset({
        name: data.user.name,
        email: data.user.email,
        headline: data.user.headline ?? "",
      });
    }
  }, [data?.user, profileForm]);

  if (isLoading || !data) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-56 rounded-xl" />
        <Skeleton className="h-56 rounded-xl" />
      </div>
    );
  }

  const user = data.user;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <PageHeader title="Settings" description="Manage your profile, security and preferences." />

      <Card>
        <CardHeader title="Profile" description="How your account is identified" />
        <CardBody className="pt-2">
          <form
            className="space-y-4"
            noValidate
            onSubmit={profileForm.handleSubmit((values) => updateProfile.mutate(values))}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" htmlFor="profile-name" error={profileForm.formState.errors.name?.message} required>
                <Input id="profile-name" {...profileForm.register("name")} />
              </Field>
              <Field
                label="Email"
                htmlFor="profile-email"
                error={profileForm.formState.errors.email?.message}
                required
              >
                <Input id="profile-email" type="email" {...profileForm.register("email")} />
              </Field>
            </div>
            <Field label="Headline" htmlFor="profile-headline" hint="e.g. Senior Frontend Engineer">
              <Input id="profile-headline" {...profileForm.register("headline")} />
            </Field>
            <Button type="submit" size="sm" loading={updateProfile.isPending}>
              Save profile
            </Button>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Password" description="Use at least 8 characters" />
        <CardBody className="pt-2">
          {user.isDemo ? (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/60 dark:text-amber-200">
              The shared demo account password cannot be changed. Create your own account to use this.
            </p>
          ) : (
            <form
              className="space-y-4"
              noValidate
              onSubmit={passwordForm.handleSubmit(async (values) => {
                await changePassword.mutateAsync(values);
                passwordForm.reset();
              })}
            >
              <Field
                label="Current password"
                htmlFor="current-password"
                error={passwordForm.formState.errors.currentPassword?.message}
                required
              >
                <Input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  {...passwordForm.register("currentPassword")}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="New password"
                  htmlFor="new-password"
                  error={passwordForm.formState.errors.newPassword?.message}
                  required
                >
                  <Input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    {...passwordForm.register("newPassword")}
                  />
                </Field>
                <Field
                  label="Confirm new password"
                  htmlFor="confirm-password"
                  error={passwordForm.formState.errors.confirmPassword?.message}
                  required
                >
                  <Input
                    id="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    {...passwordForm.register("confirmPassword")}
                  />
                </Field>
              </div>
              <Button type="submit" size="sm" loading={changePassword.isPending}>
                Update password
              </Button>
            </form>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Preferences" description="Theme, currency, default view and notifications" />
        <CardBody className="space-y-5 pt-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium text-slate-800 dark:text-slate-200">Theme</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Light, dark or follow your system</p>
            </div>
            <ThemeToggle />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Default currency" htmlFor="currency">
              <Select
                id="currency"
                value={user.defaultCurrency}
                onChange={(event) => updateProfile.mutate({ defaultCurrency: event.target.value })}
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Default application view" htmlFor="default-view">
              <Select
                id="default-view"
                value={view}
                onChange={(event) => {
                  const next = event.target.value as "kanban" | "list";
                  setView(next);
                  updateProfile.mutate({ defaultView: next });
                }}
              >
                <option value="kanban">Kanban board</option>
                <option value="list">List / table</option>
              </Select>
            </Field>
          </div>

          <div className="space-y-3">
            <Checkbox
              label="In-app notifications"
              description="Status changes, interviews and reminders in the notification centre."
              checked={user.inAppNotifications}
              onChange={(event) => updateProfile.mutate({ inAppNotifications: event.target.checked })}
            />
            <Checkbox
              label="Email reminders"
              description="Opt in to email follow-ups (requires an email provider to be configured)."
              checked={user.emailReminders}
              onChange={(event) => updateProfile.mutate({ emailReminders: event.target.checked })}
            />
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
