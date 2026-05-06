"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTimerState } from "@/lib/context/timer-context";
import { formatDuration } from "@/lib/utils/time";

type TimerStatus = "idle" | "running" | "paused" | "completed";

type TimerSessionResponse = {
  id: string;
  status: "running" | "paused" | "completed";
  elapsedSeconds: number;
};

export default function TimerPanel({ taskId, taskName, plannedSeconds }: { taskId: string; taskName: string; plannedSeconds: number }) {
  const { activeTimer, refreshActiveTimer } = useTimerState();
  const [status, setStatus] = useState<TimerStatus>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [extraSeconds, setExtraSeconds] = useState(0);
  const [syncing, setSyncing] = useState(true);

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

  const effectiveStatus = activeTimer?.taskId === taskId ? activeTimer.status : status;
  const effectiveElapsed = activeTimer?.taskId === taskId ? activeTimer.elapsedSeconds : elapsedSeconds;

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
    const response = await fetch("/api/timers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, taskId }),
    });

    const payload = await response.json();
    if (!payload.success) {
      return;
    }

    await Promise.all([syncFromServer(), refreshActiveTimer()]);
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
        <button type="button" onClick={onStart} disabled={effectiveStatus !== "idle" || syncing} className="rounded-lg bg-red-500 px-3 py-2 text-sm text-white disabled:opacity-50">Start</button>
        <button type="button" onClick={onPause} disabled={effectiveStatus !== "running" || syncing} className="rounded-lg bg-amber-500 px-3 py-2 text-sm text-white disabled:opacity-50">Pause</button>
        <button type="button" onClick={onResume} disabled={effectiveStatus !== "paused" || syncing} className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white disabled:opacity-50">Resume</button>
        <button type="button" onClick={onAddFive} disabled={effectiveStatus === "completed" || syncing} className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 disabled:opacity-50">Add 5 min</button>
        <button type="button" onClick={onDone} disabled={(effectiveStatus !== "running" && effectiveStatus !== "paused") || syncing} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white disabled:opacity-50">Done</button>
      </div>
    </article>
  );
}
