import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/server/auth";
import { format } from "date-fns";

export async function GET() {
  const { supabase, user } = await getServerUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const date = format(new Date(), "yyyy-MM-dd");

  const [tasksRes, sessionsRes] = await Promise.all([
    supabase.from("tasks").select("id, planned_hours, planned_minutes").eq("user_id", user.id),
    supabase
      .from("timer_sessions")
      .select("task_id, total_seconds, status")
      .eq("user_id", user.id)
      .gte("created_at", `${date}T00:00:00.000Z`),
  ]);

  if (tasksRes.error || sessionsRes.error) {
    return NextResponse.json({ success: false, error: "Failed to fetch stats" }, { status: 500 });
  }

  const totalSeconds = (sessionsRes.data ?? []).reduce((sum, session) => sum + (session.total_seconds ?? 0), 0);
  const tasksCompleted = (sessionsRes.data ?? []).filter((session) => session.status === "completed").length;
  const totalTasks = (tasksRes.data ?? []).length;

  const successRatio = totalTasks === 0 ? 100 : Math.round((tasksCompleted / totalTasks) * 100);

  return NextResponse.json({
    success: true,
    data: {
      totalSeconds,
      tasksCompleted,
      totalTasks,
      successRatio,
      streak: 0,
    },
  });
}
