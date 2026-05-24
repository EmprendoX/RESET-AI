import { NextResponse } from "next/server";
import { createServiceClient } from "@ai-coach/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    const service = createServiceClient();
    const { data, error } = await service
      .from("feature_flags")
      .select("*")
      .order("key");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ flags: data });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { key, enabled } = body;
    if (!key || typeof enabled !== "boolean") {
      return NextResponse.json({ error: "key and enabled required" }, { status: 400 });
    }

    const service = createServiceClient();
    const { data, error } = await service
      .from("feature_flags")
      .update({ enabled, updated_at: new Date().toISOString() })
      .eq("key", key)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ flag: data });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
