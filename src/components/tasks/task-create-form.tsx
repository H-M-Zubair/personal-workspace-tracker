"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

type TaskFormValues = {
  title: string;
  description?: string;
  plannedHours: number;
  plannedMinutes: number;
  frequency: "once" | "repeat";
  category: "Work" | "Personal" | "Learning" | "Health" | "Other";
  priority: "Low" | "Medium" | "High";
};

const dayOrder = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export default function TaskCreateForm({
  onCreated,
  onSuccess,
}: {
  onCreated: () => Promise<void> | void;
  onSuccess?: () => void;
}) {
  const [selectedDays, setSelectedDays] = useState<string[]>(["Mon"]);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, watch } = useForm<TaskFormValues>({
    defaultValues: {
      category: "Work",
      priority: "Medium",
      frequency: "repeat",
      plannedHours: 1,
      plannedMinutes: 0,
    },
  });
  const frequency = watch("frequency");

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
    if (values.frequency === "repeat" && selectedDays.length === 0) {
      toast.error("Select at least one work day.");
      return;
    }

    setSaving(true);

    const response = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        workDays: values.frequency === "repeat" ? selectedDays : [],
        isActive: true,
      }),
    });

    const payload = await response.json();

    if (payload.success) {
      reset();
      setSelectedDays(["Mon"]);
      await onCreated();
      toast.success("Task created successfully.");
      onSuccess?.();
    } else {
      toast.error(payload.error ?? "Failed to create task.");
    }

    setSaving(false);
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
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
      <select className="w-full rounded-md border border-slate-300 px-3 py-2" {...register("frequency")}>
        <option value="repeat">Repeat task</option>
        <option value="once">Once (today only)</option>
      </select>
      {frequency === "repeat" ? (
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
      ) : (
        <p className="text-xs text-slate-500">Once task will be assigned to today only.</p>
      )}
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
      <Button type="submit" disabled={saving}>
        {saving ? "Saving..." : "Create Task"}
      </Button>
    </form>
  );
}
