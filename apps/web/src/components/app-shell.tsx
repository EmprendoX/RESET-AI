"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { user } from "@/lib/mock-data";

type Item = { href: string; label: string; icon: ReactNode };

function Icon({ d }: { d: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}

const nav: Item[] = [
  { href: "/", label: "Inicio", icon: <Icon d="M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10" /> },
  { href: "/chat", label: "Coach", icon: <Icon d="M21 15a2 2 0 0 1-2 2H8l-5 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /> },
  { href: "/habits", label: "Hábitos", icon: <Icon d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /> },
  { href: "/tasks", label: "Tareas", icon: <Icon d="M9 6h11M9 12h11M9 18h11M5 6v.01M5 12v.01M5 18v.01" /> },
  { href: "/notes", label: "Notas", icon: <Icon d="M4 4h12l4 4v12H4zM14 4v5h5M8 13h8M8 17h5" /> },
  { href: "/progress", label: "Progreso", icon: <Icon d="M3 3v18h18M7 14l3-4 4 3 5-7" /> },
  { href: "/studio/persona", label: "Studio", icon: <Icon d="M5 3l1.5 3.5L10 8 6.5 9.5 5 13 3.5 9.5 0 8l3.5-1.5zM18 10l1 2.5 2.5 1-2.5 1L18 17l-1-2.5-2.5-1 2.5-1zM13 2l.8 2 2 .8-2 .8L13 8l-.8-2-2-.8 2-.8z" /> },
  { href: "/settings", label: "Ajustes", icon: <Icon d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 13a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2V21a2 2 0 1 1-4 0v-.1A1.7 1.7 0 0 0 6.8 19l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.1A1.7 1.7 0 0 0 5 6.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H10A1.7 1.7 0 0 0 11 3.1V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V10a1.7 1.7 0 0 0 1.6 1h.1a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /> },
];

const mobileNav = nav.filter((n) => ["/", "/chat", "/habits", "/tasks", "/notes"].includes(n.href));

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <Image src="/logo.svg" alt="RESET-ORDER" width={38} height={38} className="rounded-xl" />
      <div className="leading-tight">
        <div className="ro-wordmark text-sm text-ink">RESET-ORDER</div>
        <div className="text-[10px] uppercase tracking-widest text-accent">Coach</div>
      </div>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    router.push("/login");
  }

  return (
    <div className="relative z-10 flex min-h-screen">
      {/* Sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border-soft bg-surface/60 p-5 backdrop-blur md:flex">
        <div className="mb-8 px-1">
          <Brand />
        </div>

        <nav className="space-y-1">
          {nav.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                  active
                    ? "bg-accent/15 text-ink ring-1 ring-accent/30"
                    : "text-ink-muted hover:bg-surface-2 hover:text-ink"
                }`}
              >
                <span className={active ? "text-accent" : ""}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto">
          <div className="mb-3 flex items-center gap-3 rounded-xl border border-border-soft bg-surface-2 p-3">
            <div className="grid h-9 w-9 place-items-center rounded-full ro-accent-gradient text-sm font-bold text-white">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0 leading-tight">
              <div className="truncate text-sm font-semibold text-ink">{user.name}</div>
              <div className="truncate text-[11px] text-ink-muted">{user.level}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full rounded-xl px-3 py-2 text-left text-xs text-ink-faint transition hover:bg-surface-2 hover:text-ink-muted"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Topbar (mobile) */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border-soft bg-bg/80 px-4 py-3 backdrop-blur md:hidden">
          <Brand />
          <div className="grid h-8 w-8 place-items-center rounded-full ro-accent-gradient text-xs font-bold text-white">
            {user.name.charAt(0)}
          </div>
        </header>

        <main className="flex-1 px-4 pb-28 pt-5 md:px-10 md:pb-12 md:pt-10">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>

      {/* Bottom nav (mobile) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-border-soft bg-surface/90 px-2 py-2 backdrop-blur md:hidden">
        {mobileNav.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 rounded-lg px-3 py-1 text-[10px] font-medium transition ${
                active ? "text-accent" : "text-ink-faint"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
