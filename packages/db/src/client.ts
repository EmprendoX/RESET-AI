import { createClient, SupabaseClient } from "@supabase/supabase-js";

export type TypedSupabaseClient = SupabaseClient<any>;

export function createServiceClient(): TypedSupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase service credentials");
  }
  return createClient(url, key);
}

export function createAnonClient(): TypedSupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase anon credentials");
  }
  return createClient(url, key);
}

export async function emitEvent(
  client: TypedSupabaseClient,
  params: {
    userId: string;
    eventType: string;
    objectType?: string;
    objectId?: string;
    metadata?: Record<string, unknown>;
    idempotencyKey: string;
  }
) {
  const { error } = await client.from("user_events").insert({
    user_id: params.userId,
    event_type: params.eventType,
    source: "ai_coach_app",
    object_type: params.objectType ?? null,
    object_id: params.objectId ?? null,
    metadata_json: params.metadata ?? null,
    idempotency_key: params.idempotencyKey,
    occurred_at: new Date().toISOString(),
  });

  if (error && !error.message.includes("duplicate")) {
    throw error;
  }
}

export async function auditLog(
  client: TypedSupabaseClient,
  params: {
    userId: string | null;
    action: string;
    entityType: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
  }
) {
  await client.from("audit_logs").insert({
    user_id: params.userId,
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId ?? null,
    metadata_json: params.metadata ?? null,
  });
}

export async function checkRateLimit(
  client: TypedSupabaseClient,
  userId: string,
  limit: number
): Promise<{ allowed: boolean; count: number }> {
  const today = new Date().toISOString().slice(0, 10);

  const { data: existing } = await client
    .from("usage_counters")
    .select("id, coach_messages")
    .eq("user_id", userId)
    .eq("day", today)
    .maybeSingle();

  const count = existing?.coach_messages ?? 0;
  if (count >= limit) {
    return { allowed: false, count };
  }

  if (existing) {
    await client
      .from("usage_counters")
      .update({ coach_messages: count + 1, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
  } else {
    await client.from("usage_counters").insert({
      user_id: userId,
      day: today,
      coach_messages: 1,
    });
  }

  return { allowed: true, count: count + 1 };
}
