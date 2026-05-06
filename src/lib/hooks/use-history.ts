"use client";

import { useEffect, useState } from "react";

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
}

export function useHistory() {
  const [history, setHistory] = useState<HistoryPayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/history", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => {
        if (payload.success) {
          setHistory(payload.data);
        }
      })
      .catch((error) => {
        console.error("[useHistory]", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return { history, loading };
}
