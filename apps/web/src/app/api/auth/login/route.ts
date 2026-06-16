import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, createServiceClient, ensureCoachProfile, ensureCreatorWorkspace } from "@ai-coach/db";

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 401 });
  }

  const service = createServiceClient();
  const profileUser = {
    id: data.user.id,
    email: data.user.email ?? parsed.data.email,
    name: (data.user.user_metadata?.name as string | undefined) ?? null,
  };
  await ensureCoachProfile(service, profileUser);
  await ensureCreatorWorkspace(service, profileUser);

  await supabase
    .from("users_profile")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", data.user.id);

  return NextResponse.json({ user: data.user });
}
