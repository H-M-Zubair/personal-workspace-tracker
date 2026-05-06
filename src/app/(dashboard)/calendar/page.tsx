"use client";

import { useMemo, useState } from "react";
import { useHistory } from "@/lib/hooks/use-history";
import { formatDuration } from "@/lib/utils/time";

function getScoreColor(value: number) {
  if (value >= 80) return "bg-emerald-500";
  if (value >= 40) return "bg-amber-500";
  return "bg-rose-500";
}

export default function CalendarPage() {
  const { history, loading } = useHistory();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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

  const selectedSessions = useMemo(() => {
    if (!history || !selectedDate) return [];
    return history.sessions.filter((session) => session.created_at.slice(0, 10) === selectedDate);
  }, [history, selectedDate]);

  const weeklySummary = useMemo(() => {
    const rows = [...dailyRows].slice(0, 7);
    const totalSeconds = rows.reduce((sum, row) => sum + row.totalSeconds, 0);
    const totalCompleted = rows.reduce((sum, row) => sum + row.completed, 0);
    const totalTasks = rows.reduce((sum, row) => sum + row.total, 0);
    const ratio = totalTasks === 0 ? 100 : Math.round((totalCompleted / totalTasks) * 100);
    return { totalSeconds, totalCompleted, totalTasks, ratio };
  }, [dailyRows]);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Calendar & History</h1>
      {loading ? <p className="text-sm text-slate-500">Loading history...</p> : null}

      <div className="grid gap-3 md:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Last 7 days</p>
          <p className="mt-1 text-lg font-semibold">{formatDuration(weeklySummary.totalSeconds)}</p>
          <p className="text-xs text-slate-500">Total focused time</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Completion</p>
          <p className="mt-1 text-lg font-semibold">{weeklySummary.totalCompleted}/{weeklySummary.totalTasks}</p>
          <p className="text-xs text-slate-500">Completed sessions</p>
        </article>
        <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500">Success ratio</p>
          <p className="mt-1 text-lg font-semibold">{weeklySummary.ratio}%</p>
          <p className="text-xs text-slate-500">Average weekly quality</p>
        </article>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {dailyRows.map((row) => (
          <button
            key={row.date}
            type="button"
            onClick={() => setSelectedDate(row.date)}
            className={`rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm ${selectedDate === row.date ? "ring-2 ring-blue-500" : ""}`}
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">{row.date}</h3>
              <span className={`h-3 w-3 rounded-full ${getScoreColor(row.ratio)}`} />
            </div>
            <p className="mt-2 text-sm text-slate-600">Completion: {row.ratio}% ({row.completed}/{row.total})</p>
            <p className="text-sm text-slate-600">Logged: {formatDuration(row.totalSeconds)}</p>
          </button>
        ))}
      </div>

      {selectedDate ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-lg font-semibold">Day detail: {selectedDate}</h2>
          <div className="mt-3 space-y-2">
            {selectedSessions.length === 0 ? <p className="text-sm text-slate-500">No sessions found.</p> : null}
            {selectedSessions.map((session) => (
              <article key={session.id} className="rounded-lg border border-slate-100 p-3">
                <p className="font-medium text-slate-900">{session.task?.title ?? "Untitled Task"}</p>
                <p className="text-sm text-slate-600">{session.status} - {formatDuration(session.total_seconds ?? 0)}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
