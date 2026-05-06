import { NextResponse } from "next/server";
import { timerSchema } from "@/lib/validation/schemas";
import { getServerUser } from "@/lib/server/auth";

type TimerSession = {
  id: string;
  user_id: string;
  task_id: string;
  started_at: string;
  paused_at: string | null;
  resumed_at: string | null;
  ended_at: string | null;
  total_seconds: number | null;
  status: "running" | "paused" | "completed";
  created_at: string;
  task?: {
    title?: string;
    planned_hours?: number;
    planned_minutes?: number;
  } | null;
};

function getElapsedSeconds(session: TimerSession) {
  const base = session.total_seconds ?? 0;

  if (session.status !== "running") {
    return base;
  }

  const anchor = session.resumed_at ?? session.started_at;
  const elapsedSinceAnchor = Math.max(0, Math.floor((Date.now() - new Date(anchor).getTime()) / 1000));
  return base + elapsedSinceAnchor;
}

async function getActiveSessionForTask(
  supabase: Awaited<ReturnType<typeof getServerUser>>["supabase"],
  userId: string,
  taskId: string,
) {
  const { data, error } = await supabase
    .from("timer_sessions")
    .select("*, task:tasks(title, planned_hours, planned_minutes)")
    .eq("user_id", userId)
    .eq("task_id", taskId)
    .in("status", ["running", "paused"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<TimerSession>();

  return { data, error };
}

export async function GET(request: Request) {
  const { supabase, user } = await getServerUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get("taskId");

  let query = supabase
    .from("timer_sessions")
    .select("*, task:tasks(title, planned_hours, planned_minutes)")
    .eq("user_id", user.id)
    .in("status", ["running", "paused"])
    .order("created_at", { ascending: false })
    .limit(1);

  if (taskId) {
    query = query.eq("task_id", taskId);
  }

  const { data, error } = await query.maybeSingle<TimerSession>();

  if (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch timer state" }, { status: 500 });
  }

  if (!data) {
    return NextResponse.json({ success: true, data: null });
  }

  return NextResponse.json({
    success: true,
    data: {
      ...data,
      elapsedSeconds: getElapsedSeconds(data),
    },
  });
}

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

  const taskId = parsed.data.taskId;
  const now = new Date().toISOString();
  const activeSession = await getActiveSessionForTask(supabase, user.id, taskId);

  if (activeSession.error) {
    return NextResponse.json({ success: false, error: "Failed to fetch timer state" }, { status: 500 });
  }

  if (parsed.data.action === "start") {
    const { data: runningSession, error: runningError } = await supabase
      .from("timer_sessions")
      .select("id, task_id")
      .eq("user_id", user.id)
      .eq("status", "running")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle<{ id: string; task_id: string }>();

    if (runningError) {
      return NextResponse.json({ success: false, error: "Failed to validate running timer" }, { status: 500 });
    }

    if (runningSession && runningSession.task_id !== taskId) {
      return NextResponse.json(
        { success: false, error: "Pause or complete the currently running task before starting another." },
        { status: 409 },
      );
    }

    if (activeSession.data) {
      return NextResponse.json({
        success: true,
        data: {
          ...activeSession.data,
          elapsedSeconds: getElapsedSeconds(activeSession.data),
        },
      });
    }

    const { data, error } = await supabase
      .from("timer_sessions")
      .insert({
        user_id: user.id,
        task_id: taskId,
        started_at: now,
        resumed_at: now,
        total_seconds: 0,
        status: "running",
      })
      .select("*, task:tasks(title, planned_hours, planned_minutes)")
      .single<TimerSession>();

    if (error || !data) {
      return NextResponse.json({ success: false, error: "Failed to start timer" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        elapsedSeconds: getElapsedSeconds(data),
      },
    }, { status: 201 });
  }

  if (!activeSession.data) {
    return NextResponse.json({ success: false, error: "No active timer found" }, { status: 404 });
  }

  const current = activeSession.data;

  if (parsed.data.action === "pause") {
    const nextTotal = getElapsedSeconds(current);
    const { data, error } = await supabase
      .from("timer_sessions")
      .update({
        status: "paused",
        total_seconds: nextTotal,
        paused_at: now,
      })
      .eq("id", current.id)
      .eq("user_id", user.id)
      .select("*, task:tasks(title, planned_hours, planned_minutes)")
      .single<TimerSession>();

    if (error || !data) {
      return NextResponse.json({ success: false, error: "Failed to pause timer" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { ...data, elapsedSeconds: nextTotal } });
  }

  if (parsed.data.action === "resume") {
    const { data, error } = await supabase
      .from("timer_sessions")
      .update({
        status: "running",
        resumed_at: now,
        paused_at: null,
      })
      .eq("id", current.id)
      .eq("user_id", user.id)
      .select("*, task:tasks(title, planned_hours, planned_minutes)")
      .single<TimerSession>();

    if (error || !data) {
      return NextResponse.json({ success: false, error: "Failed to resume timer" }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: { ...data, elapsedSeconds: getElapsedSeconds(data) } });
  }

  const finalTotal = getElapsedSeconds(current);
  const { data, error } = await supabase
    .from("timer_sessions")
    .update({
      status: "completed",
      total_seconds: finalTotal,
      ended_at: now,
      paused_at: null,
    })
    .eq("id", current.id)
    .eq("user_id", user.id)
    .select("*, task:tasks(title, planned_hours, planned_minutes)")
    .single<TimerSession>();

  if (error || !data) {
    return NextResponse.json({ success: false, error: "Failed to complete timer" }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: { ...data, elapsedSeconds: finalTotal } });
}
