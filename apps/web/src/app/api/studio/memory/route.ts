import { NextResponse } from "next/server";
import { createClient, requireUser } from "@/lib/supabase/server";
import { coachMemorySchema, getOwnedCreatorId } from "@ai-coach/db";
import { storeMemory } from "@ai-coach/agent";

interface MemRow {
  id: string;
  scope: "persona" | "miembro";
  member_user_id: string | null;
  type: string;
  content: string;
  source: string | null;
  consent: boolean;
}

export async function GET() {
  try {
    const user = await requireUser();
    const supabase = await createClient();
    const creatorId = await getOwnedCreatorId(supabase, user.id);
    if (!creatorId) return NextResponse.json({ items: [], members: [] });

    const { data } = await supabase
      .from("coach_memories")
      .select("id, scope, member_user_id, type, content, source, consent")
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false });

    const rows = (data as MemRow[]) ?? [];
    const items = rows.map((m) => ({
      id: m.id,
      scope: m.scope,
      memberId: m.member_user_id ?? undefined,
      type: m.type,
      content: m.content,
      source: m.source ?? "",
      consent: m.consent,
      date: "—",
    }));

    // Miembros (derivados de las memorias + nombre de users_profile).
    const ids = [...new Set(rows.map((m) => m.member_user_id).filter(Boolean))] as string[];
    const names: Record<string, string> = {};
    if (ids.length) {
      const { data: profiles } = await supabase
        .from("users_profile")
        .select("id, name, email")
        .in("id", ids);
      for (const p of (profiles as { id: string; name: string | null; email: string }[]) ?? [])
        names[p.id] = p.name || p.email || "Miembro";
    }
    const members = ids.map((id) => {
      const name = names[id] ?? "Miembro";
      return {
        id,
        name,
        initial: name.charAt(0).toUpperCase(),
        joined: "—",
        memories: rows.filter((m) => m.member_user_id === id).length,
      };
    });

    return NextResponse.json({ items, members });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const parsed = coachMemorySchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid" }, { status: 400 });

    const supabase = await createClient();
    const creatorId = await getOwnedCreatorId(supabase, user.id);
    if (!creatorId) return NextResponse.json({ error: "No creator workspace" }, { status: 400 });

    await storeMemory(supabase, {
      creatorId,
      scope: parsed.data.scope,
      memberUserId: parsed.data.member_user_id ?? null,
      type: parsed.data.type,
      content: parsed.data.content,
      source: parsed.data.source,
      consent: parsed.data.consent ?? false,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    const status = msg.includes("OPENAI_API_KEY") ? 503 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}
