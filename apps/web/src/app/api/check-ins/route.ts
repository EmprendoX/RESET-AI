import { NextResponse } from "next/server";
import { createClient, requireUser } from "@/lib/supabase/server";
import { checkInSchema, createServiceClient, emitEvent } from "@ai-coach/db";
import { generateCheckInSummary } from "@ai-coach/agent";
import { getFeatureFlag } from "@ai-coach/config";
import { generateIdempotencyKey } from "@ai-coach/shared";

export async function GET() {
  try {
    const user = await requireUser();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("check_ins")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ check_ins: data });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  if (!getFeatureFlag("AI_COACH_CHECK_INS_ENABLED")) {
    return NextResponse.json({ error: "Check-ins disabled" }, { status: 503 });
  }

  try {
    const user = await requireUser();
    const body = await request.json();
    const parsed = checkInSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid check-in" }, { status: 400 });
    }

    let summary: string;
    try {
      summary = await generateCheckInSummary(parsed.data);
    } catch {
      summary = "Check-in registrado. Sigue con tu meta principal.";
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("check_ins")
      .insert({
        user_id: user.id,
        answers_json: parsed.data,
        summary,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const service = createServiceClient();
    await emitEvent(service, {
      userId: user.id,
      eventType: "check_in_completed",
      objectType: "check_in",
      objectId: data.id,
      idempotencyKey: generateIdempotencyKey("check_in_completed", user.id, data.id),
    });

    return NextResponse.json({ check_in: data });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
