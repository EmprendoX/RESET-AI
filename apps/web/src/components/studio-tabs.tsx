"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/studio/persona", label: "Persona", icon: "🧭" },
  { href: "/studio/knowledge", label: "Conocimiento", icon: "📚" },
  { href: "/studio/memory", label: "Memoria", icon: "🧠" },
];

export function StudioTabs() {
  const pathname = usePathname();
  return (
    <div className="mb-6 flex gap-2 overflow-x-auto">
      {tabs.map((t) => {
        const active = pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex shrink-0 items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
              active
                ? "border-accent/50 bg-accent/15 text-ink"
                : "border-border bg-surface text-ink-muted hover:text-ink"
            }`}
          >
            <span>{t.icon}</span>
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
