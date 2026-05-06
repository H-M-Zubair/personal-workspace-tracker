"use client";

import { useEffect, useState } from "react";

interface TaskDTO {
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

  const fetchTasks = async () => {
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
  };

  useEffect(() => {
    fetch("/api/tasks", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        if (payload.success) {
          setTasks(payload.data ?? []);
        }
      })
      .catch((error) => {
        console.error("[useTasks]", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return { tasks, loading, refresh: fetchTasks };
}
