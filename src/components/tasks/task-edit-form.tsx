"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import type { TaskDTO } from "@/lib/hooks/use-tasks";

type TaskFormValues = {
  title: string;
  description?: string;
  plannedHours: number;
  plannedMinutes: number;
  category: "Work" | "Personal" | "Learning" | "Health" | "Other";
  priority: "Low" | "Medium" | "High";
};

const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export default function TaskEditForm({
  task,
  onCancel,
  onSaved,
}: {
  task: TaskDTO;
  onCancel: () => void;
  onSaved: () => Promise<void> | void;
}) {
  const [selectedDays, setSelectedDays] = useState<string[]>(task.work_days ?? ["Mon"]);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit } = useForm<TaskFormValues>({
    defaultValues: {
      title: task.title,
      description: task.description ?? "",
      plannedHours: task.planned_hours,
      plannedMinutes: task.planned_minutes,
      category: task.category as TaskFormValues["category"],
      priority: task.priority as TaskFormValues["priority"],
    },
  });

  const plannedOptions = useMemo(() => Array.from({ length: 60 }, (_, index) => index), []);

  const toggleDay = (day: string) => {
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((item) => item !== day) : [...prev, day]));
  };

  const onSubmit = async (values: TaskFormValues) => {
    if (selectedDays.length === 0) return;

    setSaving(true);
    const response = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, workDays: selectedDays, isActive: task.is_active }),
    });

    const payload = await response.json();
    if (payload.success) {
      await onSaved();
    }
    setSaving(false);
  };

  return (
    <form className="mt-3 space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3" onSubmit={handleSubmit(onSubmit)}>
      <input className="w-full rounded-md border border-slate-300 px-3 py-2" {...register("title", { required: true })} />
      <textarea className="w-full rounded-md border border-slate-300 px-3 py-2" {...register("description")} />
      <div className="grid gap-2 sm:grid-cols-2">
        <input className="rounded-md border border-slate-300 px-3 py-2" type="number" min={0} {...register("plannedHours", { valueAsNumber: true })} />
        <select className="rounded-md border border-slate-300 px-3 py-2" {...register("plannedMinutes", { valueAsNumber: true })}>
          {plannedOptions.map((minute) => (
            <option key={minute} value={minute}>{minute} min</option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap gap-2">
        {dayOrder.map((day) => {
          const selected = selectedDays.includes(day);
          return (
            <button key={day} type="button" onClick={() => toggleDay(day)} className={`rounded-full px-3 py-1 text-xs ${selected ? "bg-blue-600 text-white" : "bg-white text-slate-700"}`}>
              {day}
            </button>
          );
        })}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        <select className="rounded-md border border-slate-300 px-3 py-2" {...register("priority")}>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
        </select>
        <select className="rounded-md border border-slate-300 px-3 py-2" {...register("category")}>
          <option value="Work">Work</option>
          <option value="Personal">Personal</option>
          <option value="Learning">Learning</option>
          <option value="Health">Health</option>
          <option value="Other">Other</option>
        </select>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white disabled:opacity-60">{saving ? "Saving..." : "Save"}</button>
        <button type="button" onClick={onCancel} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700">Cancel</button>
      </div>
    </form>
  );
}
