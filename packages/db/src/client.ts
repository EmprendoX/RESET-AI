import { createClient, SupabaseClient } from "@supabase/supabase-js";

export type TypedSupabaseClient = SupabaseClient<any, any, any>;

export function createServiceClient(): TypedSupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase service credentials");
  }
  return createClient(url, key, { db: { schema: "ai_coach" } });
}

export function createAnonClient(): TypedSupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase anon credentials");
  }
  return createClient(url, key, { db: { schema: "ai_coach" } });
}

export async function ensureCoachProfile(
  client: TypedSupabaseClient,
  user: { id: string; email: string; name?: string | null }
) {
  await client.from("users_profile").upsert(
    { id: user.id, email: user.email, name: user.name ?? null },
    { onConflict: "id", ignoreDuplicates: true }
  );
  await client.from("coach_profiles").upsert(
    { user_id: user.id, name: user.name ?? null, memory_enabled: true },
    { onConflict: "user_id", ignoreDuplicates: true }
  );
}

// Asegura que el usuario tenga su espacio de creador + membresía 'creator'.
// Idempotente. Se llama con el service client (bypassa RLS) en el login/signup.
// Bootstrap simple: un espacio personal por usuario. (Más adelante un usuario
// podrá ser miembro de otros creadores sin dejar de tener el propio.)
export async function ensureCreatorWorkspace(
  client: TypedSupabaseClient,
  user: { id: string; email: string; name?: string | null }
): Promise<string> {
  const { data: existing } = await client
    .from("creators")
    .select("id")
    .eq("owner_user_id", user.id)
    .maybeSingle();

  let creatorId = existing?.id as string | undefined;

  if (!creatorId) {
    const handle = (user.email.split("@")[0] || `creator-${user.id.slice(0, 8)}`)
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "-");
    const { data: created, error } = await client
      .from("creators")
      .insert({
        owner_user_id: user.id,
        handle: `${handle}-${user.id.slice(0, 6)}`,
        display_name: user.name ?? user.email,
      })
      .select("id")
      .single();
    if (error) throw error;
    creatorId = created.id as string;
  }

  await client.from("memberships").upsert(
    { creator_id: creatorId, user_id: user.id, role: "creator", status: "active" },
    { onConflict: "creator_id,user_id", ignoreDuplicates: true }
  );

  return creatorId;
}

// Devuelve el creator_id del espacio que posee el usuario (o null).
export async function getOwnedCreatorId(
  client: TypedSupabaseClient,
  userId: string
): Promise<string | null> {
  const { data } = await client
    .from("creators")
    .select("id")
    .eq("owner_user_id", userId)
    .maybeSingle();
  return (data?.id as string | undefined) ?? null;
}

// Resuelve el creador "activo" para un usuario en el chat: prioriza una membresía de
// miembro (estás en la comunidad de ese creador); si no, su propio espacio.
export async function getActiveCreatorId(
  client: TypedSupabaseClient,
  userId: string
): Promise<string | null> {
  const { data } = await client
    .from("memberships")
    .select("creator_id, role")
    .eq("user_id", userId)
    .eq("status", "active");

  const rows = (data as { creator_id: string; role: string }[]) ?? [];
  if (rows.length === 0) return null;
  const member = rows.find((r) => r.role === "member");
  return (member ?? rows[0]).creator_id;
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
