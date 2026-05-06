import { NextResponse } from "next/server";
import { attendanceSchema } from "@/lib/validation/schemas";
import { getServerUser } from "@/lib/server/auth";
import { format } from "date-fns";

export async function GET() {
  const { supabase, user } = await getServerUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const date = format(new Date(), "yyyy-MM-dd");
  const { data, error } = await supabase
    .from("attendance")
    .select("*")
    .eq("user_id", user.id)
    .eq("date", date)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ success: false, error: "Failed to fetch attendance" }, { status: 500 });
  }

  return NextResponse.json({ success: true, data });
}

export async function POST(request: Request) {
  const { supabase, user } = await getServerUser();

  if (!user) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = attendanceSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid payload" }, { status: 400 });
  }

  const date = parsed.data.date ?? format(new Date(), "yyyy-MM-dd");

  const { data, error } = await supabase
    .from("attendance")
    .upsert(
      {
        user_id: user.id,
        date,
        checked_in_at: new Date().toISOString(),
      },
      { onConflict: "user_id,date" },
    )
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ success: false, error: "Failed to mark attendance" }, { status: 500 });
  }

  return NextResponse.json({ success: true, data }, { status: 201 });
}
