"use client";

import TaskCreateForm from "@/components/tasks/task-create-form";
import { useTasks } from "@/lib/hooks/use-tasks";

export default function TasksPage() {
  const { tasks, loading, refresh } = useTasks();

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Task Management</h1>
      <TaskCreateForm onCreated={refresh} />
      {loading ? <p className="text-sm text-slate-500">Loading tasks...</p> : null}
      <div className="space-y-3">
        {tasks.map((task) => (
          <article key={task.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-lg font-semibold">{task.title}</h3>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs">{task.priority}</span>
            </div>
            <p className="mt-2 text-sm text-slate-600">{task.description ?? "No description"}</p>
            <p className="mt-2 text-xs text-slate-500">Planned: {task.planned_hours}h {task.planned_minutes}m | Days: {task.work_days?.join(", ")}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
