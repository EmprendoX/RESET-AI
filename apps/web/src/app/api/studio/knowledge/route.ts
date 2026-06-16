import { NextResponse } from "next/server";
import { createClient, requireUser } from "@/lib/supabase/server";
import { getOwnedCreatorId, knowledgeSourceSchema } from "@ai-coach/db";
import { chunkText, embedTexts } from "@ai-coach/agent";

function relativeDate() {
  return "Ahora";
}

export async function GET() {
  try {
    const user = await requireUser();
    const supabase = await createClient();
    const creatorId = await getOwnedCreatorId(supabase, user.id);
    if (!creatorId) return NextResponse.json({ sources: [] });

    const { data } = await supabase
      .from("knowledge_sources")
      .select("id, title, type, status, chunks, lessons, updated_at")
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false });

    const sources = (data ?? []).map((s) => ({
      id: s.id,
      title: s.title,
      type: s.type,
      status: s.status,
      chunks: s.chunks,
      lessons: s.lessons ?? undefined,
      updated: "—",
    }));
    return NextResponse.json({ sources });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const parsed = knowledgeSourceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid source" }, { status: 400 });
    }

    const supabase = await createClient();
    const creatorId = await getOwnedCreatorId(supabase, user.id);
    if (!creatorId) return NextResponse.json({ error: "No creator workspace" }, { status: 400 });

    // 1) crear la fuente en estado procesando
    const { data: source, error: srcErr } = await supabase
      .from("knowledge_sources")
      .insert({
        creator_id: creatorId,
        title: parsed.data.title,
        type: parsed.data.type,
        status: "procesando",
      })
      .select()
      .single();
    if (srcErr || !source) {
      return NextResponse.json({ error: srcErr?.message ?? "No se pudo crear" }, { status: 500 });
    }

    try {
      // 2) chunk + 3) embeddings + 4) guardar
      const chunks = chunkText(parsed.data.content);
      const vectors = await embedTexts(chunks.map((c) => c.content));
      const rows = chunks.map((c, i) => ({
        source_id: source.id,
        creator_id: creatorId,
        content: c.content,
        lesson_label: c.lessonLabel ?? null,
        // pgvector parsea el formato "[0.1,0.2,...]"; mandarlo como string evita
        // ambigüedades de serialización con supabase-js.
        embedding: JSON.stringify(vectors[i]),
        token_count: c.tokenCount,
      }));
      if (rows.length) {
        const { error: chErr } = await supabase.from("kb_chunks").insert(rows);
        if (chErr) throw chErr;
      }

      // 5) marcar indexado
      const { data: updated } = await supabase
        .from("knowledge_sources")
        .update({ status: "indexado", chunks: rows.length, updated_at: new Date().toISOString() })
        .eq("id", source.id)
        .select()
        .single();

      return NextResponse.json({
        source: {
          id: updated?.id ?? source.id,
          title: parsed.data.title,
          type: parsed.data.type,
          status: "indexado",
          chunks: rows.length,
          updated: relativeDate(),
        },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error de indexado";
      await supabase
        .from("knowledge_sources")
        .update({ status: "error", error: msg })
        .eq("id", source.id);
      return NextResponse.json({ error: msg }, { status: 502 });
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
