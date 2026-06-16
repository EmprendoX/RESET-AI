import { NextResponse } from "next/server";
import { createClient, requireUser } from "@/lib/supabase/server";
import { taskUpdateSchema } from "@ai-coach/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser();
    const { id } = await params;
    const body = await request.json();
    const parsed = taskUpdateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

    const supabase = await createClient();
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (parsed.data.status) update.status = parsed.data.status;
    if (parsed.data.title) update.title = parsed.data.title;
    if (parsed.data.priority) update.priority = parsed.data.priority;

    const { error } = await supabase.from("app_tasks").update(update).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser();
    const { id } = await params;
    const supabase = await createClient();
    const { error } = await supabase.from("app_tasks").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
