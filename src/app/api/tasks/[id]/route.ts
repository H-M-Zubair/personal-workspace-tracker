import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/server/auth";
import { taskSchema } from "@/lib/validation/schemas";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, context: Params) {
  const { supabase, user } = await getServerUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const payload = await request.json();
  const parsed = taskSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("tasks")
    .update({
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
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: "Failed to update task" }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

export async function DELETE(_request: Request, context: Params) {
  const { supabase, user } = await getServerUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const { error } = await supabase
    .from("tasks")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ success: false, error: "Failed to delete task" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
