import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/server/auth";

export async function GET() {
  const { supabase, user } = await getServerUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const [attendance, sessions, absences] = await Promise.all([
    supabase
      .from("attendance")
      .select("date, checked_in_at")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(60),
    supabase
      .from("timer_sessions")
      .select("id, task_id, total_seconds, status, created_at, task:tasks(title)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("task_absences")
      .select("id, task_id, date, reason, created_at")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(500),
  ]);

  if (attendance.error || sessions.error || absences.error) {
    return NextResponse.json({ success: false, error: "Failed to fetch history" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data: {
      attendance: attendance.data ?? [],
      sessions: sessions.data ?? [],
      absences: absences.data ?? [],
    },
  });
}
