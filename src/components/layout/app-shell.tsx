"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  BarChart3,
  Bell,
  CalendarDays,
  FileText,
  LayoutDashboard,
  List,
  LogOut,
  Menu,
  Plus,
  RotateCcw,
  Settings,
  SquareKanban,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationCenter } from "@/components/layout/notification-center";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { ApplicationFormDialog } from "@/components/applications/application-form-dialog";
import { api, setToken, appHref } from "@/services/api";
import { cn, initialsOf } from "@/lib/utils";
import type { SessionUserDTO } from "@/types";

const NAV = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/board", label: "Board", icon: SquareKanban },
  { href: "/app/applications", label: "Applications", icon: List },
  { href: "/app/interviews", label: "Interviews", icon: CalendarDays },
  { href: "/app/reminders", label: "Reminders", icon: Bell },
  { href: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/app/documents", label: "Documents", icon: FileText },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

const MOBILE_NAV = NAV.filter((item) =>
  ["/app/dashboard", "/app/board", "/app/applications", "/app/interviews", "/app/analytics"].includes(
    item.href,
  ),
);

export function AppShell({ user, children }: { user: SessionUserDTO; children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {
      /* ignore */
    }
    setToken(null);
    queryClient.clear();
    window.location.assign("/");
  };

  const resetDemo = async () => {
    setResetting(true);
    try {
      await api.post("/api/demo/reset");
      queryClient.clear();
      toast.success("Demo data reset");
      router.refresh();
    } catch (error) {
      toast.error((error as Error).message);
    } finally {
      setResetting(false);
    }
  };

  const navList = (
    <nav aria-label="Primary" className="flex flex-1 flex-col gap-0.5 px-3">
      {NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={appHref(item.href)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white",
            )}
          >
            <item.icon className="h-[18px] w-[18px]" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const sidebarFooter = (
    <div className="space-y-3 border-t border-slate-200 p-3 dark:border-slate-800">
      <div className="flex items-center gap-3 rounded-lg px-1 py-1">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-slate-900 text-xs font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
          {initialsOf(user.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
        </div>
      </div>
      <div className="flex items-center justify-between gap-2">
        <ThemeToggle />
        <Button variant="ghost" size="sm" onClick={logout} aria-label="Sign out">
          <LogOut className="h-4 w-4" aria-hidden />
          Sign out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex dark:border-slate-800 dark:bg-slate-900">
        <div className="flex h-16 items-center gap-2 px-5">
          <Link href={appHref("/app/dashboard")} className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              JF
            </span>
            <span className="text-base font-semibold tracking-tight">JobFlow</span>
          </Link>
        </div>
        <div className="px-3 pb-3">
          <Button className="w-full" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Add application
          </Button>
        </div>
        {navList}
        {sidebarFooter}
      </aside>

      {/* Mobile drawer */}
      {drawerOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="animate-in-up absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-xl dark:bg-slate-900">
            <div className="flex h-16 items-center justify-between px-5">
              <span className="text-base font-semibold">JobFlow</span>
              <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(false)} aria-label="Close navigation">
                <X className="h-4 w-4" aria-hidden />
              </Button>
            </div>
            {navList}
            {sidebarFooter}
          </div>
        </div>
      ) : null}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-slate-200 bg-white/90 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" aria-hidden />
          </Button>
          <Link href={appHref("/app/dashboard")} className="flex items-center gap-2 lg:hidden">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-indigo-600 text-xs font-bold text-white">
              JF
            </span>
          </Link>

          {user.isDemo ? (
            <span className="ml-1 hidden items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700 sm:inline-flex dark:bg-amber-950 dark:text-amber-300">
              Demo Account — fictional data
            </span>
          ) : null}

          <div className="ml-auto flex items-center gap-1">
            {user.isDemo ? (
              <Button variant="ghost" size="sm" onClick={resetDemo} loading={resetting} className="hidden sm:inline-flex">
                <RotateCcw className="h-4 w-4" aria-hidden />
                Reset demo
              </Button>
            ) : null}
            <Button size="sm" className="hidden sm:inline-flex lg:hidden" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden />
              Add
            </Button>
            <NotificationCenter />
          </div>
        </header>

        <main id="main-content" className="px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pb-10">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Mobile"
        className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden dark:border-slate-800 dark:bg-slate-900/95"
      >
        {MOBILE_NAV.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={appHref(item.href)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium",
                active ? "text-indigo-600 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400",
              )}
            >
              <item.icon className="h-5 w-5" aria-hidden />
              {item.label}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium text-slate-500 dark:text-slate-400"
        >
          <Plus className="h-5 w-5" aria-hidden />
          Add
        </button>
      </nav>

      <ApplicationFormDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
