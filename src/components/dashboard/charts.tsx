"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CHART_COLORS, STATUS_META } from "@/lib/constants";
import type { AnalyticsData, DashboardData } from "@/types";

const axisProps = {
  stroke: "currentColor",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

const tooltipStyle = {
  contentStyle: {
    borderRadius: 10,
    border: "1px solid rgba(148,163,184,0.3)",
    fontSize: 12,
    background: "rgba(255,255,255,0.98)",
    color: "#0f172a",
  },
} as const;

export function FunnelChart({ data }: { data: DashboardData["funnel"] }) {
  const max = Math.max(1, ...data.map((item) => item.count));
  return (
    <ol className="space-y-2.5">
      {data.map((stage) => (
        <li key={stage.stage}>
          <div className="flex items-baseline justify-between text-xs">
            <span className="font-medium text-slate-700 dark:text-slate-200">{stage.label}</span>
            <span className="tabular-nums text-slate-500 dark:text-slate-400">
              {stage.count} · {stage.rate}%
            </span>
          </div>
          <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{
                width: `${Math.max(2, (stage.count / max) * 100)}%`,
                backgroundColor: STATUS_META[stage.stage].bar,
              }}
            />
          </div>
        </li>
      ))}
    </ol>
  );
}

export function ApplicationsOverTimeChart({ data }: { data: DashboardData["overTime"] }) {
  return (
    <div className="h-64 w-full text-slate-500">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="applicationsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" vertical={false} />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis allowDecimals={false} {...axisProps} />
          <Tooltip {...tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Area
            type="monotone"
            dataKey="applications"
            name="Applications"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#applicationsFill)"
          />
          <Line type="monotone" dataKey="responses" name="Responses" stroke="#10b981" strokeWidth={2} dot={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TimeInStageChart({ data }: { data: DashboardData["timeInStage"] }) {
  return (
    <div className="h-56 w-full text-slate-500">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 24, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" horizontal={false} />
          <XAxis type="number" {...axisProps} unit="d" />
          <YAxis type="category" dataKey="label" width={92} {...axisProps} />
          <Tooltip {...tooltipStyle} formatter={(value) => [`${String(value)} days`, "Average"]} />
          <Bar dataKey="days" name="Avg days" radius={[0, 6, 6, 0]}>
            {data.map((entry) => (
              <Cell key={entry.stage} fill={STATUS_META[entry.stage].bar} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryBarChart({
  data,
  color = "#6366f1",
}: {
  data: { label: string; count: number }[];
  color?: string;
}) {
  return (
    <div className="h-64 w-full text-slate-500">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" vertical={false} />
          <XAxis dataKey="label" {...axisProps} interval={0} angle={-12} textAnchor="end" height={48} />
          <YAxis allowDecimals={false} {...axisProps} />
          <Tooltip {...tooltipStyle} />
          <Bar dataKey="count" name="Applications" fill={color} radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DonutChart({ data }: { data: { label: string; count: number }[] }) {
  return (
    <div className="h-64 w-full text-slate-500">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="count"
            nameKey="label"
            innerRadius="55%"
            outerRadius="80%"
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell key={entry.label} fill={CHART_COLORS[index % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip {...tooltipStyle} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MonthlyTrendChart({ data }: { data: AnalyticsData["perMonth"] }) {
  return (
    <div className="h-64 w-full text-slate-500">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="monthlyFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" vertical={false} />
          <XAxis dataKey="label" {...axisProps} />
          <YAxis allowDecimals={false} {...axisProps} />
          <Tooltip {...tooltipStyle} />
          <Area
            type="monotone"
            dataKey="applications"
            name="Applications"
            stroke="#0ea5e9"
            strokeWidth={2}
            fill="url(#monthlyFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
