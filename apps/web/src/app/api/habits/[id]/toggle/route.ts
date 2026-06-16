import { NextResponse } from "next/server";
import { createClient, requireUser } from "@/lib/supabase/server";

function todayStr() {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

// Marca/desmarca el hábito para hoy (upsert del log del día).
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const supabase = await createClient();
    const day = todayStr();

    const { data: existing } = await supabase
      .from("habit_logs")
      .select("id, done")
      .eq("habit_id", id)
      .eq("user_id", user.id)
      .eq("day", day)
      .maybeSingle();

    let done: boolean;
    if (existing) {
      done = !existing.done;
      const { error } = await supabase.from("habit_logs").update({ done }).eq("id", existing.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      done = true;
      const { error } = await supabase
        .from("habit_logs")
        .insert({ habit_id: id, user_id: user.id, day, done });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ done });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
