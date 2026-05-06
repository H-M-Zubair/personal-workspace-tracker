"use client";

import { useState } from "react";
import TaskCreateForm from "@/components/tasks/task-create-form";
import TaskEditForm from "@/components/tasks/task-edit-form";
import { useTasks } from "@/lib/hooks/use-tasks";

export default function TasksPage() {
  const { tasks, loading, refresh, deleteTask } = useTasks();
  const [editingId, setEditingId] = useState<string | null>(null);

  const onDelete = async (taskId: string) => {
    const okay = window.confirm("Delete this task?");
    if (!okay) return;
    await deleteTask(taskId);
  };

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
            <p className="mt-2 text-xs text-slate-500">Planned: {task.planned_hours}h {task.planned_minutes}m</p>
            <p className="mt-1 text-xs text-slate-500">Days: {task.work_days?.join(", ")}</p>
            <p className="mt-1 text-xs text-slate-500">Category: {task.category}</p>

            <div className="mt-3 flex gap-2">
              <button type="button" onClick={() => setEditingId(task.id)} className="rounded-lg border border-blue-300 px-3 py-1.5 text-xs text-blue-700">Edit</button>
              <button type="button" onClick={() => onDelete(task.id)} className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs text-rose-700">Delete</button>
            </div>

            {editingId === task.id ? (
              <TaskEditForm
                task={task}
                onCancel={() => setEditingId(null)}
                onSaved={async () => {
                  setEditingId(null);
                  await refresh();
                }}
              />
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
