"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useStats } from "@/lib/hooks/use-stats";
import { getTodayLabel } from "@/lib/utils/date";
import { formatDuration } from "@/lib/utils/time";

type RangeKey = "weekly" | "monthly" | "yearly";

export default function DashboardPage() {
  const { stats, loading } = useStats();
  const [range, setRange] = useState<RangeKey>("weekly");
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  const rangeStats = stats?.ranges[range];

  const cards = useMemo(
    () => [
      { label: "Hours logged today", value: stats ? formatDuration(stats.today.totalSeconds) : "--" },
      {
        label: `${range[0].toUpperCase()}${range.slice(1)} completed`,
        value: stats ? `${rangeStats?.tasksCompleted ?? 0}/${rangeStats?.totalTasks ?? 0}` : "--",
      },
      { label: `${range[0].toUpperCase()}${range.slice(1)} success`, value: stats ? `${rangeStats?.successRatio ?? 0}%` : "--" },
      { label: "Current streak", value: stats ? `${stats.today.streak} days` : "--" },
    ],
    [range, rangeStats, stats],
  );

  const gaugeData = [{ name: "Success", value: rangeStats?.successRatio ?? 0, fill: "#10B981" }];

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-slate-600">{getTodayLabel()}</p>
        </div>
        <div className="flex rounded-lg border border-slate-200 bg-white p-1">
          {(["weekly", "monthly", "yearly"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setRange(key)}
              className={`rounded-md px-3 py-1.5 text-sm ${range === key ? "bg-blue-600 text-white" : "text-slate-700"}`}
            >
              {key[0].toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {loading ? <p className="text-sm text-slate-500">Loading stats...</p> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article key={card.label} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm xl:col-span-2">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Weekly hours breakdown</h2>
          <div className="h-64 w-full">
            {!mounted ? <div className="h-full w-full animate-pulse rounded bg-slate-100" /> : null}
            {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.charts.weeklyHours ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="hours" fill="#3B82F6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            ) : null}
          </div>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-semibold text-slate-700">Success ratio gauge</h2>
          <div className="h-64 w-full">
            {!mounted ? <div className="h-full w-full animate-pulse rounded bg-slate-100" /> : null}
            {mounted ? (
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart cx="50%" cy="50%" innerRadius="60%" outerRadius="90%" barSize={20} data={gaugeData} startAngle={180} endAngle={0}>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar background dataKey="value" cornerRadius={10} />
                <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-900 text-xl font-semibold">
                  {`${rangeStats?.successRatio ?? 0}%`}
                </text>
              </RadialBarChart>
            </ResponsiveContainer>
            ) : null}
          </div>
        </article>
      </div>

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Task completion trend (last 7 days)</h2>
        <div className="h-64 w-full">
          {!mounted ? <div className="h-full w-full animate-pulse rounded bg-slate-100" /> : null}
          {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats?.charts.completionTrend ?? []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis domain={[0, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="ratio" stroke="#8B5CF6" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
          ) : null}
        </div>
      </article>

      <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-slate-700">Monthly hours trend (12 months)</h2>
        <div className="h-64 w-full">
          {!mounted ? <div className="h-full w-full animate-pulse rounded bg-slate-100" /> : null}
          {mounted ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats?.charts.monthlyHours ?? []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="hours" fill="#6366F1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          ) : null}
        </div>
      </article>
    </section>
  );
}
