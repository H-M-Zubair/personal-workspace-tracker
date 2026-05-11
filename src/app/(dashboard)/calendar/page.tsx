"use client";

import { useMemo } from "react";
import { addDays, format, startOfWeek, subWeeks } from "date-fns";
import { useHistory } from "@/lib/hooks/use-history";
import { useTasks } from "@/lib/hooks/use-tasks";
import { formatDuration } from "@/lib/utils/time";

type DayStats = {
  date: string;
  completed: number;
  total: number;
  totalSeconds: number;
  sessions: Array<{
    id: string;
    status: string;
    total_seconds: number;
    task?: { title?: string } | null;
  }>;
};

function getScoreColor(value: number) {
  if (value >= 80) return "bg-emerald-500";
  if (value >= 40) return "bg-amber-500";
  return "bg-rose-500";
}

export default function CalendarPage() {
  const { history, loading } = useHistory();
  const { tasks, loading: tasksLoading } = useTasks();

  const weekSections = useMemo(() => {
    if (!history) return [];

    const dailyMap = new Map<string, DayStats>();
    const todayDate = format(new Date(), "yyyy-MM-dd");

    history.sessions.forEach((session) => {
      const date = session.created_at.slice(0, 10);
      const current = dailyMap.get(date) ?? {
        date,
        completed: 0,
        total: 0,
        totalSeconds: 0,
        sessions: [],
      };

      current.total += 1;
      current.totalSeconds += session.total_seconds ?? 0;
      if (session.status === "completed") current.completed += 1;
      current.sessions.push({
        id: session.id,
        status: session.status,
        total_seconds: session.total_seconds ?? 0,
        task: session.task,
      });

      dailyMap.set(date, current);
    });

    const baseWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

    return Array.from({ length: 4 }, (_, offset) => {
      const weekStart = subWeeks(baseWeekStart, offset);
      const weekEnd = addDays(weekStart, 6);

      const days = Array.from({ length: 7 }, (_, index) => {
        const dayDate = addDays(weekStart, index);
        const key = format(dayDate, "yyyy-MM-dd");
        const isPastOrToday = key <= todayDate;
        const dayLabel = format(dayDate, "EEE");
        const hasAssignedTask = tasks.some((task) => {
          if (!task.is_active) return false;
          if ((task.created_at?.slice(0, 10) ?? "") > key) return false;
          if (task.frequency === "once") {
            return task.single_date === key;
          }
          return task.work_days?.includes(dayLabel);
        });

        if (!isPastOrToday || !hasAssignedTask) {
          return null;
        }

        const stats = dailyMap.get(key);

        return {
          date: key,
          label: dayLabel,
          dayOfMonth: format(dayDate, "d MMM"),
          completed: stats?.completed ?? 0,
          total: stats?.total ?? 0,
          totalSeconds: stats?.totalSeconds ?? 0,
          sessions: stats?.sessions ?? [],
        };
      });

      const filteredDays = days.filter((day): day is NonNullable<typeof day> => day !== null);
      const weekSeconds = filteredDays.reduce((sum, d) => sum + d.totalSeconds, 0);
      const weekCompleted = filteredDays.reduce((sum, d) => sum + d.completed, 0);
      const weekTotal = filteredDays.reduce((sum, d) => sum + d.total, 0);

      return {
        key: format(weekStart, "yyyy-MM-dd"),
        title: `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d")}`,
        weekSeconds,
        weekCompleted,
        weekTotal,
        days: filteredDays,
      };
    }).filter((week) => week.days.length > 0);
  }, [history, tasks]);

  return (
    <section className="space-y-5">
      <h1 className="text-2xl font-bold">Calendar & History</h1>
      {loading || tasksLoading ? <p className="text-sm text-slate-500">Loading history...</p> : null}

      {weekSections.map((week) => (
        <section key={week.key} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">Week: {week.title}</h2>
            <p className="text-xs text-slate-600">
              {week.weekCompleted}/{week.weekTotal} completed | Logged {formatDuration(week.weekSeconds)}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {week.days.map((day) => {
              const ratio = day.total === 0 ? 100 : Math.round((day.completed / day.total) * 100);

              return (
                <article key={day.date} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{day.label}</p>
                      <p className="text-xs text-slate-600">{day.dayOfMonth}</p>
                    </div>
                    <span className={`h-3 w-3 rounded-full ${getScoreColor(ratio)}`} />
                  </div>

                  <p className="mt-2 text-xs text-slate-600">Completion: {ratio}% ({day.completed}/{day.total})</p>
                  <p className="text-xs text-slate-600">Logged: {formatDuration(day.totalSeconds)}</p>

                  <div className="mt-2 space-y-1">
                    {day.sessions.length === 0 ? <p className="text-xs text-slate-400">No tasks</p> : null}
                    {day.sessions.slice(0, 3).map((session) => (
                      <div key={session.id} className="rounded border border-slate-200 bg-white px-2 py-1">
                        <p className="truncate text-xs font-medium text-slate-800">{session.task?.title ?? "Untitled Task"}</p>
                        <p className="text-[11px] text-slate-600">{session.status} - {formatDuration(session.total_seconds)}</p>
                      </div>
                    ))}
                    {day.sessions.length > 3 ? <p className="text-[11px] text-slate-500">+{day.sessions.length - 3} more</p> : null}
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </section>
  );
}
