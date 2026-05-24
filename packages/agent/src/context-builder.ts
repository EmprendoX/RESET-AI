import type { TypedSupabaseClient } from "@ai-coach/db";

export async function buildUserContext(
  client: TypedSupabaseClient,
  userId: string
): Promise<string> {
  const sections: string[] = [];

  const { data: coachProfile } = await client
    .from("coach_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (coachProfile) {
    sections.push(
      `Perfil del coach:\n- Nombre: ${coachProfile.name ?? "N/A"}\n- Enfoque: ${coachProfile.main_focus ?? "N/A"}\n- Estilo: ${coachProfile.coaching_style ?? "N/A"}\n- Memoria activa: ${coachProfile.memory_enabled}`
    );
  }

  const { data: business } = await client
    .from("business_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (business) {
    sections.push(
      `Negocio/Proyecto:\n- Tiene negocio: ${business.has_business}\n- Oferta: ${business.offer ?? "N/A"}\n- Cliente ideal: ${business.ideal_customer ?? "N/A"}\n- Canal: ${business.main_channel ?? "N/A"}\n- Meta: ${business.monthly_goal ?? "N/A"}\n- Bloqueo: ${business.main_blocker ?? "N/A"}`
    );
  }

  const { data: goals } = await client
    .from("goals")
    .select("title, description, status, progress, category")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(10);

  if (goals?.length) {
    sections.push(
      `Metas activas:\n${goals.map((g) => `- ${g.title} (${g.progress}%): ${g.description ?? ""}`).join("\n")}`
    );
  }

  if (coachProfile?.memory_enabled) {
    const { data: memories } = await client
      .from("memories")
      .select("type, title, content, source")
      .eq("user_id", userId)
      .eq("is_active", true)
      .limit(20);

    if (memories?.length) {
      sections.push(
        `Memorias activas:\n${memories.map((m) => `- [${m.type}] ${m.title}: ${m.content}`).join("\n")}`
      );
    }
  }

  const { data: checkIns } = await client
    .from("check_ins")
    .select("summary, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(3);

  if (checkIns?.length) {
    sections.push(
      `Check-ins recientes:\n${checkIns.map((c) => `- ${c.created_at}: ${c.summary ?? "Sin resumen"}`).join("\n")}`
    );
  }

  return sections.join("\n\n");
}

export async function getRecentMessages(
  client: TypedSupabaseClient,
  conversationId: string,
  limit = 20
) {
  const { data } = await client
    .from("messages")
    .select("role, content")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(limit);

  return data ?? [];
}
