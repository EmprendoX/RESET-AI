import { NextResponse } from "next/server";
import { createClient, requireUser } from "@/lib/supabase/server";
import { goalSchema, createServiceClient, emitEvent } from "@ai-coach/db";
import { getFeatureFlag } from "@ai-coach/config";
import { generateIdempotencyKey } from "@ai-coach/shared";

export async function GET() {
  try {
    const user = await requireUser();
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ goals: data });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  if (!getFeatureFlag("AI_COACH_GOALS_ENABLED")) {
    return NextResponse.json({ error: "Goals disabled" }, { status: 503 });
  }

  try {
    const user = await requireUser();
    const body = await request.json();
    const parsed = goalSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid goal" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("goals")
      .insert({
        user_id: user.id,
        ...parsed.data,
        created_by: "user",
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const service = createServiceClient();
    await emitEvent(service, {
      userId: user.id,
      eventType: "goal_created",
      objectType: "goal",
      objectId: data.id,
      idempotencyKey: generateIdempotencyKey("goal_created", user.id, data.id),
    });

    return NextResponse.json({ goal: data });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
