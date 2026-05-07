import { NextResponse } from "next/server";
import { taskSchema } from "@/lib/validation/schemas";
import { getServerUser } from "@/lib/server/auth";

export async function GET() {
  const { supabase, user } = await getServerUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[TasksAPI] get", error.message);
    return NextResponse.json({ success: false, error: "Failed to fetch tasks" }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

export async function POST(request: Request) {
  const { supabase, user } = await getServerUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = taskSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      category: parsed.data.category,
      priority: parsed.data.priority,
      planned_hours: parsed.data.plannedHours,
      planned_minutes: parsed.data.plannedMinutes,
      frequency: parsed.data.frequency,
      single_date:
        parsed.data.frequency === "once"
          ? (parsed.data.singleDate ?? new Date().toISOString().slice(0, 10))
          : null,
      work_days: parsed.data.frequency === "repeat" ? parsed.data.workDays : [],
      is_active: parsed.data.isActive,
    })
    .select("*")
    .single();

  if (error) {
    console.error("[TasksAPI] create", error.message);
    return NextResponse.json({ success: false, error: "Failed to create task" }, { status: 500 });
  }

  return NextResponse.json({ success: true, data }, { status: 201 });
}
