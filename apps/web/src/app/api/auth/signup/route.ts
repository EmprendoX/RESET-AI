import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { signupSchema } from "@ai-coach/db";
import { createServiceClient, emitEvent, ensureCoachProfile, ensureCreatorWorkspace } from "@ai-coach/db";
import { generateIdempotencyKey } from "@ai-coach/shared";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { name: parsed.data.name } },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (data.user) {
    const service = createServiceClient();
    const profileUser = {
      id: data.user.id,
      email: data.user.email ?? parsed.data.email,
      name: parsed.data.name,
    };
    await ensureCoachProfile(service, profileUser);
    await ensureCreatorWorkspace(service, profileUser);
    await emitEvent(service, {
      userId: data.user.id,
      eventType: "user_signed_up",
      idempotencyKey: generateIdempotencyKey("user_signed_up", data.user.id),
    });
  }

  return NextResponse.json({ user: data.user });
}
