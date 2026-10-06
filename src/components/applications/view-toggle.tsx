"use client";

import Link from "next/link";
import { List, SquareKanban } from "lucide-react";
import { useUiStore } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

export function ViewToggle({ active }: { active: "kanban" | "list" }) {
  const setView = useUiStore((state) => state.setView);

  const items = [
    { key: "kanban" as const, label: "Kanban", href: "/app/board", icon: SquareKanban },
    { key: "list" as const, label: "List", href: "/app/applications", icon: List },
  ];

  return (
    <div
      className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-900"
      role="group"
      aria-label="Switch application view"
    >
      {items.map((item) => (
        <Link
          key={item.key}
          href={item.href}
          onClick={() => setView(item.key)}
          aria-current={active === item.key ? "page" : undefined}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            active === item.key
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
              : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
          )}
        >
          <item.icon className="h-3.5 w-3.5" aria-hidden />
          {item.label}
        </Link>
      ))}
    </div>
  );
}
