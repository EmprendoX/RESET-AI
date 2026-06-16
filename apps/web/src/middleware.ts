import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

// ============================================================
// Gate de autenticación controlado por AUTH_ENABLED.
//   AUTH_ENABLED != "true"  → modo PROTOTIPO: sin login, datos mock (no rompe el demo).
//   AUTH_ENABLED == "true"  → auth real + roles (creador / miembro).
// Activá el flag SOLO después de aplicar las migraciones y exponer el schema ai_coach.
// ============================================================

const AUTH_ENABLED = process.env.AUTH_ENABLED === "true";
const PUBLIC = ["/login", "/signup"];

export async function middleware(request: NextRequest) {
  if (!AUTH_ENABLED) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC.some((p) => path.startsWith(p));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: "ai_coach" },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: Record<string, unknown> }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Sin sesión: a login (salvo páginas públicas).
  if (!user && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Con sesión en página de auth: al inicio.
  if (user && isPublic) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // /studio/** requiere rol de creador.
  if (user && path.startsWith("/studio")) {
    const { data: membership } = await supabase
      .from("memberships")
      .select("id")
      .eq("user_id", user.id)
      .eq("role", "creator")
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (!membership) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
