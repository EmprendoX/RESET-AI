import { NextResponse } from "next/server";
import { createClient, requireUser } from "@/lib/supabase/server";

function dayStr(d: Date) {
  return d.toISOString().slice(0, 10);
}
function dayOffset(n: number) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - n);
  return d;
}
const WEEK = ["D", "L", "M", "M", "J", "V", "S"];

export async function GET() {
  try {
    const user = await requireUser();
    const supabase = await createClient();

    const { data: habits } = await supabase
      .from("habits")
      .select("id")
      .eq("user_id", user.id)
      .eq("active", true);
    const habitIds = ((habits as { id: string }[]) ?? []).map((h) => h.id);
    const active = habitIds.length;

    const since = dayStr(dayOffset(60));
    const { data: logs } = await supabase
      .from("habit_logs")
      .select("habit_id, day, done")
      .eq("user_id", user.id)
      .gte("day", since);

    // doneByDay: día -> nº de hábitos hechos; doneByHabit: hábito -> Set(días)
    const doneByDay: Record<string, number> = {};
    const doneByHabit: Record<string, Set<string>> = {};
    for (const l of (logs as { habit_id: string; day: string; done: boolean }[]) ?? []) {
      if (!l.done) continue;
      doneByDay[l.day] = (doneByDay[l.day] ?? 0) + 1;
      (doneByHabit[l.habit_id] ??= new Set()).add(l.day);
    }

    // Últimos 14 días
    const last14Days = Array.from({ length: 14 }, (_, i) => {
      const d = dayOffset(13 - i);
      const doneCount = doneByDay[dayStr(d)] ?? 0;
      return {
        label: WEEK[d.getUTCDay()],
        pct: active ? Math.round((doneCount / active) * 100) : 0,
      };
    });

    // Cumplimiento 30 días + días perfectos
    let done30 = 0;
    let perfectos = 0;
    for (let i = 0; i < 30; i++) {
      const c = doneByDay[dayStr(dayOffset(i))] ?? 0;
      done30 += c;
      if (active > 0 && c >= active) perfectos++;
    }
    const cumplimiento30 = active ? Math.round((done30 / (active * 30)) * 100) : 0;

    // Mejor racha: máxima corrida consecutiva por hábito (ventana 60 días)
    let mejorRacha = 0;
    for (const id of habitIds) {
      const set = doneByHabit[id] ?? new Set<string>();
      let run = 0;
      for (let i = 0; i < 60; i++) {
        if (set.has(dayStr(dayOffset(i)))) {
          run++;
          if (run > mejorRacha) mejorRacha = run;
        } else {
          run = 0;
        }
      }
    }

    return NextResponse.json({
      stats: { cumplimiento30, mejorRacha, diasPerfectos: perfectos, habitosActivos: active },
      last14Days,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
