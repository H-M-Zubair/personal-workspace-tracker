import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/server/auth";
import { taskAbsenceSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  const { supabase, user } = await getServerUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = taskAbsenceSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 },
    );
  }

  const { taskId, date, reason } = parsed.data;
  const today = new Date().toISOString().slice(0, 10);
  if (date >= today) {
    return NextResponse.json(
      { success: false, error: "Reason can only be added for past dates." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("task_absences")
    .upsert(
      {
        user_id: user.id,
        task_id: taskId,
        date,
        reason,
      },
      { onConflict: "user_id,task_id,date" },
    )
    .select("id, task_id, date, reason, created_at")
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: "Failed to save absence reason" }, { status: 500 });
  }

  return NextResponse.json({ success: true, data }, { status: 201 });
}
