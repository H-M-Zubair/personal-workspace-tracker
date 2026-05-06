import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/server/auth";
import { format } from "date-fns";

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function isoDate(value: Date) {
  return format(value, "yyyy-MM-dd");
}

export async function GET() {
  const { supabase, user } = await getServerUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const today = new Date();
  const todayLabel = dayLabels[today.getDay()] ?? "Mon";
  const date = isoDate(today);

  const [tasksRes, sessionsRes, attendanceRes] = await Promise.all([
    supabase
      .from("tasks")
      .select("id, planned_hours, planned_minutes, work_days")
      .eq("user_id", user.id)
      .eq("is_active", true),
    supabase
      .from("timer_sessions")
      .select("task_id, total_seconds, status")
      .eq("user_id", user.id)
      .gte("created_at", `${date}T00:00:00.000Z`),
    supabase
      .from("attendance")
      .select("date")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(30),
  ]);

  if (tasksRes.error || sessionsRes.error || attendanceRes.error) {
    return NextResponse.json({ success: false, error: "Failed to fetch stats" }, { status: 500 });
  }

  const todaysTasks = (tasksRes.data ?? []).filter((task) => task.work_days?.includes(todayLabel));
  const totalSeconds = (sessionsRes.data ?? []).reduce((sum, session) => sum + (session.total_seconds ?? 0), 0);
  const tasksCompleted = (sessionsRes.data ?? []).filter((session) => session.status === "completed").length;
  const totalTasks = todaysTasks.length;
  const successRatio = totalTasks === 0 ? 100 : Math.round((tasksCompleted / totalTasks) * 100);

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
      totalSeconds,
      tasksCompleted,
      totalTasks,
      successRatio,
      streak,
    },
  });
}
