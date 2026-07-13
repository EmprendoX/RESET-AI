import { NextResponse } from "next/server";
import OpenAI, { toFile } from "openai";
import { requireUser } from "@/lib/supabase/server";

export const runtime = "nodejs";

function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");
  return new OpenAI({ apiKey });
}

// Recibe audio grabado en el navegador y devuelve la transcripción (Whisper).
export async function POST(request: Request) {
  try {
    await requireUser();
    const form = await request.formData();
    const audio = form.get("audio");
    if (!(audio instanceof Blob)) {
      return NextResponse.json({ error: "Audio faltante" }, { status: 400 });
    }
    const openai = getOpenAI();
    const buf = Buffer.from(await audio.arrayBuffer());
    const file = await toFile(buf, "audio.webm", { type: audio.type || "audio/webm" });
    const res = await openai.audio.transcriptions.create({
      file,
      model: process.env.OPENAI_TRANSCRIBE_MODEL ?? "whisper-1",
    });
    return NextResponse.json({ text: res.text ?? "" });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error";
    const status = msg.includes("OPENAI_API_KEY") ? 503 : 401;
    return NextResponse.json({ error: msg }, { status });
  }
}
