import OpenAI from "openai";
import { getOpenAiModel } from "@ai-coach/config";
import { buildPersonaPreviewPrompt, type PersonaInput } from "@ai-coach/prompts";

function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");
  return new OpenAI({ apiKey });
}

// "Probá tu clon": genera una respuesta con la personalidad dada, sin persistir nada.
export async function previewPersonaReply(
  persona: PersonaInput,
  message: string
): Promise<string> {
  const openai = getOpenAI();
  const res = await openai.chat.completions.create({
    model: getOpenAiModel(),
    temperature: 0.7,
    messages: [
      { role: "system", content: buildPersonaPreviewPrompt(persona) },
      { role: "user", content: message },
    ],
  });
  return res.choices[0]?.message?.content ?? "";
}
