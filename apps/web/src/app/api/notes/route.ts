import { NextResponse } from "next/server";
import { createClient, requireUser } from "@/lib/supabase/server";
import { noteCreateSchema } from "@ai-coach/db";

interface NoteRow {
  id: string;
  kind: "nota" | "conversacion";
  title: string;
  body: string;
  tags: string[];
}

function toClient(n: NoteRow) {
  return {
    id: n.id,
    kind: n.kind,
    title: n.title,
    preview: (n.body ?? "").slice(0, 80),
    body: n.body ?? "",
    date: "Ahora",
    tags: n.tags ?? [],
  };
}

export async function GET() {
  try {
    const user = await requireUser();
    const supabase = await createClient();
    const { data } = await supabase
      .from("notes")
      .select("id, kind, title, body, tags")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    return NextResponse.json({ notes: ((data as NoteRow[]) ?? []).map(toClient) });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const parsed = noteCreateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("notes")
      .insert({
        user_id: user.id,
        kind: parsed.data.kind,
        title: parsed.data.title,
        body: parsed.data.body,
        tags: parsed.data.tags ?? [],
      })
      .select("id, kind, title, body, tags")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ note: toClient(data as NoteRow) });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
