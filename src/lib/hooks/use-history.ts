"use client";

import { useCallback, useEffect, useState } from "react";

export interface HistoryPayload {
  attendance: Array<{ date: string; checked_in_at: string }>;
  sessions: Array<{
    id: string;
    task_id: string;
    total_seconds: number;
    status: string;
    created_at: string;
    task?: { title?: string } | null;
  }>;
  absences: Array<{
    id: string;
    task_id: string;
    date: string;
    reason: string;
    created_at: string;
  }>;
}

export function useHistory() {
  const [history, setHistory] = useState<HistoryPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/history", { cache: "no-store" });
      const payload = await response.json();

      if (payload.success) {
        setHistory(payload.data);
      }
    } catch (error) {
      console.error("[useHistory]", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void refresh();
    }, 0);

    return () => window.clearTimeout(id);
  }, [refresh]);

  return { history, loading, refresh };
}
