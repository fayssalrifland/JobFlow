"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CalendarClock, CheckCircle2, Info, Target } from "lucide-react";
import { useMarkAllNotifications, useMarkNotification, useNotifications } from "@/hooks/use-notifications";
import { appHref } from "@/services/api";
import { Button } from "@/components/ui/button";
import { cn, relativeTime } from "@/lib/utils";

const ICONS = {
  INTERVIEW: CalendarClock,
  REMINDER: Target,
  STATUS: CheckCircle2,
  SYSTEM: Info,
} as const;

export function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { data, isLoading } = useNotifications();
  const markOne = useMarkNotification();
  const markAll = useMarkAllNotifications();

  useEffect(() => {
    if (!open) return;
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const unread = data?.unread ?? 0;

  return (
    <div className="relative" ref={containerRef}>
      <Button
        variant="ghost"
        size="icon"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
        className="relative"
      >
        <Bell className="h-[18px] w-[18px]" aria-hidden />
        {unread > 0 ? (
          <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div
          role="dialog"
          aria-label="Notification center"
          className="animate-in-up absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900"
        >
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <p className="text-sm font-semibold">Notifications</p>
            <button
              type="button"
              onClick={() => markAll.mutate()}
              disabled={unread === 0 || markAll.isPending}
              className="text-xs font-medium text-indigo-600 hover:underline disabled:opacity-40 dark:text-indigo-400"
            >
              Mark all as read
            </button>
          </div>
          <ul className="thin-scrollbar max-h-96 divide-y divide-slate-100 overflow-y-auto dark:divide-slate-800">
            {isLoading ? (
              <li className="px-4 py-6 text-center text-xs text-slate-500">Loading…</li>
            ) : null}
            {!isLoading && (data?.items.length ?? 0) === 0 ? (
              <li className="px-4 py-8 text-center text-xs text-slate-500">
                You are all caught up.
              </li>
            ) : null}
            {data?.items.map((item) => {
              const Icon = ICONS[item.type] ?? Info;
              const content = (
                <div className="flex gap-3">
                  <span
                    className={cn(
                      "mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full",
                      item.read
                        ? "bg-slate-100 text-slate-400 dark:bg-slate-800"
                        : "bg-indigo-50 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-300",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "truncate text-xs font-semibold",
                        item.read ? "text-slate-600 dark:text-slate-300" : "text-slate-900 dark:text-white",
                      )}
                    >
                      {item.title}
                    </p>
                    {item.body ? (
                      <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                        {item.body}
                      </p>
                    ) : null}
                    <p className="mt-1 text-[10px] uppercase tracking-wide text-slate-400">
                      {relativeTime(item.createdAt)}
                    </p>
                  </div>
                </div>
              );

              return (
                <li key={item.id} className="px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/60">
                  {item.href ? (
                    <Link
                      href={appHref(item.href)}
                      onClick={() => {
                        if (!item.read) markOne.mutate({ id: item.id, read: true });
                        setOpen(false);
                      }}
                      className="block"
                    >
                      {content}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className="block w-full text-left"
                      onClick={() => markOne.mutate({ id: item.id, read: !item.read })}
                    >
                      {content}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
