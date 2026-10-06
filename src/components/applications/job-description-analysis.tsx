"use client";

import { useMutation } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { api } from "@/services/api";
import type { JobAnalysis } from "@/lib/job-analysis";

function SkillList({ title, items, tone }: { title: string; items: string[]; tone: "required" | "optional" }) {
  if (items.length === 0) return null;
  return (
    <div>
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {title}
      </h4>
      <ul className="mt-2 flex flex-wrap gap-1.5">
        {items.map((item) => (
          <li
            key={item}
            className={
              tone === "required"
                ? "rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
                : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            }
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function JobDescriptionAnalysis({ text }: { text: string | null }) {
  const analyze = useMutation({
    mutationFn: (value: string) =>
      api.post<{ analysis: JobAnalysis; engine: string }>("/api/analyze-job", { text: value }),
  });

  if (!text?.trim()) {
    return (
      <EmptyState
        title="No job description saved"
        description="Paste the job description when editing this application to extract required skills and keywords."
        icon={<Sparkles className="h-5 w-5" aria-hidden />}
      />
    );
  }

  const analysis = analyze.data?.analysis;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button size="sm" onClick={() => analyze.mutate(text)} loading={analyze.isPending}>
          <Sparkles className="h-4 w-4" aria-hidden />
          {analysis ? "Re-analyse" : "Analyse description"}
        </Button>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Runs a local keyword model — no external API keys required.
        </p>
      </div>

      {analyze.isError ? (
        <p role="alert" className="text-xs text-rose-600">
          {(analyze.error as Error).message}
        </p>
      ) : null}

      {analysis ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4 rounded-lg bg-slate-50 px-4 py-3 text-xs dark:bg-slate-800/50">
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">
                {analysis.yearsOfExperience ? `${analysis.yearsOfExperience}+ years` : "Not stated"}
              </p>
              <p className="text-slate-500 dark:text-slate-400">Experience</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">{analysis.technologies.length}</p>
              <p className="text-slate-500 dark:text-slate-400">Technologies detected</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-slate-100">{analysis.wordCount}</p>
              <p className="text-slate-500 dark:text-slate-400">Words</p>
            </div>
          </div>

          <SkillList title="Required skills" items={analysis.requiredSkills} tone="required" />
          <SkillList title="Nice to have" items={analysis.preferredSkills} tone="optional" />

          {analysis.responsibilities.length > 0 ? (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Responsibilities
              </h4>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600 dark:text-slate-300">
                {analysis.responsibilities.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {analysis.keywords.length > 0 ? (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Frequent keywords
              </h4>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {analysis.keywords.map((keyword) => (
                  <li
                    key={keyword.word}
                    className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                  >
                    {keyword.word} · {keyword.count}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
