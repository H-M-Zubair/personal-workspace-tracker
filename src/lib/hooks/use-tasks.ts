"use client";

import { useCallback, useEffect, useState } from "react";

export interface TaskDTO {
  id: string;
  title: string;
  description?: string;
  planned_hours: number;
  planned_minutes: number;
  work_days: string[];
  category: string;
  priority: string;
  is_active: boolean;
}

export function useTasks() {
  const [tasks, setTasks] = useState<TaskDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(async () => {
    try {
      const response = await fetch("/api/tasks", { cache: "no-store" });
      const payload = await response.json();

      if (payload.success) {
        setTasks(payload.data ?? []);
      }
    } catch (error) {
      console.error("[useTasks]", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void fetchTasks();
    }, 0);

    return () => window.clearTimeout(id);
  }, [fetchTasks]);

  return { tasks, loading, refresh: fetchTasks };
}
