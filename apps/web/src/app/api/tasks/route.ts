import { NextResponse } from "next/server";
import { createClient, requireUser } from "@/lib/supabase/server";
import { taskCreateSchema } from "@ai-coach/db";

interface TaskRow {
  id: string;
  title: string;
  note: string | null;
  status: "pendiente" | "en_curso" | "hecha";
  priority: "alta" | "media" | "baja";
  due: string | null;
  linked_habit: string | null;
}

function toClient(t: TaskRow) {
  return {
    id: t.id,
    title: t.title,
    note: t.note ?? undefined,
    status: t.status,
    priority: t.priority,
    due: t.due ?? "",
    linkedHabit: t.linked_habit ?? undefined,
  };
}

export async function GET() {
  try {
    const user = await requireUser();
    const supabase = await createClient();
    const { data } = await supabase
      .from("app_tasks")
      .select("id, title, note, status, priority, due, linked_habit")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    return NextResponse.json({ tasks: ((data as TaskRow[]) ?? []).map(toClient) });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const parsed = taskCreateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("app_tasks")
      .insert({
        user_id: user.id,
        title: parsed.data.title,
        note: parsed.data.note ?? null,
        priority: parsed.data.priority,
        due: parsed.data.due ?? null,
        linked_habit: parsed.data.linked_habit ?? null,
      })
      .select("id, title, note, status, priority, due, linked_habit")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ task: toClient(data as TaskRow) });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
