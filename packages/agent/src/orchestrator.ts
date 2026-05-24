import OpenAI from "openai";
import { getOpenAiModel } from "@ai-coach/config";
import { buildCoachSystemPrompt, buildOnboardingCompletionPrompt } from "@ai-coach/prompts";
import type { TypedSupabaseClient } from "@ai-coach/db";
import { buildUserContext, getRecentMessages } from "./context-builder";
import { toolDefinitions, executeTool, type ToolResult } from "./tools";

export interface ChatResult {
  content: string;
  toolsUsed: ToolResult[];
  tokensUsed?: number;
}

export interface OnboardingResult {
  diagnosis: string;
  sevenDayPlan: Array<{ day: number; title: string; description: string }>;
  initialRecommendations: Array<{
    type: string;
    title: string;
    description: string;
    reason: string;
  }>;
  initialGoal: { title: string; description: string; category: string };
}

function getOpenAI(): OpenAI {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not configured");
  return new OpenAI({ apiKey });
}

export async function runCoachChat(
  client: TypedSupabaseClient,
  params: {
    userId: string;
    conversationId: string;
    userMessage: string;
    coachingStyle: string;
    memoryEnabled: boolean;
  }
): Promise<ChatResult> {
  const openai = getOpenAI();
  const userContext = await buildUserContext(client, params.userId);
  const systemPrompt = buildCoachSystemPrompt({
    coachingStyle: params.coachingStyle,
    memoryEnabled: params.memoryEnabled,
    userContext,
  });

  const recentMessages = await getRecentMessages(client, params.conversationId);
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...recentMessages.map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user", content: params.userMessage },
  ];

  const toolsUsed: ToolResult[] = [];
  let response = await openai.chat.completions.create({
    model: getOpenAiModel(),
    messages,
    tools: toolDefinitions,
    tool_choice: "auto",
  });

  let assistantMessage = response.choices[0]?.message;

  while (assistantMessage?.tool_calls?.length) {
    messages.push(assistantMessage);

    for (const toolCall of assistantMessage.tool_calls) {
      const args = JSON.parse(toolCall.function.arguments || "{}");
      const result = await executeTool(
        client,
        params.userId,
        params.memoryEnabled,
        toolCall.function.name,
        args
      );
      toolsUsed.push(result);
      messages.push({
        role: "tool",
        tool_call_id: toolCall.id,
        content: JSON.stringify(result.result),
      });
    }

    response = await openai.chat.completions.create({
      model: getOpenAiModel(),
      messages,
      tools: toolDefinitions,
      tool_choice: "auto",
    });
    assistantMessage = response.choices[0]?.message;
  }

  return {
    content:
      assistantMessage?.content ??
      "No pude generar una respuesta en este momento. Tu información está guardada. Intenta de nuevo.",
    toolsUsed,
    tokensUsed: response.usage?.total_tokens,
  };
}

export async function generateOnboardingArtifacts(
  answersSummary: string
): Promise<OnboardingResult> {
  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: getOpenAiModel(),
    messages: [
      {
        role: "system",
        content: "Genera JSON válido según las instrucciones. Responde solo con JSON.",
      },
      { role: "user", content: buildOnboardingCompletionPrompt(answersSummary) },
    ],
    response_format: { type: "json_object" },
  });

  const raw = response.choices[0]?.message?.content ?? "{}";
  const parsed = JSON.parse(raw);

  return {
    diagnosis: parsed.diagnosis ?? "",
    sevenDayPlan: parsed.seven_day_plan ?? [],
    initialRecommendations: parsed.initial_recommendations ?? [],
    initialGoal: parsed.initial_goal ?? {
      title: "Meta inicial",
      description: "",
      category: "general",
    },
  };
}

export async function generateCheckInSummary(
  answers: Record<string, string>
): Promise<string> {
  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: getOpenAiModel(),
    messages: [
      {
        role: "system",
        content:
          "Resume el check-in del usuario en 2-3 párrafos útiles para el coach. Sé concreto.",
      },
      {
        role: "user",
        content: JSON.stringify(answers, null, 2),
      },
    ],
  });
  return (
    response.choices[0]?.message?.content ??
    "Check-in registrado. Continúa con tu meta principal."
  );
}

export async function runAdminTest(
  client: TypedSupabaseClient,
  userId: string,
  testMessage: string
): Promise<ChatResult & { systemPrompt: string; userContext: string }> {
  const { data: profile } = await client
    .from("coach_profiles")
    .select("coaching_style, memory_enabled")
    .eq("user_id", userId)
    .maybeSingle();

  const userContext = await buildUserContext(client, userId);
  const systemPrompt = buildCoachSystemPrompt({
    coachingStyle: profile?.coaching_style ?? "practico",
    memoryEnabled: profile?.memory_enabled ?? false,
    userContext,
  });

  const openai = getOpenAI();
  const response = await openai.chat.completions.create({
    model: getOpenAiModel(),
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: testMessage },
    ],
  });

  return {
    content: response.choices[0]?.message?.content ?? "",
    toolsUsed: [],
    tokensUsed: response.usage?.total_tokens,
    systemPrompt,
    userContext,
  };
}
