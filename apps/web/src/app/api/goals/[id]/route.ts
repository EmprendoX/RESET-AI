import { NextResponse } from "next/server";
import { createClient, requireUser } from "@/lib/supabase/server";
import { goalSchema, createServiceClient, emitEvent } from "@ai-coach/db";
import { generateIdempotencyKey } from "@ai-coach/shared";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = await request.json();
    const parsed = goalSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid goal" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("goals")
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    if (parsed.data.status === "completed") {
      const service = createServiceClient();
      await emitEvent(service, {
        userId: user.id,
        eventType: "goal_completed",
        objectType: "goal",
        objectId: id,
        idempotencyKey: generateIdempotencyKey("goal_completed", user.id, id),
      });
    }

    return NextResponse.json({ goal: data });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const supabase = await createClient();

    const { error } = await supabase
      .from("goals")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
