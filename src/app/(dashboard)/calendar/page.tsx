"use client";

import { useMemo } from "react";
import { useHistory } from "@/lib/hooks/use-history";
import { formatDuration } from "@/lib/utils/time";

function getScoreColor(value: number) {
  if (value >= 80) return "bg-emerald-500";
  if (value >= 40) return "bg-amber-500";
  return "bg-rose-500";
}

export default function CalendarPage() {
  const { history, loading } = useHistory();

  const dailyRows = useMemo(() => {
    if (!history) return [];

    const map = new Map<string, { totalSeconds: number; completed: number; total: number }>();

    history.sessions.forEach((session) => {
      const day = session.created_at.slice(0, 10);
      const current = map.get(day) ?? { totalSeconds: 0, completed: 0, total: 0 };
      current.totalSeconds += session.total_seconds ?? 0;
      current.total += 1;
      if (session.status === "completed") current.completed += 1;
      map.set(day, current);
    });

    return [...map.entries()]
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .slice(0, 28)
      .map(([date, stats]) => {
        const ratio = stats.total === 0 ? 100 : Math.round((stats.completed / stats.total) * 100);
        return {
          date,
          ratio,
          totalSeconds: stats.totalSeconds,
          completed: stats.completed,
          total: stats.total,
        };
      });
  }, [history]);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Calendar & History</h1>
      {loading ? <p className="text-sm text-slate-500">Loading history...</p> : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {dailyRows.map((row) => (
          <article key={row.date} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">{row.date}</h3>
              <span className={`h-3 w-3 rounded-full ${getScoreColor(row.ratio)}`} />
            </div>
            <p className="mt-2 text-sm text-slate-600">Completion: {row.ratio}% ({row.completed}/{row.total})</p>
            <p className="text-sm text-slate-600">Logged: {formatDuration(row.totalSeconds)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
