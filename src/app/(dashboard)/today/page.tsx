"use client";

import { useMemo, useState } from "react";
import TimerPanel from "@/components/schedule/timer-panel";
import { useAttendance } from "@/lib/hooks/use-attendance";
import { useTasks } from "@/lib/hooks/use-tasks";
import { useTimerState } from "@/lib/context/timer-context";
import { formatClock } from "@/lib/utils/time";

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function TodayPage() {
  const { tasks, loading: tasksLoading } = useTasks();
  const { attendance, loading: attendanceLoading, checkIn } = useAttendance();
  const { activeTimer } = useTimerState();

  const todayLabel = dayLabels[new Date().getDay()] ?? "Mon";

  const todaysTasks = useMemo(
    () => tasks.filter((task) => task.work_days?.includes(todayLabel)),
    [tasks, todayLabel],
  );
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const runningTaskId = activeTimer?.status === "running" ? activeTimer.taskId : null;

  const current = useMemo(() => {
    if (!todaysTasks.length) return null;

    if (runningTaskId) {
      const matched = todaysTasks.find((task) => task.id === runningTaskId);
      if (matched) return matched;
    }

    if (selectedTaskId) {
      const matched = todaysTasks.find((task) => task.id === selectedTaskId);
      if (matched) return matched;
    }

    return todaysTasks[0];
  }, [runningTaskId, selectedTaskId, todaysTasks]);

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Today&apos;s Schedule</h1>
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-800">Attendance</h2>
        {attendanceLoading ? <p className="mt-2 text-sm text-slate-500">Loading attendance...</p> : null}
        {attendance ? (
          <p className="mt-2 text-sm text-emerald-700">Checked in at {formatClock(new Date(attendance.checked_in_at))}</p>
        ) : (
          <button onClick={checkIn} className="mt-3 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white" type="button">Mark Attendance</button>
        )}
      </div>

      {tasksLoading ? <p className="text-sm text-slate-500">Loading tasks...</p> : null}
      {current ? (
        <div className="space-y-3">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="mb-1 block text-xs font-medium text-slate-600">Task switcher</label>
            <select
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
              value={current.id}
              onChange={(event) => setSelectedTaskId(event.target.value)}
              disabled={Boolean(runningTaskId)}
            >
              {todaysTasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.title}
                </option>
              ))}
            </select>
            {runningTaskId ? (
              <p className="mt-2 text-xs text-amber-700">Pause or stop the running task to switch.</p>
            ) : null}
          </div>

          <TimerPanel
            key={`${current.id}-${current.planned_hours}-${current.planned_minutes}`}
            taskId={current.id}
            taskName={current.title}
            plannedSeconds={(current.planned_hours * 3600) + (current.planned_minutes * 60)}
          />
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">No tasks scheduled for {todayLabel} yet.</p>
      )}

      {todaysTasks.length > 0 ? (
        <div className="space-y-2">
          {todaysTasks.map((task) => {
            const isActive = activeTimer?.taskId === task.id;

            return (
              <article key={task.id} className={`rounded-xl border bg-white p-4 shadow-sm ${isActive ? "border-blue-400" : "border-slate-200"}`}>
                <h3 className="font-semibold text-slate-900">{task.title}</h3>
                <p className="text-sm text-slate-600">Planned {task.planned_hours}h {task.planned_minutes}m</p>
                {isActive ? <p className="mt-1 text-xs font-medium text-blue-700">Active timer task</p> : null}
              </article>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}
