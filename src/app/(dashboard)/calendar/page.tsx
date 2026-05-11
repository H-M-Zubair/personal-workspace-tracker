"use client";

import { useCallback, useMemo, useState } from "react";
import { addDays, format, startOfWeek, subWeeks } from "date-fns";
import { toast } from "sonner";
import { useHistory, type HistoryPayload } from "@/lib/hooks/use-history";
import { useTasks, type TaskDTO } from "@/lib/hooks/use-tasks";
import { formatDuration } from "@/lib/utils/time";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

type SessionRow = NonNullable<HistoryPayload["sessions"]>[number];

type TaskDayRow = {
  taskId: string;
  title: string;
  kind: "completed" | "in_progress" | "excused" | "pending";
  sessionStatus?: string;
  loggedSeconds: number;
  reason: string | null;
};

function tasksAssignedOnDate(dateStr: string, dayLabel: string, tasks: TaskDTO[]): TaskDTO[] {
  return tasks.filter((task) => {
    if (!task.is_active) return false;
    const created = task.created_at?.slice(0, 10) ?? "";
    if (created > dateStr) return false;
    if (task.frequency === "once") {
      return task.single_date === dateStr;
    }
    return task.work_days?.includes(dayLabel) ?? false;
  });
}

function buildAbsenceMap(absences: HistoryPayload["absences"] | undefined) {
  const map = new Map<string, string>();
  (absences ?? []).forEach((a) => {
    map.set(`${a.task_id}:${a.date}`, a.reason);
  });
  return map;
}

function buildTaskDayRows(
  dateStr: string,
  dayLabel: string,
  tasks: TaskDTO[],
  sessions: SessionRow[],
  absenceMap: Map<string, string>,
): TaskDayRow[] {
  const assigned = tasksAssignedOnDate(dateStr, dayLabel, tasks);
  const daySessions = sessions.filter((s) => s.created_at.slice(0, 10) === dateStr);

  return assigned.map((task) => {
    const taskSessions = daySessions.filter((s) => s.task_id === task.id);
    const reason = absenceMap.get(`${task.id}:${dateStr}`) ?? null;
    const hasCompleted = taskSessions.some((s) => s.status === "completed");
    const active = taskSessions.find((s) => s.status === "running" || s.status === "paused");
    const loggedSeconds = taskSessions.reduce((sum, s) => sum + (s.total_seconds ?? 0), 0);

    if (hasCompleted) {
      return {
        taskId: task.id,
        title: task.title,
        kind: "completed" as const,
        sessionStatus: "completed",
        loggedSeconds,
        reason,
      };
    }
    if (reason) {
      return {
        taskId: task.id,
        title: task.title,
        kind: "excused" as const,
        sessionStatus: active?.status,
        loggedSeconds,
        reason,
      };
    }
    if (active) {
      return {
        taskId: task.id,
        title: task.title,
        kind: "in_progress" as const,
        sessionStatus: active.status,
        loggedSeconds,
        reason: null,
      };
    }
    return {
      taskId: task.id,
      title: task.title,
      kind: "pending" as const,
      loggedSeconds: 0,
      reason: null,
    };
  });
}

function getScoreColorFromRatio(completed: number, total: number) {
  if (total === 0) return "bg-slate-400";
  const ratio = Math.round((completed / total) * 100);
  if (ratio >= 80) return "bg-emerald-500";
  if (ratio >= 40) return "bg-amber-500";
  return "bg-rose-500";
}

type CalendarDay = {
  date: string;
  label: string;
  dayOfMonth: string;
  rows: TaskDayRow[];
  sessions: Array<{
    id: string;
    status: string;
    total_seconds: number;
    task?: { title?: string } | null;
  }>;
  totalSeconds: number;
  assignedCount: number;
  completedCount: number;
};

