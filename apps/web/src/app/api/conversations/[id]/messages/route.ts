import { NextResponse } from "next/server";
import { requireUser } from "@/lib/supabase/server";
import { chatMessageSchema } from "@ai-coach/db";
import { POST as chatPost } from "../../../chat/route";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser();
    const { id } = await params;
    const body = await request.json();
    const parsed = chatMessageSchema.safeParse({ ...body, conversation_id: id });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }

    const chatRequest = new Request(new URL("/api/chat", request.url), {
      method: "POST",
      headers: request.headers,
      body: JSON.stringify({ conversation_id: id, message: parsed.data.message }),
    });

    return chatPost(chatRequest);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
