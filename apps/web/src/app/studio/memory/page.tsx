"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { StudioTabs } from "@/components/studio-tabs";
import { Badge, Card } from "@ai-coach/ui";
import {
  members as membersSeed,
  memoryItems as seed,
  type Member,
  type MemoryItem,
} from "@/lib/mock-data";

const typeColor: Record<string, string> = {
  meta: "#2f7bff",
  bloqueo: "#ff5470",
  preferencia: "#b07bff",
  contexto: "#ffb020",
  hecho: "#2fd486",
  estilo: "#5b9bff",
  marca: "#5b9bff",
};

type View = "persona" | "miembro";

export default function MemoryPage() {
  const [items, setItems] = useState<MemoryItem[]>(seed);
  const [members, setMembers] = useState<Member[]>(membersSeed);
  const [view, setView] = useState<View>("miembro");
  const [activeMember, setActiveMember] = useState(membersSeed[0]?.id ?? "");

  // Carga memorias reales si hay sesión; en prototipo usa el seed.
  useEffect(() => {
    let cancel = false;
    fetch("/api/studio/memory")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancel || !d) return;
        if (Array.isArray(d.items)) setItems(d.items);
        if (Array.isArray(d.members)) {
          setMembers(d.members);
          if (d.members[0]) setActiveMember(d.members[0].id);
        }
      })
      .catch(() => {});
    return () => {
      cancel = true;
    };
  }, []);

  function toggleConsent(id: string) {
    let next = false;
    setItems((prev) =>
      prev.map((m) => {
        if (m.id !== id) return m;
        next = !m.consent;
        return { ...m, consent: next };
      })
    );
    fetch(`/api/studio/memory/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ consent: next }),
    }).catch(() => {});
  }
  function remove(id: string) {
    setItems((prev) => prev.filter((m) => m.id !== id));
    fetch(`/api/studio/memory/${id}`, { method: "DELETE" }).catch(() => {});
  }

  const personaMem = items.filter((m) => m.scope === "persona");
  const memberMem = items.filter((m) => m.scope === "miembro" && m.memberId === activeMember);
  const member = members.find((m) => m.id === activeMember);

  return (
    <AppShell>
      <StudioTabs />

      <div className="mb-5">
        <p className="text-xs uppercase tracking-widest text-accent">Creator Studio</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Memoria</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Lo que tu coach recuerda — de tu marca y de cada miembro. El miembro decide qué se guarda.
        </p>
      </div>

      {/* switch persona / miembro */}
      <div className="mb-5 inline-flex rounded-xl border border-border bg-surface p-1">
        <button onClick={() => setView("miembro")} className={tabCls(view === "miembro")}>👤 Por miembro</button>
        <button onClick={() => setView("persona")} className={tabCls(view === "persona")}>🧭 De la persona</button>
      </div>

      {view === "persona" ? (
        <div className="space-y-2.5">
          <p className="text-sm text-ink-muted">Reglas y hechos sobre tu marca que el coach aplica con todos.</p>
          {personaMem.map((m) => (
            <MemoryCard key={m.id} item={m} onToggle={() => toggleConsent(m.id)} onRemove={() => remove(m.id)} />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* lista de miembros */}
          <div>
            <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-ink-muted">Comunidad</h3>
            <div className="space-y-2">
              {members.map((mb) => {
                const active = mb.id === activeMember;
                return (
                  <button
                    key={mb.id}
                    onClick={() => setActiveMember(mb.id)}
                    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                      active ? "border-accent/50 bg-accent/15" : "border-border-soft bg-surface hover:bg-surface-2"
                    }`}
                  >
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full ro-accent-gradient text-sm font-bold text-white">{mb.initial}</div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold">{mb.name}</div>
                      <div className="text-[11px] text-ink-muted">{mb.memories} recuerdos · {mb.joined}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* memorias del miembro */}
          <div className="lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold">Lo que el coach recuerda de {member?.name ?? "—"}</h3>
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">VISTA MIEMBRO</span>
            </div>
            <div className="space-y-2.5">
              {memberMem.map((m) => (
                <MemoryCard key={m.id} item={m} onToggle={() => toggleConsent(m.id)} onRemove={() => remove(m.id)} />
              ))}
              {memberMem.length === 0 && (
                <Card className="text-center text-sm text-ink-muted">Sin recuerdos guardados todavía.</Card>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function MemoryCard({
  item,
  onToggle,
  onRemove,
}: {
  item: MemoryItem;
  onToggle: () => void;
  onRemove: () => void;
}) {
  return (
    <Card className="!p-4">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-2">
            <Badge color={typeColor[item.type] ?? "#9aa3b4"}>{item.type}</Badge>
            <span className="text-[11px] text-ink-faint">{item.source} · {item.date}</span>
          </div>
          <p className="text-sm text-ink/90">{item.content}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <button
            onClick={onToggle}
            title="Consentimiento del miembro"
            className={`relative h-5 w-9 rounded-full transition ${item.consent ? "bg-success" : "bg-surface-3"}`}
          >
            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${item.consent ? "left-[18px]" : "left-0.5"}`} />
          </button>
          <button onClick={onRemove} className="text-[11px] text-ink-faint hover:text-danger">Olvidar</button>
        </div>
      </div>
    </Card>
  );
}

function tabCls(active: boolean) {
  return `rounded-lg px-4 py-1.5 text-sm font-semibold transition ${active ? "bg-surface-3 text-ink" : "text-ink-muted"}`;
}
