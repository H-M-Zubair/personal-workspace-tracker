"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";

type TaskFormValues = {
  title: string;
  description?: string;
  plannedHours: number;
  plannedMinutes: number;
  category: "Work" | "Personal" | "Learning" | "Health" | "Other";
  priority: "Low" | "Medium" | "High";
};

const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export default function TaskCreateForm({ onCreated }: { onCreated: () => Promise<void> | void }) {
  const [selectedDays, setSelectedDays] = useState<string[]>(["Mon"]);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset } = useForm<TaskFormValues>({
    defaultValues: {
      category: "Work",
      priority: "Medium",
      plannedHours: 1,
      plannedMinutes: 0,
    },
  });

  const plannedOptions = useMemo(
    () => Array.from({ length: 60 }, (_, index) => index),
    [],
  );

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((item) => item !== day) : [...prev, day],
    );
  };

  const onSubmit = async (values: TaskFormValues) => {
    if (selectedDays.length === 0) {
      return;
    }

    setSaving(true);

    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...values, workDays: selectedDays, isActive: true }),
    });

    const payload = await response.json();

    if (payload.success) {
      reset();
      setSelectedDays(["Mon"]);
      await onCreated();
    }

    setSaving(false);
  };

  return (
    <form className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm" onSubmit={handleSubmit(onSubmit)}>
      <h3 className="text-lg font-semibold">Create New Task</h3>
      <input className="w-full rounded-md border border-slate-300 px-3 py-2" placeholder="Task title" {...register("title", { required: true })} />
      <textarea className="w-full rounded-md border border-slate-300 px-3 py-2" placeholder="Description" {...register("description")} />
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
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className={`rounded-full px-3 py-1 text-sm ${selected ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-700"}`}
            >
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
      <button type="submit" disabled={saving} className="rounded-lg bg-blue-600 px-4 py-2 text-white disabled:opacity-60">
        {saving ? "Saving..." : "Create Task"}
      </button>
    </form>
  );
}
