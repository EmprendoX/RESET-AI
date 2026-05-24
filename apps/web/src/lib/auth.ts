import { createClient, requireUser } from "@/lib/supabase/server";

export async function requireAdmin() {
  const user = await requireUser();
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("users_profile")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  const isAdmin = (profile as { is_admin: boolean } | null)?.is_admin;
  if (!isAdmin) {
    throw new Error("Forbidden");
  }

  return user;
}
