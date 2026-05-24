import { NextResponse } from "next/server";
import { createClient, requireUser } from "@/lib/supabase/server";
import { createServiceClient, emitEvent } from "@ai-coach/db";
import { generateIdempotencyKey } from "@ai-coach/shared";

async function updateStatus(
  id: string,
  status: string,
  eventType: string
) {
  const user = await requireUser();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recommendations")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const service = createServiceClient();
  await emitEvent(service, {
    userId: user.id,
    eventType,
    objectType: "recommendation",
    objectId: id,
    idempotencyKey: generateIdempotencyKey(eventType, user.id, id),
  });

  return NextResponse.json({ recommendation: data });
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; action: string }> }
) {
  try {
    const { id, action } = await params;
    switch (action) {
      case "accept":
        return updateStatus(id, "accepted", "recommendation_accepted");
      case "dismiss":
        return updateStatus(id, "dismissed", "recommendation_dismissed");
      case "complete":
        return updateStatus(id, "completed", "recommendation_accepted");
      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
