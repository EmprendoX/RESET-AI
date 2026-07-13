import { NextResponse } from "next/server";
import { createClient, requireUser } from "@/lib/supabase/server";
import { getOwnedCreatorId, personaSchema } from "@ai-coach/db";

// Mapea fila de DB (snake_case) → forma del frontend (camelCase).
function toClient(row: Record<string, unknown> | null) {
  if (!row) return null;
  return {
    coachName: row.coach_name ?? "Coach",
    tagline: row.tagline ?? "",
    avatar: row.avatar ?? "🧭",
    tone: row.tone ?? {},
    voice: row.voice ?? "",
    values: row.values ?? [],
    signaturePhrases: row.signature_phrases ?? [],
    dos: row.dos ?? [],
    donts: row.donts ?? [],
    methodology: row.methodology ?? "",
    sampleReplies: row.sample_replies ?? [],
    objective: row.objective ?? "",
    role: row.role ?? "",
    targetAudience: row.target_audience ?? "",
    businessContext: row.business_context ?? "",
    instructions: row.instructions ?? "",
    workflow: row.workflow ?? "",
    outputFormat: row.output_format ?? "",
    qualityCriteria: row.quality_criteria ?? [],
    isPublished: row.is_published ?? false,
  };
}

export async function GET() {
  try {
    const user = await requireUser();
    const supabase = await createClient();
    const creatorId = await getOwnedCreatorId(supabase, user.id);
    if (!creatorId) return NextResponse.json({ persona: null });

    const { data } = await supabase
      .from("personas")
      .select("*")
      .eq("creator_id", creatorId)
      .maybeSingle();

    return NextResponse.json({ persona: toClient(data) });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const parsed = personaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid persona" }, { status: 400 });
    }

    const supabase = await createClient();
    const creatorId = await getOwnedCreatorId(supabase, user.id);
    if (!creatorId) return NextResponse.json({ error: "No creator workspace" }, { status: 400 });

    const p = parsed.data;
    const { data, error } = await supabase
      .from("personas")
      .upsert(
        {
          creator_id: creatorId,
          coach_name: p.coach_name,
          tagline: p.tagline ?? null,
          avatar: p.avatar ?? null,
          tone: p.tone ?? {},
          voice: p.voice ?? null,
          values: p.values ?? [],
          signature_phrases: p.signature_phrases ?? [],
          dos: p.dos ?? [],
          donts: p.donts ?? [],
          methodology: p.methodology ?? null,
          sample_replies: p.sample_replies ?? [],
          objective: p.objective ?? null,
          role: p.role ?? null,
          target_audience: p.target_audience ?? null,
          business_context: p.business_context ?? null,
          instructions: p.instructions ?? null,
          workflow: p.workflow ?? null,
          output_format: p.output_format ?? null,
          quality_criteria: p.quality_criteria ?? [],
          is_published: p.is_published ?? false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "creator_id" }
      )
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ persona: toClient(data) });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
