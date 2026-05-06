"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDuration } from "@/lib/utils/time";

export default function TimerPanel({ taskId, taskName, plannedSeconds }: { taskId: string; taskName: string; plannedSeconds: number }) {
  const [secondsLeft, setSecondsLeft] = useState(plannedSeconds);
  const [running, setRunning] = useState(false);

  const label = useMemo(() => (secondsLeft <= 0 ? "Overtime" : "Remaining"), [secondsLeft]);

  const start = async () => {
    setRunning(true);
    await fetch("/api/timers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start", taskId }),
    });
  };

  const pause = async () => {
    setRunning(false);
    await fetch("/api/timers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "pause", taskId, totalSeconds: Math.max(0, plannedSeconds - secondsLeft) }),
    });
  };

  const complete = async () => {
    setRunning(false);
    await fetch("/api/timers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete", taskId, totalSeconds: Math.max(0, plannedSeconds - secondsLeft) }),
    });
  };

  useEffect(() => {
    if (!running) return;

    const interval = window.setInterval(() => {
      setSecondsLeft((value) => value - 1);
    }, 1000);

    return () => window.clearInterval(interval);
  }, [running]);

  return (
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-500">Active Timer</p>
      <h3 className="mt-1 text-lg font-semibold">{taskName}</h3>
      <p className={`mt-3 font-mono text-3xl ${secondsLeft <= 0 ? "text-rose-600" : "text-blue-700"}`}>{formatDuration(Math.abs(secondsLeft))}</p>
      <p className="text-xs text-slate-500">{label}</p>
      <div className="mt-4 flex gap-2">
        <button type="button" onClick={start} className="rounded-lg bg-red-500 px-3 py-2 text-sm text-white">Start</button>
        <button type="button" onClick={pause} className="rounded-lg bg-amber-500 px-3 py-2 text-sm text-white">Pause</button>
        <button type="button" onClick={complete} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white">Done</button>
      </div>
    </article>
  );
}
