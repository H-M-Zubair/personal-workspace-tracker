"use client";

import { useCallback, useEffect, useState } from "react";

interface AttendanceRecord {
  date: string;
  checked_in_at: string;
}

export function useAttendance() {
  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAttendance = useCallback(async () => {
    try {
      const response = await fetch("/api/attendance", { cache: "no-store" });
      const payload = await response.json();

      if (payload.success) {
        setAttendance(payload.data ?? null);
      }
    } catch (error) {
      console.error("[useAttendance]", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      void fetchAttendance();
    }, 0);

    return () => window.clearTimeout(id);
  }, [fetchAttendance]);

  const checkIn = async () => {
    const response = await fetch("/api/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    const payload = await response.json();

    if (payload.success) {
      setAttendance(payload.data);
    }
  };

  return { attendance, loading, checkIn, refresh: fetchAttendance };
}
