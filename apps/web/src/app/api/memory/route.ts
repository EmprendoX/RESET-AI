import { NextResponse } from "next/server";
import { createClient, requireUser } from "@/lib/supabase/server";
import { memorySchema, memoryUpdateSchema, createServiceClient, auditLog } from "@ai-coach/db";
import { getFeatureFlag } from "@ai-coach/config";

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const supabase = await createClient();

    let query = supabase.from("memories").select("*").eq("user_id", user.id).order("updated_at", { ascending: false });
    if (type) query = query.eq("type", type);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ memories: data });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  if (!getFeatureFlag("AI_COACH_MEMORY_ENABLED")) {
    return NextResponse.json({ error: "Memory disabled" }, { status: 503 });
  }

  try {
    const user = await requireUser();
    const body = await request.json();
    const parsed = memorySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid memory" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("coach_profiles")
      .select("memory_enabled")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile?.memory_enabled) {
      return NextResponse.json({ error: "Memory is disabled" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("memories")
      .insert({
        user_id: user.id,
        ...parsed.data,
        source: parsed.data.source ?? "manual",
        confidence: parsed.data.confidence ?? "medium",
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const service = createServiceClient();
    await auditLog(service, {
      userId: user.id,
      action: "memory_created",
      entityType: "memory",
      entityId: data.id,
    });

    return NextResponse.json({ memory: data });
  } catch {
    return NextResponse.json(
      { error: "No pudimos actualizar tu memoria en este momento. Intenta de nuevo." },
      { status: 500 }
    );
  }
}