export default function CalendarPage() {
  const { history, loading, refresh } = useHistory();
  const { tasks, loading: tasksLoading } = useTasks();
  const [modalDate, setModalDate] = useState<string | null>(null);
  const [reasonDrafts, setReasonDrafts] = useState<Record<string, string>>({});
  const [savingTaskId, setSavingTaskId] = useState<string | null>(null);

  const todayDate = format(new Date(), "yyyy-MM-dd");

  const weekSections = useMemo(() => {
    if (!history) return [];

    const sessions = history.sessions ?? [];
    const absenceMap = buildAbsenceMap(history.absences);

    const dailySessionsMap = new Map<string, CalendarDay["sessions"]>();
    sessions.forEach((session) => {
      const date = session.created_at.slice(0, 10);
      const list = dailySessionsMap.get(date) ?? [];
      list.push({
        id: session.id,
        status: session.status,
        total_seconds: session.total_seconds ?? 0,
        task: session.task,
      });
      dailySessionsMap.set(date, list);
    });

    const baseWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

    return Array.from({ length: 8 }, (_, offset) => {
      const weekStart = subWeeks(baseWeekStart, offset);
      const weekEnd = addDays(weekStart, 6);

      const days: CalendarDay[] = [];

      for (let index = 0; index < 7; index += 1) {
        const dayDate = addDays(weekStart, index);
        const key = format(dayDate, "yyyy-MM-dd");
        const dayLabel = format(dayDate, "EEE");
        const isStrictPast = key < todayDate;

        if (!isStrictPast) continue;

        const rows = buildTaskDayRows(key, dayLabel, tasks, sessions, absenceMap);
        if (rows.length === 0) continue;

        const completedCount = rows.filter((r) => r.kind === "completed").length;
        const totalSeconds = (dailySessionsMap.get(key) ?? []).reduce((s, x) => s + x.total_seconds, 0);

        days.push({
          date: key,
          label: dayLabel,
          dayOfMonth: format(dayDate, "d MMM"),
          rows,
          sessions: dailySessionsMap.get(key) ?? [],
          totalSeconds,
          assignedCount: rows.length,
          completedCount,
        });
      }

      const weekSeconds = days.reduce((sum, d) => sum + d.totalSeconds, 0);
      const weekCompleted = days.reduce((sum, d) => sum + d.completedCount, 0);
      const weekAssigned = days.reduce((sum, d) => sum + d.assignedCount, 0);

      return {
        key: format(weekStart, "yyyy-MM-dd"),
        title: `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d")}`,
        weekSeconds,
        weekCompleted,
        weekAssigned,
        days,
      };
    }).filter((week) => week.days.length > 0);
  }, [history, tasks, todayDate]);

  const modalDay = useMemo(() => {
    if (!modalDate) return null;
    for (const week of weekSections) {
      const found = week.days.find((d) => d.date === modalDate);
      if (found) return found;
    }
    return null;
  }, [modalDate, weekSections]);

  const submitAbsenceReason = useCallback(
    async (taskId: string, date: string) => {
      const draftKey = `${taskId}:${date}`;
      const reason = (reasonDrafts[draftKey] ?? "").trim();
      if (reason.length < 5) {
        toast.error("Reason must be at least 5 characters.");
        return;
      }
      try {
        setSavingTaskId(taskId);
        const response = await fetch("/api/task-absences", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskId, date, reason }),
        });
        const payload = await response.json();
        if (!payload.success) {
          toast.error(payload.error ?? "Could not save reason.");
          return;
        }
        setReasonDrafts((prev) => {
          const next = { ...prev };
          delete next[draftKey];
          return next;
        });
        await refresh();
        toast.success("Reason saved for this day.");
      } catch (e) {
        console.error(e);
        toast.error("Could not save reason.");
      } finally {
        setSavingTaskId(null);
      }
    },
    [reasonDrafts, refresh],
  );

  const kindLabel = (kind: TaskDayRow["kind"]) => {
    switch (kind) {
      case "completed":
        return "Completed";
      case "in_progress":
        return "In progress";
      case "excused":
        return "Missed (reason on file)";
      default:
        return "Missed — reason needed";
    }
  };

  return (
    <section className="space-y-5">
      <h1 className="text-2xl font-bold">Calendar & History</h1>
      <p className="text-sm text-slate-600">
        Past days only. Each card reflects tasks scheduled that day. Open a card for completion status, logged time, and absence reasons.
      </p>
      {loading || tasksLoading ? <p className="text-sm text-slate-500">Loading history...</p> : null}

      {weekSections.map((week) => (
        <section key={week.key} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">Week: {week.title}</h2>
            <p className="text-xs text-slate-600">
              {week.weekCompleted}/{week.weekAssigned} tasks done | Logged {formatDuration(week.weekSeconds)}
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {week.days.map((day) => {
              const ratio =
                day.assignedCount === 0 ? 0 : Math.round((day.completedCount / day.assignedCount) * 100);
              const pendingMiss = day.rows.filter((r) => r.kind === "pending").length;
              const inProgress = day.rows.filter((r) => r.kind === "in_progress").length;

              return (
                <button
                  key={day.date}
                  type="button"
                  onClick={() => setModalDate(day.date)}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-left transition hover:border-blue-300 hover:bg-blue-50/40 focus-visible:outline focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{day.label}</p>
                      <p className="text-xs text-slate-600">{day.dayOfMonth}</p>
                    </div>
                    <span
                      className={`h-3 w-3 shrink-0 rounded-full ${getScoreColorFromRatio(day.completedCount, day.assignedCount)}`}
                    />
                  </div>

                  <p className="mt-2 text-xs text-slate-600">
                    Tasks: {day.completedCount}/{day.assignedCount} done ({ratio}%)
                  </p>
                  <p className="text-xs text-slate-600">Logged: {formatDuration(day.totalSeconds)}</p>
                  {pendingMiss > 0 ? (
                    <p className="mt-1 text-[11px] font-medium text-rose-700">{pendingMiss} missed without reason</p>
                  ) : null}
                  {inProgress > 0 ? (
                    <p className="mt-1 text-[11px] font-medium text-amber-700">{inProgress} still in progress</p>
                  ) : null}
                  <p className="mt-2 text-[11px] text-blue-700 underline-offset-2 hover:underline">View day details</p>
                </button>
              );
            })}
          </div>
        </section>
      ))}

      <Dialog open={Boolean(modalDate)} onOpenChange={(open) => !open && setModalDate(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          {modalDay ? (
            <>
              <DialogHeader>
                <DialogTitle>
                  {modalDay.label} {modalDay.dayOfMonth}
                </DialogTitle>
                <DialogDescription>
                  Scheduled tasks for this day, what was completed, and any recorded reasons for missed work.
                </DialogDescription>
              </DialogHeader>

              <div className="mt-2 space-y-3 border-t border-slate-100 pt-3">
                <p className="text-xs text-slate-600">
                  Summary: {modalDay.completedCount}/{modalDay.assignedCount} completed · Logged{" "}
                  {formatDuration(modalDay.totalSeconds)}
                </p>

                <ul className="space-y-3">
                  {modalDay.rows.map((row) => {
                    const draftKey = `${row.taskId}:${modalDay.date}`;
                    return (
                      <li key={row.taskId} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <p className="text-sm font-semibold text-slate-900">{row.title}</p>
                        <p className="mt-1 text-xs text-slate-600">{kindLabel(row.kind)}</p>
                        {row.loggedSeconds > 0 ? (
                          <p className="text-xs text-slate-600">Logged: {formatDuration(row.loggedSeconds)}</p>
                        ) : null}
                        {row.sessionStatus && row.kind !== "completed" ? (
                          <p className="text-xs text-slate-500">Session: {row.sessionStatus}</p>
                        ) : null}
                        {row.reason ? (
                          <div className="mt-2 rounded border border-slate-200 bg-white p-2">
                            <p className="text-[11px] font-medium text-slate-500">Reason on file</p>
                            <p className="text-sm text-slate-800">{row.reason}</p>
                          </div>
                        ) : null}

                        {row.kind === "pending" ? (
                          <div className="mt-2 space-y-2">
                            <label className="text-[11px] font-medium text-slate-600" htmlFor={`reason-${draftKey}`}>
                              Add absence / miss reason
                            </label>
                            <textarea
                              id={`reason-${draftKey}`}
                              rows={3}
                              className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                              placeholder="Why was this task not completed on this day?"
                              value={reasonDrafts[draftKey] ?? ""}
                              onChange={(e) =>
                                setReasonDrafts((prev) => ({ ...prev, [draftKey]: e.target.value }))
                              }
                            />
                            <Button
                              type="button"
                              size="sm"
                              disabled={savingTaskId === row.taskId}
                              onClick={() => void submitAbsenceReason(row.taskId, modalDay.date)}
                            >
                              {savingTaskId === row.taskId ? "Saving…" : "Save reason"}
                            </Button>
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>

                {modalDay.sessions.length > 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 p-3">
                    <p className="text-[11px] font-medium text-slate-500">Timer sessions this day</p>
                    <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto">
                      {modalDay.sessions.map((s) => (
                        <li key={s.id} className="text-xs text-slate-700">
                          {s.task?.title ?? "Task"} — {s.status} ({formatDuration(s.total_seconds)})
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </section>
  );
}
