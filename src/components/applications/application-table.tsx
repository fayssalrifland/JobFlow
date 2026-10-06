"use client";

import Link from "next/link";
import { CompanyAvatar, PriorityBadge, StatusBadge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { INTERVIEW_TYPE_LABEL, LOCATION_TYPE_LABEL } from "@/lib/constants";
import { formatSalary, formatShortDate, relativeDay } from "@/lib/utils";
import { appHref } from "@/services/api";
import type { ApplicationDTO } from "@/types";

export function ApplicationTable({ applications }: { applications: ApplicationDTO[] }) {
  if (applications.length === 0) {
    return (
      <EmptyState
        title="No applications match your filters"
        description="Adjust or reset the filters to see more results."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <div className="thin-scrollbar overflow-x-auto">
        <table className="w-full min-w-[56rem] border-collapse text-sm">
          <caption className="sr-only">Applications list</caption>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400">
              <th scope="col" className="px-4 py-3 font-medium">Company</th>
              <th scope="col" className="px-4 py-3 font-medium">Position</th>
              <th scope="col" className="px-4 py-3 font-medium">Status</th>
              <th scope="col" className="px-4 py-3 font-medium">Priority</th>
              <th scope="col" className="px-4 py-3 font-medium">Applied</th>
              <th scope="col" className="px-4 py-3 font-medium">Next action</th>
              <th scope="col" className="px-4 py-3 font-medium">Location</th>
              <th scope="col" className="px-4 py-3 font-medium">Salary</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {applications.map((application) => {
              const nextAction = application.nextInterview
                ? `${INTERVIEW_TYPE_LABEL[application.nextInterview.type]} · ${relativeDay(application.nextInterview.scheduledAt)}`
                : application.nextFollowUpDate
                  ? `Follow up · ${relativeDay(application.nextFollowUpDate)}`
                  : "—";
              return (
                <tr key={application.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <CompanyAvatar name={application.company.name} accent={application.company.accent} size="sm" />
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {application.company.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={appHref(`/app/applications/${application.id}`)}
                      className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                    >
                      {application.position}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={application.status} />
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={application.priority} />
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                    {formatShortDate(application.appliedDate)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">{nextAction}</td>
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-300">
                    {application.location || LOCATION_TYPE_LABEL[application.locationType]}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-slate-600 dark:text-slate-300">
                    {formatSalary(application.salaryMin, application.salaryMax, application.currency)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
