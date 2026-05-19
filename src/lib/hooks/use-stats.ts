"use client";

import { useEffect, useState } from "react";

type RangeKey = "weekly" | "monthly" | "yearly";

interface RangeMetrics {
  totalSeconds: number;
  totalTasks: number;
  tasksCompleted: number;
  tasksExcused: number;
  tasksMissed: number;
  successRatio: number;
}

interface DashboardStats {
  today: {
    totalSeconds: number;
    tasksCompleted: number;
    totalTasks: number;
    tasksExcused: number;
    tasksMissed: number;
    successRatio: number;
    streak: number;
  };
  ranges: Record<RangeKey, RangeMetrics>;
  recentAbsences: Array<{
    id: string;
    taskId: string;
    taskTitle: string;
    date: string;
    reason: string;
  }>;
  charts: {
    weeklyHours: Array<{ label: string; hours: number }>;
    completionTrend: Array<{
      label: string;
      ratio: number;
      assigned: number;
      completed: number;
      excused: number;
      missed: number;
    }>;
    monthlyHours: Array<{ label: string; hours: number }>;
  };
}

export function useStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const response = await fetch("/api/stats", { cache: "no-store" });
        const payload = await response.json();

        if (payload.success) {
          setStats(payload.data);
        }
      } catch (error) {
        console.error("[useStats]", error);
      } finally {
        setLoading(false);
      }
    }

    void loadStats();
  }, []);

  return { stats, loading };
}
