import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/server/auth";
import { subDays, subMonths, subYears } from "date-fns";

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthLabels = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type RangeKey = "weekly" | "monthly" | "yearly";

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function sumSeconds(items: Array<{ total_seconds?: number | null }>) {
  return items.reduce((sum, item) => sum + (item.total_seconds ?? 0), 0);
}

function toRangeMetrics(sessions: Array<{ total_seconds?: number | null; status?: string | null }>) {
  const totalSeconds = sumSeconds(sessions);
  const totalTasks = sessions.length;
  const tasksCompleted = sessions.filter((session) => session.status === "completed").length;
  const successRatio = totalTasks === 0 ? 100 : Math.round((tasksCompleted / totalTasks) * 100);

  return { totalSeconds, totalTasks, tasksCompleted, successRatio };
}

function buildWeeklyHours(sessions: Array<{ created_at: string; total_seconds: number | null }>) {
  const start = subDays(new Date(), 6);

  return Array.from({ length: 7 }, (_, index) => {
    const date = subDays(start, -index);
    const day = toIsoDate(date);
    const totalSeconds = sessions
      .filter((session) => session.created_at.slice(0, 10) === day)
      .reduce((sum, session) => sum + (session.total_seconds ?? 0), 0);

    return {
      label: dayLabels[date.getDay()] ?? "Day",
      hours: Number((totalSeconds / 3600).toFixed(2)),
    };
  });
}

function buildCompletionTrend(sessions: Array<{ created_at: string; status: string | null }>) {
  const start = subDays(new Date(), 6);

  return Array.from({ length: 7 }, (_, index) => {
    const date = subDays(start, -index);
    const day = toIsoDate(date);
    const rows = sessions.filter((session) => session.created_at.slice(0, 10) === day);
    const completed = rows.filter((row) => row.status === "completed").length;
    const ratio = rows.length === 0 ? 100 : Math.round((completed / rows.length) * 100);

    return {
      label: dayLabels[date.getDay()] ?? "Day",
      ratio,
    };
  });
}

function buildMonthlyHours(sessions: Array<{ created_at: string; total_seconds: number | null }>) {
  const now = new Date();

  return Array.from({ length: 12 }, (_, index) => {
    const date = subMonths(now, 11 - index);
    const month = date.getMonth();
    const year = date.getFullYear();

    const totalSeconds = sessions
      .filter((session) => {
        const sessionDate = new Date(session.created_at);
        return sessionDate.getMonth() === month && sessionDate.getFullYear() === year;
      })
      .reduce((sum, session) => sum + (session.total_seconds ?? 0), 0);

    return {
      label: monthLabels[month] ?? "Mon",
      hours: Number((totalSeconds / 3600).toFixed(2)),
    };
  });
}

export async function GET() {
  const { supabase, user } = await getServerUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  const todayLabel = dayLabels[today.getDay()] ?? "Mon";

  const [tasksRes, sessionsRes, attendanceRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, work_days")
      .eq("user_id", user.id)
      .eq("is_active", true),
    supabase
      .from("timer_sessions")
      .select("created_at, total_seconds, status")
      .eq("user_id", user.id)
      .gte("created_at", `${toIsoDate(subYears(today, 1))}T00:00:00.000Z`),
    supabase
      .from("attendance")
      .select("date")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(365),
  ]);

  if (tasksRes.error || sessionsRes.error || attendanceRes.error) {
    return NextResponse.json({ success: false, error: "Failed to fetch stats" }, { status: 500 });
  }

  const sessions = sessionsRes.data ?? [];
  const todaysSessions = sessions.filter((session) => session.created_at.slice(0, 10) === toIsoDate(today));
  const todaysTasks = (tasksRes.data ?? []).filter((task) => task.work_days?.includes(todayLabel));

  const todayMetrics = {
    totalSeconds: sumSeconds(todaysSessions),
    tasksCompleted: todaysSessions.filter((session) => session.status === "completed").length,
    totalTasks: todaysTasks.length,
    successRatio:
      todaysTasks.length === 0
        ? 100
        : Math.round((todaysSessions.filter((session) => session.status === "completed").length / todaysTasks.length) * 100),
  };

  const ranges: Record<RangeKey, ReturnType<typeof toRangeMetrics>> = {
    weekly: toRangeMetrics(sessions.filter((session) => new Date(session.created_at) >= subDays(today, 7))),
    monthly: toRangeMetrics(sessions.filter((session) => new Date(session.created_at) >= subMonths(today, 1))),
    yearly: toRangeMetrics(sessions.filter((session) => new Date(session.created_at) >= subYears(today, 1))),
  };

  const streak = (attendanceRes.data ?? []).reduce((count, row, index, rows) => {
    if (index === 0) return 1;
    const previous = new Date(rows[index - 1].date);
    const current = new Date(row.date);
    const diff = Math.round((previous.getTime() - current.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 1 && count === index) {
      return count + 1;
    }
    return count;
  }, 0);

  return NextResponse.json({
    success: true,
    data: {
      today: {
        ...todayMetrics,
        streak,
      },
      ranges,
      charts: {
        weeklyHours: buildWeeklyHours(sessions),
        completionTrend: buildCompletionTrend(sessions),
        monthlyHours: buildMonthlyHours(sessions),
      },
    },
  });
}
