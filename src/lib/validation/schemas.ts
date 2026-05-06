import { z } from "zod";

export const taskSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().trim().optional(),
  category: z.enum(["Work", "Personal", "Learning", "Health", "Other"]).default("Work"),
  priority: z.enum(["Low", "Medium", "High"]).default("Medium"),
  plannedHours: z.number().int().min(0),
  plannedMinutes: z.number().int().min(0).max(59),
  workDays: z.array(z.enum(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]))
    .min(1),
  isActive: z.boolean().default(true),
});

export const attendanceSchema = z.object({
  date: z.string().date().optional(),
});

export const timerSchema = z.object({
  taskId: z.string().uuid(),
  action: z.enum(["start", "pause", "resume", "complete"]),
  totalSeconds: z.number().int().nonnegative().optional(),
});
