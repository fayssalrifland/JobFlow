"use client";

import { forwardRef, useId, useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const controlClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition-colors focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:placeholder:text-slate-500 dark:disabled:bg-slate-900";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
  required,
}: {
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
  className?: string;
  required?: boolean;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label
        htmlFor={htmlFor}
        className="block text-xs font-medium text-slate-700 dark:text-slate-300"
      >
        {label}
        {required ? (
          <span className="ml-0.5 text-rose-500" aria-hidden>
            *
          </span>
        ) : null}
      </label>
      {children}
      {hint && !error ? (
        <p className="text-[11px] text-slate-500 dark:text-slate-400">{hint}</p>
      ) : null}
      {error ? (
        <p role="alert" className="text-[11px] font-medium text-rose-600 dark:text-rose-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn(controlClass, className)} {...props} />;
  },
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(controlClass, "min-h-24", className)} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select ref={ref} className={cn(controlClass, "pr-8", className)} {...props}>
        {children}
      </select>
    );
  },
);

export function Checkbox({
  label,
  description,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string; description?: string }) {
  const id = useId();
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 dark:border-slate-600 dark:bg-slate-900"
        {...props}
      />
      <div className="text-sm">
        <label htmlFor={id} className="font-medium text-slate-800 dark:text-slate-200">
          {label}
        </label>
        {description ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">{description}</p>
        ) : null}
      </div>
    </div>
  );
}

export function TagInput({
  value,
  onChange,
  id,
  suggestions = [],
  placeholder = "Add a tag and press Enter",
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  id?: string;
  suggestions?: string[];
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");
  const listId = useId();

  const add = (raw: string) => {
    const tag = raw.trim().toLowerCase().replace(/\s+/g, "-").slice(0, 24);
    if (!tag || value.includes(tag) || value.length >= 12) return;
    onChange([...value, tag]);
    setDraft("");
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5" role="list" aria-label="Selected tags">
        {value.map((tag) => (
          <span
            key={tag}
            role="listitem"
            className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
          >
            #{tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((item) => item !== tag))}
              aria-label={`Remove tag ${tag}`}
              className="rounded-full p-0.5 hover:bg-indigo-100 dark:hover:bg-indigo-900"
            >
              <X className="h-3 w-3" aria-hidden />
            </button>
          </span>
        ))}
      </div>
      <input
        id={id}
        value={draft}
        list={listId}
        placeholder={placeholder}
        className={controlClass}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === ",") {
            event.preventDefault();
            add(draft);
          }
          if (event.key === "Backspace" && !draft && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={() => draft && add(draft)}
      />
      <datalist id={listId}>
        {suggestions.map((item) => (
          <option key={item} value={item} />
        ))}
      </datalist>
    </div>
  );
}
