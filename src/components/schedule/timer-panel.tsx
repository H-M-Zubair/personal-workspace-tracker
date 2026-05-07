"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useTimerState } from "@/lib/context/timer-context";
import { formatDuration } from "@/lib/utils/time";

type TimerStatus = "idle" | "running" | "paused" | "completed";

type TimerSessionResponse = {
  id: string;
  status: "running" | "paused" | "completed";
  elapsedSeconds: number;
};

export default function TimerPanel({
  taskId,
  taskName,
  plannedSeconds,
  completedForToday = false,
}: {
  taskId: string;
  taskName: string;
  plannedSeconds: number;
  completedForToday?: boolean;
}) {
  const { activeTimer, refreshActiveTimer } = useTimerState();
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [extraSeconds, setExtraSeconds] = useState(0);
  const [syncing, setSyncing] = useState(true);
  const [actionError, setActionError] = useState("");

  const syncFromServer = useCallback(async () => {
    try {
      setSyncing(true);
      const response = await fetch(`/api/timers?taskId=${taskId}`, { cache: "no-store" });
      const payload = await response.json();

      if (!payload.success || !payload.data) {
        setStatus("idle");
        setElapsedSeconds(0);
        return;
      }

      const session = payload.data as TimerSessionResponse;
      setStatus(session.status);
      setElapsedSeconds(session.elapsedSeconds ?? 0);
    } catch (error) {
      console.error("[TimerPanel] sync", error);
    } finally {
      setSyncing(false);
    }
  }, [taskId]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void syncFromServer();
    }, 0);

    return () => window.clearTimeout(id);
  }, [syncFromServer]);

  useEffect(() => {
    if (status !== "running") return;

    const interval = window.setInterval(() => {
      setElapsedSeconds((value) => value + 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [status]);

  const effectiveStatus = completedForToday
    ? "completed"
    : (activeTimer?.taskId === taskId ? activeTimer.status : status);
  const effectiveElapsed = activeTimer?.taskId === taskId ? activeTimer.elapsedSeconds : elapsedSeconds;
  const hasOtherRunningTask = activeTimer?.status === "running" && activeTimer.taskId !== taskId;

  const totalPlanned = plannedSeconds + extraSeconds;
  const secondsLeft = totalPlanned - effectiveElapsed;
  const isOvertime = secondsLeft < 0;
  const progress = totalPlanned <= 0 ? 0 : Math.min(100, Math.round((effectiveElapsed / totalPlanned) * 100));

  const label = useMemo(() => {
    if (syncing) return "Syncing...";
    if (effectiveStatus === "completed") return "Completed";
    if (effectiveStatus === "paused") return "Paused";
    return isOvertime ? "Overtime" : "Remaining";
  }, [effectiveStatus, isOvertime, syncing]);

  const postAction = async (action: "start" | "pause" | "resume" | "complete") => {
    setActionError("");
    const response = await fetch("/api/timers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, taskId }),
    });

    const payload = await response.json();
    if (!payload.success) {
      const message = payload.error ?? "Unable to update timer.";
      setActionError(message);
      toast.error(message);
      return;
    }

    await Promise.all([syncFromServer(), refreshActiveTimer()]);
    if (action === "complete") {
      toast.success("Task marked as completed.");
    }
  };

  const onStart = async () => {
    if (effectiveStatus !== "idle") return;
    setStatus("running");
    await postAction("start");
  };

  const onPause = async () => {
    if (effectiveStatus !== "running") return;
    setStatus("paused");
    await postAction("pause");
  };

  const onResume = async () => {
    if (effectiveStatus !== "paused") return;
    setStatus("running");
    await postAction("resume");
  };

  const onDone = async () => {
    if (effectiveStatus === "completed" || effectiveStatus === "idle") return;
    setStatus("completed");
    await postAction("complete");
  };

  const onAddFive = () => {
    setExtraSeconds((value) => value + 300);
  };

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">Active Timer</p>
      <h3 className="mt-1 text-lg font-semibold">{taskName}</h3>
      <p className={`mt-3 font-mono text-3xl ${isOvertime ? "text-rose-600" : "text-blue-700"}`}>{formatDuration(Math.abs(secondsLeft))}</p>
      <p className="text-xs text-slate-500">{label}</p>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" onClick={onStart} disabled={effectiveStatus !== "idle" || syncing || hasOtherRunningTask}>Start</Button>
        <Button type="button" onClick={onPause} disabled={effectiveStatus !== "running" || syncing} variant="secondary">Pause</Button>
        <Button type="button" onClick={onResume} disabled={effectiveStatus !== "paused" || syncing}>Resume</Button>
        <Button type="button" onClick={onAddFive} disabled={effectiveStatus === "completed" || syncing} variant="outline">Add 5 min</Button>
        <Button type="button" onClick={onDone} disabled={(effectiveStatus !== "running" && effectiveStatus !== "paused") || syncing}>Done</Button>
      </div>
      {hasOtherRunningTask ? (
        <p className="mt-2 text-xs text-amber-700">Another task is running. Pause or stop it first to switch.</p>
      ) : null}
      {actionError ? <p className="mt-2 text-xs text-rose-700">{actionError}</p> : null}
    </article>
  );
}
