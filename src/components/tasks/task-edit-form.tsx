"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import type { TaskDTO } from "@/lib/hooks/use-tasks";
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
  const { register, handleSubmit, watch } = useForm<TaskFormValues>({
    defaultValues: {
      title: task.title,
      description: task.description ?? "",
      plannedHours: task.planned_hours,
      plannedMinutes: task.planned_minutes,
      frequency: task.frequency,
      category: task.category as TaskFormValues["category"],
      priority: task.priority as TaskFormValues["priority"],
    },
  });
  const frequency = watch("frequency");

  const plannedOptions = useMemo(() => Array.from({ length: 60 }, (_, index) => index), []);

  const toggleDay = (day: string) => {
    setSelectedDays((prev) => (prev.includes(day) ? prev.filter((item) => item !== day) : [...prev, day]));
  };

  const onSubmit = async (values: TaskFormValues) => {
    if (values.frequency === "repeat" && selectedDays.length === 0) {
      toast.error("Select at least one work day.");
      return;
    }

    setSaving(true);
    const response = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...values,
        singleDate: task.single_date,
        workDays: values.frequency === "repeat" ? selectedDays : [],
        isActive: task.is_active,
      }),
    });

    const payload = await response.json();
    if (payload.success) {
      await onSaved();
      toast.success("Task updated.");
    } else {
      toast.error(payload.error ?? "Failed to update task.");
    }
    setSaving(false);
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
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
      <select className="w-full rounded-md border border-slate-300 px-3 py-2" {...register("frequency")}>
        <option value="repeat">Repeat task</option>
        <option value="once">Once</option>
      </select>
      {frequency === "repeat" ? (
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
      ) : (
        <p className="text-xs text-slate-500">This task is scheduled once for its assigned date.</p>
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
      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
        <Button type="button" variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
