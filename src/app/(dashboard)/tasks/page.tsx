"use client";

import { useState } from "react";
import { toast } from "sonner";
import TaskCreateForm from "@/components/tasks/task-create-form";
import TaskEditForm from "@/components/tasks/task-edit-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTasks } from "@/lib/hooks/use-tasks";

export default function TasksPage() {
  const { tasks, loading, refresh, deleteTask } = useTasks();
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTaskId, setDeleteTaskId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const editingTask = tasks.find((task) => task.id === editingTaskId) ?? null;

  const onDelete = async () => {
    if (!deleteTaskId) return;
    setDeleting(true);
    const payload = await deleteTask(deleteTaskId);
    setDeleting(false);
    if (payload?.success) {
      setDeleteTaskId(null);
      toast.success("Task deleted.");
      return;
    }
    toast.error(payload?.error ?? "Failed to delete task.");
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Task Management</h1>
        <Button onClick={() => setCreateOpen(true)}>New Task</Button>
      </div>

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
            <p className="mt-1 text-xs text-slate-500">
              {task.frequency === "once"
                ? `Once on ${task.single_date ?? "today"}`
                : `Repeat days: ${task.work_days?.join(", ")}`}
            </p>
            <p className="mt-1 text-xs text-slate-500">Category: {task.category}</p>

            <div className="mt-3 flex gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => setEditingTaskId(task.id)}>Edit</Button>
              <Button type="button" size="sm" variant="outline" onClick={() => setDeleteTaskId(task.id)}>Delete</Button>
            </div>
          </article>
        ))}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
            <DialogDescription>Add a new task with frequency and timing.</DialogDescription>
          </DialogHeader>
          <TaskCreateForm
            onCreated={refresh}
            onSuccess={() => {
              setCreateOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingTask)} onOpenChange={(open) => { if (!open) setEditingTaskId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>Update timing, frequency and task details.</DialogDescription>
          </DialogHeader>
          {editingTask ? (
            <TaskEditForm
              task={editingTask}
              onCancel={() => setEditingTaskId(null)}
              onSaved={async () => {
                await refresh();
                setEditingTaskId(null);
              }}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(deleteTaskId)} onOpenChange={(open) => { if (!open) setDeleteTaskId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>This action cannot be undone. Delete this task?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTaskId(null)}>Cancel</Button>
            <Button onClick={() => void onDelete()} disabled={deleting}>{deleting ? "Deleting..." : "Delete"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
