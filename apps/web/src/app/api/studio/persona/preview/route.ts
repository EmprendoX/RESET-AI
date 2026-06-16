import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { personaPreviewSchema } from "@ai-coach/db";
import { previewPersonaReply } from "@ai-coach/agent";
import type { PersonaInput } from "@ai-coach/prompts";

export async function POST(request: Request) {
  try {
    await requireUser();
    const body = await request.json();
    const parsed = personaPreviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const p = parsed.data.persona;
    const persona: PersonaInput = {
      coachName: p.coach_name,
      tagline: p.tagline ?? null,
      tone: p.tone ?? null,
      voice: p.voice ?? null,
      values: p.values ?? null,
      signaturePhrases: p.signature_phrases ?? null,
      dos: p.dos ?? null,
      donts: p.donts ?? null,
      methodology: p.methodology ?? null,
      sampleReplies: p.sample_replies ?? null,
    };

    const reply = await previewPersonaReply(persona, parsed.data.message);
    return NextResponse.json({ reply });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    const status = msg.includes("OPENAI_API_KEY") ? 503 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}
