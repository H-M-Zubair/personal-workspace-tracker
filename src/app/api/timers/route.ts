import { NextResponse } from "next/server";
import { timerSchema } from "@/lib/validation/schemas";
import { getServerUser } from "@/lib/server/auth";

export async function POST(request: Request) {
  const { supabase, user } = await getServerUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = timerSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
  }

  const now = new Date().toISOString();

  if (parsed.data.action === "start") {
    const { data, error } = await supabase
      .from("timer_sessions")
      .insert({
        user_id: user.id,
        task_id: parsed.data.taskId,
        started_at: now,
        status: "running",
      })
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: "Failed to start timer" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data }, { status: 201 });
  }

  const { data, error } = await supabase
    .from("timer_sessions")
    .update({
      status: parsed.data.action === "complete" ? "completed" : parsed.data.action,
      total_seconds: parsed.data.totalSeconds ?? 0,
      ended_at: parsed.data.action === "complete" ? now : null,
      paused_at: parsed.data.action === "pause" ? now : null,
      resumed_at: parsed.data.action === "resume" ? now : null,
    })
    .eq("task_id", parsed.data.taskId)
    .eq("user_id", user.id)
    .eq("status", "running")
    .select("*");

  if (error) {
    return NextResponse.json({ success: false, error: "Failed to update timer" }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}
