import { NextResponse } from "next/server";
import { createClient, requireUser } from "@/lib/supabase/server";
import { eventSchema, createServiceClient, emitEvent } from "@ai-coach/db";
import { getFeatureFlag } from "@ai-coach/config";

export async function GET() {
  try {
    const user = await requireUser();
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("users_profile")
      .select("is_admin")
      .eq("id", user.id)
      .maybeSingle();

    const service = createServiceClient();
    let query = service
      .from("user_events")
      .select("*")
      .order("occurred_at", { ascending: false })
      .limit(50);

    const isAdmin = (profile as { is_admin: boolean } | null)?.is_admin;
    if (!isAdmin) {
      query = query.eq("user_id", user.id);
    }

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ events: data });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  if (!getFeatureFlag("AI_COACH_EVENTS_ENABLED")) {
    return NextResponse.json({ error: "Events disabled" }, { status: 503 });
  }

  try {
    const user = await requireUser();
    const body = await request.json();
    const parsed = eventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid event" }, { status: 400 });
    }

    const service = createServiceClient();
    await emitEvent(service, {
      userId: user.id,
      eventType: parsed.data.event_type,
      objectType: parsed.data.object_type,
      objectId: parsed.data.object_id,
      metadata: parsed.data.metadata,
      idempotencyKey: parsed.data.idempotency_key,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
