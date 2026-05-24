import { NextResponse } from "next/server";
import { createClient, requireUser } from "@/lib/supabase/server";
import { settingsUpdateSchema } from "@ai-coach/db";

export async function GET() {
  try {
    const user = await requireUser();
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("coach_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    return NextResponse.json({ settings: profile });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireUser();
    const body = await request.json();
    const parsed = settingsUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid settings" }, { status: 400 });
    }

    const supabase = await createClient();
    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (parsed.data.memory_enabled !== undefined) update.memory_enabled = parsed.data.memory_enabled;
    if (parsed.data.coaching_style) update.coaching_style = parsed.data.coaching_style;
    if (parsed.data.name) update.name = parsed.data.name;
    if (parsed.data.language) update.language = parsed.data.language;
    if (parsed.data.timezone) update.timezone = parsed.data.timezone;

    const { data, error } = await supabase
      .from("coach_profiles")
      .update(update)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ settings: data });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
