import { NextResponse } from "next/server";
import { createClient, requireUser } from "@/lib/supabase/server";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser();
    const { id } = await params;
    const supabase = await createClient();
    // RLS limita el borrado a fuentes del creador dueño. Los chunks caen por cascada.
    const { error } = await supabase.from("knowledge_sources").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
