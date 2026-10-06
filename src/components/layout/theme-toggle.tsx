"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useUiStore, type ThemePreference } from "@/stores/ui-store";
import { cn } from "@/lib/utils";

const OPTIONS: { value: ThemePreference; label: string; icon: typeof Sun }[] = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System", icon: Monitor },
];

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);

  return (
    <div
      role="radiogroup"
      aria-label="Colour theme"
      className={cn(
        "inline-flex rounded-lg border border-slate-200 bg-white p-0.5 dark:border-slate-700 dark:bg-slate-900",
        className,
      )}
    >
      {OPTIONS.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          role="radio"
          aria-checked={theme === value}
          aria-label={`${label} theme`}
          onClick={() => setTheme(value)}
          className={cn(
            "grid h-7 w-8 place-items-center rounded-md text-slate-500 transition-colors hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
            theme === value && "bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white",
          )}
        >
          <Icon className="h-3.5 w-3.5" aria-hidden />
        </button>
      ))}
    </div>
  );
}
