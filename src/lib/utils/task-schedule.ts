export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export type TaskScheduleInput = {
  id: string;
  title?: string;
  is_active?: boolean;
  frequency: string;
  single_date?: string | null;
  work_days?: string[] | null;
  created_at?: string;
};

export type TimerSessionInput = {
  task_id: string;
  status?: string | null;
  created_at: string;
  total_seconds?: number | null;
};

export type DayTaskOutcome = "completed" | "excused" | "in_progress" | "pending";

export type DayMetrics = {
  assigned: number;
  completed: number;
  excused: number;
  missed: number;
  inProgress: number;
  /** Completed tasks / assigned tasks (0–100). Matches calendar day cards. */
  successRatio: number;
};

export function absenceKey(taskId: string, date: string) {
  return `${taskId}:${date}`;
}

export function tasksAssignedOnDate(
  dateStr: string,
  dayLabel: string,
  tasks: TaskScheduleInput[],
): TaskScheduleInput[] {
  return tasks.filter((task) => {
    if (task.is_active === false) return false;
    const created = task.created_at?.slice(0, 10) ?? "";
    if (created > dateStr) return false;
    if (task.frequency === "once") {
      return task.single_date === dateStr;
    }
    return task.work_days?.includes(dayLabel) ?? false;
  });
}

export function classifyTaskDay(
  taskId: string,
  dateStr: string,
  sessions: TimerSessionInput[],
  absenceMap: Map<string, string>,
): DayTaskOutcome {
  const daySessions = sessions.filter(
    (session) => session.created_at.slice(0, 10) === dateStr && session.task_id === taskId,
  );
  const hasCompleted = daySessions.some((session) => session.status === "completed");
  if (hasCompleted) return "completed";

  if (absenceMap.has(absenceKey(taskId, dateStr))) return "excused";

  const active = daySessions.find((session) => session.status === "running" || session.status === "paused");
  if (active) return "in_progress";

  return "pending";
}

export function computeDayMetrics(
  dateStr: string,
  dayLabel: string,
  tasks: TaskScheduleInput[],
  sessions: TimerSessionInput[],
  absenceMap: Map<string, string>,
): DayMetrics {
  const assignedTasks = tasksAssignedOnDate(dateStr, dayLabel, tasks);
  let completed = 0;
  let excused = 0;
  let missed = 0;
  let inProgress = 0;

  assignedTasks.forEach((task) => {
    const outcome = classifyTaskDay(task.id, dateStr, sessions, absenceMap);
    if (outcome === "completed") completed += 1;
    else if (outcome === "excused") excused += 1;
    else if (outcome === "in_progress") inProgress += 1;
    else missed += 1;
  });

  const assigned = assignedTasks.length;
  const successRatio = assigned === 0 ? 100 : Math.round((completed / assigned) * 100);

  return { assigned, completed, excused, missed, inProgress, successRatio };
}

export function aggregateDayMetrics(days: DayMetrics[]): DayMetrics & { successRatio: number } {
  const totals = days.reduce(
    (acc, day) => ({
      assigned: acc.assigned + day.assigned,
      completed: acc.completed + day.completed,
      excused: acc.excused + day.excused,
      missed: acc.missed + day.missed,
      inProgress: acc.inProgress + day.inProgress,
    }),
    { assigned: 0, completed: 0, excused: 0, missed: 0, inProgress: 0 },
  );

  return {
    ...totals,
    successRatio: totals.assigned === 0 ? 100 : Math.round((totals.completed / totals.assigned) * 100),
  };
}

export function buildAbsenceMap(
  absences: Array<{ task_id: string; date: string; reason: string }> | undefined,
) {
  const map = new Map<string, string>();
  (absences ?? []).forEach((absence) => {
    map.set(absenceKey(absence.task_id, absence.date), absence.reason);
  });
  return map;
}

export function dayLabelForDate(date: Date) {
  return DAY_LABELS[date.getDay()] ?? "Mon";
}

export function iterateDatesInclusive(from: Date, to: Date, onDate: (date: Date, dateStr: string, dayLabel: string) => void) {
  const cursor = new Date(from);
  cursor.setHours(0, 0, 0, 0);
  const end = new Date(to);
  end.setHours(0, 0, 0, 0);

  while (cursor <= end) {
    const dateStr = cursor.toISOString().slice(0, 10);
    onDate(new Date(cursor), dateStr, dayLabelForDate(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
}
