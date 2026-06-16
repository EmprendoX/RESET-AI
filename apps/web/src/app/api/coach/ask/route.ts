import { NextResponse } from "next/server";
import { createClient, requireUser } from "@/lib/supabase/server";
import { checkRateLimit, getActiveCreatorId } from "@ai-coach/db";
import { getDailyMessageLimit } from "@ai-coach/config";
import { answerWithKnowledge } from "@ai-coach/agent";
import type { PersonaInput } from "@ai-coach/prompts";

interface HistoryItem {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const message = typeof body?.message === "string" ? body.message.slice(0, 4000) : "";
    if (!message.trim()) {
      return NextResponse.json({ error: "Mensaje vacío" }, { status: 400 });
    }
    const history: HistoryItem[] = Array.isArray(body?.history)
      ? body.history
          .filter(
            (m: unknown): m is HistoryItem =>
              !!m &&
              typeof (m as HistoryItem).content === "string" &&
              ((m as HistoryItem).role === "user" || (m as HistoryItem).role === "assistant")
          )
          .slice(-6)
      : [];

    const supabase = await createClient();

    // Rate limit diario (control de costo de tokens/embeddings).
    const limit = getDailyMessageLimit();
    const { allowed, count } = await checkRateLimit(supabase, user.id, limit);
    if (!allowed) {
      return NextResponse.json(
        { error: `Llegaste al límite diario de ${limit} mensajes. Probá mañana.` },
        { status: 429 }
      );
    }

    const creatorId = await getActiveCreatorId(supabase, user.id);
    if (!creatorId) {
      return NextResponse.json({ error: "Sin coach asignado" }, { status: 400 });
    }

    const { data: row } = await supabase
      .from("personas")
      .select("*")
      .eq("creator_id", creatorId)
      .maybeSingle();

    const persona: PersonaInput = row
      ? {
          coachName: row.coach_name,
          tagline: row.tagline,
          tone: row.tone,
          voice: row.voice,
          values: row.values,
          signaturePhrases: row.signature_phrases,
          dos: row.dos,
          donts: row.donts,
          methodology: row.methodology,
          sampleReplies: row.sample_replies,
        }
      : { coachName: "Coach RESET-ORDER" };

    const started = Date.now();
    const answer = await answerWithKnowledge({
      client: supabase,
      creatorId,
      persona,
      message,
      history,
      memberUserId: user.id,
    });

    // Observabilidad: log estructurado (latencia, chunks, memorias, tokens, uso diario).
    console.log(
      JSON.stringify({
        evt: "coach_ask",
        creator: creatorId,
        ms: Date.now() - started,
        chunks: answer.chunksUsed,
        memories: answer.memoriesUsed,
        tokens: answer.tokensUsed ?? null,
        cites: answer.citations.length,
        daily: count,
      })
    );

    return NextResponse.json({ reply: answer.content, citations: answer.citations });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    const status = msg.includes("OPENAI_API_KEY") ? 503 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}
