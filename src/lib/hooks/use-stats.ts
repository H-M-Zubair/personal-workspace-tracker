"use client";

import { useEffect, useState } from "react";

interface DashboardStats {
  totalSeconds: number;
  tasksCompleted: number;
  totalTasks: number;
  successRatio: number;
  streak: number;
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
