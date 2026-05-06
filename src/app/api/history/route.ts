import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/server/auth";

export async function GET() {
  const { supabase, user } = await getServerUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const [attendance, sessions] = await Promise.all([
    supabase.from("attendance").select("*").eq("user_id", user.id).order("date", { ascending: false }).limit(30),
    supabase.from("timer_sessions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(200),
  ]);

  if (attendance.error || sessions.error) {
    return NextResponse.json({ success: false, error: "Failed to fetch history" }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    data: {
      attendance: attendance.data ?? [],
      sessions: sessions.data ?? [],
    },
  });
}
