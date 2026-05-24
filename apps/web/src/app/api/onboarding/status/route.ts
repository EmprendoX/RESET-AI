import { NextResponse } from "next/server";
import { createClient, requireUser } from "@/lib/supabase/server";

export async function GET() {
  try {
    const user = await requireUser();
    const supabase = await createClient();
    const { data } = await supabase
      .from("coach_profiles")
      .select("onboarding_completed")
      .eq("user_id", user.id)
      .maybeSingle();

    return NextResponse.json({
      completed: data?.onboarding_completed ?? false,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
