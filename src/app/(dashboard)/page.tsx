"use client";

import { useStats } from "@/lib/hooks/use-stats";
import { getTodayLabel } from "@/lib/utils/date";
import { formatDuration } from "@/lib/utils/time";

export default function DashboardPage() {
  const { stats, loading } = useStats();

  const cards = [
    { label: "Hours logged today", value: stats ? formatDuration(stats.totalSeconds) : "--" },
    { label: "Tasks completed", value: stats ? `${stats.tasksCompleted}/${stats.totalTasks}` : "--" },
    { label: "Success ratio", value: stats ? `${stats.successRatio}%` : "--" },
    { label: "Current streak", value: stats ? `${stats.streak} days` : "--" },
  ];

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-slate-600">{getTodayLabel()}</p>
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
    </section>
  );
}
