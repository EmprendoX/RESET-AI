import { NextResponse } from "next/server";
import OpenAI from "openai";
import { requireUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");
  return new OpenAI({ apiKey });
}

// Recibe texto y devuelve audio mp3 con la voz del coach (TTS).
export async function POST(request: Request) {
  try {
    await requireUser();
    const body = await request.json();
    const input = typeof body?.text === "string" ? body.text.slice(0, 4000).trim() : "";
    if (!input) return NextResponse.json({ error: "Texto faltante" }, { status: 400 });

    const openai = getOpenAI();
    const speech = await openai.audio.speech.create({
      model: process.env.OPENAI_TTS_MODEL ?? "tts-1",
      voice: (process.env.OPENAI_TTS_VOICE ?? "alloy") as "alloy",
      input,
    });
    const arrayBuffer = await speech.arrayBuffer();
    return new Response(arrayBuffer, {
      status: 200,
      headers: { "Content-Type": "audio/mpeg", "Cache-Control": "no-store" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    const status = msg.includes("OPENAI_API_KEY") ? 503 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}
