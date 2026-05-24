import { NextResponse } from "next/server";
import { createClient, requireUser } from "@/lib/supabase/server";
import {
  chatMessageSchema,
  createServiceClient,
  checkRateLimit,
  emitEvent,
} from "@ai-coach/db";
import { runCoachChat } from "@ai-coach/agent";
import { getFeatureFlag, getDailyMessageLimit } from "@ai-coach/config";
import { generateIdempotencyKey } from "@ai-coach/shared";

export async function POST(request: Request) {
  if (!getFeatureFlag("AI_COACH_CHAT_ENABLED")) {
    return NextResponse.json({ error: "Chat disabled" }, { status: 503 });
  }

  try {
    const user = await requireUser();
    const body = await request.json();
    const parsed = chatMessageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }

    const service = createServiceClient();
    const limit = getDailyMessageLimit();
    const { allowed } = await checkRateLimit(service, user.id, limit);
    if (!allowed) {
      return NextResponse.json({ error: "Daily message limit reached" }, { status: 429 });
    }

    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("coach_profiles")
      .select("coaching_style, memory_enabled, onboarding_completed")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!profile?.onboarding_completed) {
      return NextResponse.json({ error: "Complete onboarding first" }, { status: 403 });
    }

    let conversationId = parsed.data.conversation_id;
    if (!conversationId) {
      const { data: conv, error } = await supabase
        .from("conversations")
        .insert({ user_id: user.id, title: parsed.data.message.slice(0, 50) })
        .select()
        .single();
      if (error || !conv) {
        return NextResponse.json({ error: "Could not create conversation" }, { status: 500 });
      }
      conversationId = conv.id;
    }

    if (!conversationId) {
      return NextResponse.json({ error: "Could not create conversation" }, { status: 500 });
    }

    await supabase.from("messages").insert({
      conversation_id: conversationId,
      user_id: user.id,
      role: "user",
      content: parsed.data.message,
    });

    let result;
    try {
      result = await runCoachChat(service, {
        userId: user.id,
        conversationId,
        userMessage: parsed.data.message,
        coachingStyle: profile.coaching_style ?? "practico",
        memoryEnabled: profile.memory_enabled ?? false,
      });
    } catch {
      return NextResponse.json(
        {
          error:
            "No pude generar una respuesta en este momento. Tu información está guardada. Intenta de nuevo.",
        },
        { status: 503 }
      );
    }

    await supabase.from("messages").insert({
      conversation_id: conversationId,
      user_id: user.id,
      role: "assistant",
      content: result.content,
      metadata_json: { toolsUsed: result.toolsUsed, tokensUsed: result.tokensUsed },
    });

    await supabase
      .from("conversations")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", conversationId);

    await emitEvent(service, {
      userId: user.id,
      eventType: "chat_message_sent",
      objectType: "conversation",
      objectId: conversationId,
      idempotencyKey: generateIdempotencyKey("chat_message_sent", user.id, conversationId),
    });

    return NextResponse.json({
      conversation_id: conversationId,
      message: result.content,
      tools_used: result.toolsUsed,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
