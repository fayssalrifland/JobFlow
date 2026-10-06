"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-controls";
import { DemoButton } from "@/components/marketing/demo-button";
import { api, setToken, withToken } from "@/services/api";
import { registerSchema, type RegisterValues } from "@/lib/validation";

export default function RegisterPage() {
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const result = await api.post<{ token?: string }>("/api/auth/register", values);
      setToken(result.token ?? null);
      window.location.assign(withToken("/app/dashboard", result.token));
    } catch (error) {
      setFormError((error as Error).message);
    }
  });

  return (
    <main className="grid min-h-screen place-items-center px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
            JF
          </span>
          <span className="text-lg font-semibold tracking-tight">JobFlow</span>
        </Link>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h1 className="text-xl font-semibold tracking-tight">Create your account</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Start tracking applications in less than a minute.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
            {formError ? (
              <p
                role="alert"
                className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300"
              >
                {formError}
              </p>
            ) : null}
            <Field label="Name" htmlFor="name" error={errors.name?.message} required>
              <Input id="name" autoComplete="name" {...register("name")} />
            </Field>
            <Field label="Email" htmlFor="email" error={errors.email?.message} required>
              <Input id="email" type="email" autoComplete="email" {...register("email")} />
            </Field>
            <Field
              label="Password"
              htmlFor="password"
              error={errors.password?.message}
              hint="At least 8 characters"
              required
            >
              <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
            </Field>
            <Field
              label="Confirm password"
              htmlFor="confirmPassword"
              error={errors.confirmPassword?.message}
              required
            >
              <Input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                {...register("confirmPassword")}
              />
            </Field>
            <Button type="submit" className="w-full" loading={isSubmitting}>
              Create account
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-wide text-slate-400">
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            or
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          </div>

          <DemoButton size="md" className="w-full">
            Explore the demo account
          </DemoButton>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
