import OpenAI from "openai";
import { getOpenAiModel } from "@ai-coach/config";
import { buildRagSystemPrompt, type PersonaInput } from "@ai-coach/prompts";
import type { TypedSupabaseClient } from "@ai-coach/db";

const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL ?? "text-embedding-3-small";

function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");
  return new OpenAI({ apiKey });
}

// --- Chunking ------------------------------------------------

export interface Chunk {
  content: string;
  lessonLabel?: string;
  tokenCount: number;
}

// Parte el texto en fragmentos con solapamiento. Respeta separadores de lección si
// el texto los marca con líneas tipo "## Lección 3" o "Lección 3:".
export function chunkText(
  text: string,
  opts?: { size?: number; overlap?: number }
): Chunk[] {
  const size = opts?.size ?? 1200;
  const overlap = opts?.overlap ?? 200;
  const clean = text.replace(/\r/g, "").trim();
  if (!clean) return [];

  const chunks: Chunk[] = [];
  let i = 0;
  let lessonLabel: string | undefined;

  while (i < clean.length) {
    const end = Math.min(i + size, clean.length);
    const slice = clean.slice(i, end).trim();
    if (slice) {
      const match = slice.match(/(lecci[oó]n\s*\d+|paso\s*\d+|m[oó]dulo\s*\d+)/i);
      if (match) lessonLabel = match[1];
      chunks.push({ content: slice, lessonLabel, tokenCount: Math.ceil(slice.length / 4) });
    }
    if (end >= clean.length) break;
    i = end - overlap;
  }
  return chunks;
}

// --- Embeddings ----------------------------------------------

export async function embedTexts(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];
  const openai = getOpenAI();
  const res = await openai.embeddings.create({ model: EMBEDDING_MODEL, input: texts });
  return res.data.map((d) => d.embedding as number[]);
}

export async function embedText(text: string): Promise<number[]> {
  const [v] = await embedTexts([text]);
  return v;
}

// --- Recuperación (usada en Fase 4: chat con citas) ----------

export interface RetrievedChunk {
  content: string;
  lesson_label: string | null;
  source_id: string;
  similarity: number;
}

export async function retrieveChunks(
  client: TypedSupabaseClient,
  creatorId: string,
  query: string,
  k = 6,
  minSimilarity = 0.2
): Promise<RetrievedChunk[]> {
  const embedding = await embedText(query);
  const { data, error } = await client.rpc("match_kb_chunks", {
    p_creator_id: creatorId,
    p_query: JSON.stringify(embedding),
    p_k: k,
  });
  if (error) throw error;
  return ((data as RetrievedChunk[]) ?? []).filter((c) => c.similarity >= minSimilarity);
}

// --- Memoria del miembro (Fase 5) ----------------------------

export interface MemoryHit {
  type: string;
  content: string;
  similarity: number;
}

export async function retrieveMemories(
  client: TypedSupabaseClient,
  creatorId: string,
  memberUserId: string,
  query: string,
  k = 5,
  minSimilarity = 0.15
): Promise<MemoryHit[]> {
  const embedding = await embedText(query);
  const { data, error } = await client.rpc("match_coach_memories", {
    p_creator_id: creatorId,
    p_member_user_id: memberUserId,
    p_query: JSON.stringify(embedding),
    p_k: k,
  });
  if (error) throw error;
  return ((data as MemoryHit[]) ?? []).filter((m) => m.similarity >= minSimilarity);
}

// Guarda una memoria con su embedding (consent lo decide quien llama).
export async function storeMemory(
  client: TypedSupabaseClient,
  params: {
    creatorId: string;
    scope: "persona" | "miembro";
    memberUserId?: string | null;
    type: string;
    content: string;
    source?: string;
    consent?: boolean;
  }
): Promise<void> {
  const embedding = await embedText(params.content);
  const { error } = await client.from("coach_memories").insert({
    creator_id: params.creatorId,
    scope: params.scope,
    member_user_id: params.memberUserId ?? null,
    type: params.type,
    content: params.content,
    source: params.source ?? null,
    consent: params.consent ?? false,
    embedding: JSON.stringify(embedding),
  });
  if (error) throw error;
}

// --- Chat del miembro con RAG (Fase 4) -----------------------

export interface CoachCitation {
  source: string;
  lesson: string;
}

export interface CoachAnswer {
  content: string;
  citations: CoachCitation[];
  chunksUsed: number;
  memoriesUsed: number;
  tokensUsed?: number;
}

function getOpenAIClient(): OpenAI {
  return getOpenAI();
}

// Responde como el coach del creador, fundado en su base de conocimiento, con citas.
export async function answerWithKnowledge(params: {
  client: TypedSupabaseClient;
  creatorId: string;
  persona: PersonaInput;
  message: string;
  history?: { role: "user" | "assistant"; content: string }[];
  memberUserId?: string | null;
}): Promise<CoachAnswer> {
  const { client, creatorId, persona, message, history = [], memberUserId } = params;

  const chunks = await retrieveChunks(client, creatorId, message, 6, 0.2);

  // Memoria del miembro (con consentimiento). No bloquea si falla.
  let memoryBlock = "";
  let memoriesUsed = 0;
  if (memberUserId) {
    try {
      const mems = await retrieveMemories(client, creatorId, memberUserId, message, 5);
      memoriesUsed = mems.length;
      if (mems.length) {
        memoryBlock = mems.map((m) => `- (${m.type}) ${m.content}`).join("\n");
      }
    } catch {
      // sin memorias / sin índice todavía: seguimos sin ellas
    }
  }

  // Títulos de las fuentes para las citas.
  const sourceIds = [...new Set(chunks.map((c) => c.source_id))];
  const titles: Record<string, string> = {};
  if (sourceIds.length) {
    const { data } = await client
      .from("knowledge_sources")
      .select("id, title")
      .in("id", sourceIds);
    for (const s of (data as { id: string; title: string }[]) ?? []) titles[s.id] = s.title;
  }

  const context = chunks
    .map(
      (c, i) =>
        `[${i + 1}] (${titles[c.source_id] ?? "Fuente"}${c.lesson_label ? ` · ${c.lesson_label}` : ""})\n${c.content}`
    )
    .join("\n\n");

  const system = buildRagSystemPrompt(persona, context, chunks.length > 0, memoryBlock);

  const openai = getOpenAIClient();
  const res = await openai.chat.completions.create({
    model: getOpenAiModel(),
    temperature: 0.6,
    messages: [
      { role: "system", content: system },
      ...history.slice(-6).map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ],
  });

  const content = res.choices[0]?.message?.content ?? "";
  const tokensUsed = res.usage?.total_tokens;

  // Citas únicas por fuente + lección.
  const seen = new Set<string>();
  const citations: CoachCitation[] = [];
  for (const c of chunks) {
    const key = `${c.source_id}|${c.lesson_label ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    citations.push({ source: titles[c.source_id] ?? "Fuente", lesson: c.lesson_label ?? "" });
  }

  return {
    content,
    citations,
    chunksUsed: chunks.length,
    memoriesUsed,
    tokensUsed,
  };
}
