import { NextResponse } from "next/server";
import { createClient, requireUser } from "@/lib/supabase/server";
import { habitCreateSchema } from "@ai-coach/db";

function dayStr(d: Date) {
  return d.toISOString().slice(0, 10);
}
function dayOffset(n: number) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}

interface HabitRow {
  id: string;
  title: string;
  description: string | null;
  category: string;
  time: string | null;
  icon: string | null;
}

export async function GET() {
  try {
    const user = await requireUser();
    const supabase = await createClient();

    const { data: habits } = await supabase
      .from("habits")
      .select("id, title, description, category, time, icon")
      .eq("user_id", user.id)
      .eq("active", true)
      .order("created_at", { ascending: true });

    const rows = (habits as HabitRow[]) ?? [];
    const since = dayStr(dayOffset(60));

    const { data: logs } = await supabase
      .from("habit_logs")
      .select("habit_id, day, done")
      .eq("user_id", user.id)
      .gte("day", since);

    const doneByHabit: Record<string, Set<string>> = {};
    for (const l of (logs as { habit_id: string; day: string; done: boolean }[]) ?? []) {
      if (!l.done) continue;
      (doneByHabit[l.habit_id] ??= new Set()).add(l.day);
    }

    const todayStr = dayStr(dayOffset(0));
    const result = rows.map((h) => {
      const done = doneByHabit[h.id] ?? new Set<string>();
      const week = Array.from({ length: 7 }, (_, i) => done.has(dayStr(dayOffset(6 - i))));
      // racha: días consecutivos hacia atrás (con gracia para hoy aún no hecho)
      let streak = 0;
      let cursor = 0;
      if (!done.has(todayStr)) cursor = 1;
      while (done.has(dayStr(dayOffset(cursor)))) {
        streak++;
        cursor++;
      }
      return {
        id: h.id,
        title: h.title,
        description: h.description ?? "",
        category: h.category,
        time: h.time ?? "",
        icon: h.icon ?? "✅",
        streak,
        done: done.has(todayStr),
        week,
      };
    });

    return NextResponse.json({ habits: result });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const parsed = habitCreateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("habits")
      .insert({
        user_id: user.id,
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        category: parsed.data.category,
        time: parsed.data.time ?? null,
        icon: parsed.data.icon ?? "✅",
      })
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      habit: {
        id: data.id,
        title: data.title,
        description: data.description ?? "",
        category: data.category,
        time: data.time ?? "",
        icon: data.icon ?? "✅",
        streak: 0,
        done: false,
        week: [false, false, false, false, false, false, false],
      },
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
