import { NextResponse } from "next/server";
import { runAdminTest } from "@ai-coach/agent";
import { createServiceClient } from "@ai-coach/db";
import { requireAdmin } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin();
    const body = await request.json();
    const { user_id, message } = body;

    if (!user_id || !message) {
      return NextResponse.json({ error: "user_id and message required" }, { status: 400 });
    }

    const service = createServiceClient();
    const result = await runAdminTest(service, user_id, message);

    return NextResponse.json({
      response: result.content,
      system_prompt: result.systemPrompt,
      user_context: result.userContext,
      tokens_used: result.tokensUsed,
      admin_id: admin.id,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
