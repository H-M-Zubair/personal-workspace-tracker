"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

type ActiveTimerStatus = "running" | "paused" | "completed";

export type ActiveTimer = {
  id: string;
  taskId: string;
  taskTitle: string;
  plannedSeconds: number;
  elapsedSeconds: number;
  status: ActiveTimerStatus;
};

type TimerContextValue = {
  activeTimer: ActiveTimer | null;
  loading: boolean;
  refreshActiveTimer: () => Promise<void>;
};

const TimerContext = createContext<TimerContextValue | null>(null);

export function TimerProvider({ children }: { children: React.ReactNode }) {
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshActiveTimer = useCallback(async () => {
    try {
      const response = await fetch("/api/timers", { cache: "no-store" });
      const payload = await response.json();

      if (!payload.success || !payload.data) {
        setActiveTimer(null);
        return;
      }

      setActiveTimer({
        id: payload.data.id,
        taskId: payload.data.task_id,
        taskTitle: payload.data.task?.title ?? "Untitled Task",
        plannedSeconds: ((payload.data.task?.planned_hours ?? 0) * 3600) + ((payload.data.task?.planned_minutes ?? 0) * 60),
        elapsedSeconds: payload.data.elapsedSeconds ?? 0,
        status: payload.data.status,
      });
    } catch (error) {
      console.error("[TimerContext] refresh", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void refreshActiveTimer();
    }, 0);

    return () => window.clearTimeout(id);
  }, [refreshActiveTimer]);

  useEffect(() => {
    if (!activeTimer || activeTimer.status !== "running") return;

    const interval = window.setInterval(() => {
      setActiveTimer((prev) => {
        if (!prev || prev.status !== "running") return prev;
        return { ...prev, elapsedSeconds: prev.elapsedSeconds + 1 };
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [activeTimer]);

  useEffect(() => {
    const onFocus = () => {
      void refreshActiveTimer();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshActiveTimer();
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [refreshActiveTimer]);

  const value = useMemo(
    () => ({ activeTimer, loading, refreshActiveTimer }),
    [activeTimer, loading, refreshActiveTimer],
  );

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function useTimerState() {
  const context = useContext(TimerContext);

  if (!context) {
    throw new Error("useTimerState must be used within TimerProvider");
  }

  return context;
}
