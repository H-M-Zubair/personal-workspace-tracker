"use client";

import TimerPanel from "@/components/schedule/timer-panel";
import { useTasks } from "@/lib/hooks/use-tasks";

export default function TodayPage() {
  const { tasks, loading } = useTasks();
  const current = tasks[0];

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Today&apos;s Schedule</h1>
      <p className="text-slate-600">Track active focus sessions and attendance from one place.</p>
      {loading ? <p className="text-sm text-slate-500">Loading tasks...</p> : null}
      {current ? (
        <TimerPanel
          taskId={current.id}
          taskName={current.title}
          plannedSeconds={(current.planned_hours * 3600) + (current.planned_minutes * 60)}
        />
      ) : (
        <p className="rounded-xl border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">No tasks available for timer run yet.</p>
      )}
    </section>
  );
}
