"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form-controls";
import { DemoButton } from "@/components/marketing/demo-button";
import { api, setToken, withToken } from "@/services/api";
import { loginSchema, type LoginValues } from "@/lib/validation";

function LoginForm() {
  const searchParams = useSearchParams();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);
    try {
      const result = await api.post<{ token?: string }>("/api/auth/login", values);
      setToken(result.token ?? null);
      window.location.assign(withToken(searchParams.get("next") ?? "/app/dashboard", result.token));
    } catch (error) {
      setFormError((error as Error).message);
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {formError ? (
        <p
          role="alert"
          className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-950/50 dark:text-rose-300"
        >
          {formError}
        </p>
      ) : null}
      <Field label="Email" htmlFor="email" error={errors.email?.message} required>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
      </Field>
      <Field label="Password" htmlFor="password" error={errors.password?.message} required>
        <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
      </Field>
      <Button type="submit" className="w-full" loading={isSubmitting}>
        Sign in
      </Button>
    </form>
  );
}

export default function LoginPage() {
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
          <h1 className="text-xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Sign in to continue tracking your job search.
          </p>

          <div className="mt-6">
            <Suspense fallback={<p className="text-sm text-slate-500">Loading…</p>}>
              <LoginForm />
            </Suspense>
          </div>

          <div className="my-5 flex items-center gap-3 text-[11px] uppercase tracking-wide text-slate-400">
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
            or
            <span className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          </div>

          <DemoButton size="md" className="w-full">
            Explore the demo account
          </DemoButton>

          <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            No account yet?{" "}
            <Link href="/register" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
