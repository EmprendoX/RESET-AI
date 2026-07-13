import { NextResponse } from "next/server";
import { createClient, requireUser } from "@/lib/supabase/server";
import { checkRateLimit, getActiveCreatorId } from "@ai-coach/db";
import { getDailyMessageLimit } from "@ai-coach/config";
import { answerWithKnowledge } from "@ai-coach/agent";
import type { PersonaInput } from "@ai-coach/prompts";

function __coachLog(line: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fs = require("fs");
    fs.appendFileSync(process.cwd() + "/coach-debug.log", new Date().toISOString() + " " + line + "\n");
  } catch {}
}

interface HistoryItem {
  role: "user" | "assistant";
  content: string;
}

export async function POST(request: Request) {
  __coachLog("ask:hit");
  try {
    const user = await requireUser();
    __coachLog("ask:user " + user.id);
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

    let conversationId =
      typeof body?.conversation_id === "string" ? body.conversation_id : undefined;

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
          objective: row.objective,
          role: row.role,
          targetAudience: row.target_audience,
          businessContext: row.business_context,
          instructions: row.instructions,
          workflow: row.workflow,
          outputFormat: row.output_format,
          qualityCriteria: row.quality_criteria,
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

    // Persistencia del historial (RLS: user_id = auth.uid()). No bloquea la respuesta si falla.
    try {
      if (!conversationId) {
        const { data: conv } = await supabase
          .from("conversations")
          .insert({ user_id: user.id, title: message.slice(0, 50) })
          .select("id")
          .single();
        conversationId = conv?.id as string | undefined;
      }
      if (conversationId) {
        await supabase.from("messages").insert([
          { conversation_id: conversationId, user_id: user.id, role: "user", content: message },
          {
            conversation_id: conversationId,
            user_id: user.id,
            role: "assistant",
            content: answer.content,
            metadata_json: { citations: answer.citations },
          },
        ]);
        await supabase
          .from("conversations")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", conversationId);
      }
    } catch (e) {
      __coachLog("ask:persist-err " + (e instanceof Error ? e.message : String(e)));
    }

    __coachLog("ask:ok len=" + (answer.content?.length ?? 0) + " chunks=" + answer.chunksUsed);
    return NextResponse.json({
      reply: answer.content,
      citations: answer.citations,
      conversation_id: conversationId,
    });
  } catch (err) {
    __coachLog("ask:ERR " + (err instanceof Error ? (err.stack ?? err.message) : String(err)));
    const msg = err instanceof Error ? err.message : "Error";
    const status = msg.includes("OPENAI_API_KEY") ? 503 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}
