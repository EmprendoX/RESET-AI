"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button, Card, Input, PageHeader } from "@ai-coach/ui";
import { user } from "@/lib/mock-data";

const STYLES = [
  { id: "directo", label: "Directo" },
  { id: "suave", label: "Suave" },
  { id: "estrategico", label: "Estratégico" },
  { id: "practico", label: "Práctico" },
  { id: "motivador", label: "Motivador" },
];

export default function SettingsPage() {
  const [name, setName] = useState(user.name);
  const [style, setStyle] = useState("practico");
  const [memory, setMemory] = useState(true);
  const [saved, setSaved] = useState(false);

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <AppShell>
      <PageHeader title="Ajustes" subtitle="Configurá tu coach y tu cuenta." />

      <div className="mx-auto max-w-xl space-y-5">
        <Card>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-ink-muted">Perfil</h3>
          <label className="mb-1.5 block text-sm font-medium">Nombre</label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
          <label className="mb-1.5 mt-4 block text-sm font-medium">Correo</label>
          <Input value={user.email} disabled className="opacity-60" />
        </Card>

        <Card>
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-ink-muted">Coach</h3>
          <label className="mb-2 block text-sm font-medium">Estilo del coach</label>
          <div className="flex flex-wrap gap-2">
            {STYLES.map((s) => (
              <button
                key={s.id}
                onClick={() => setStyle(s.id)}
                className={`rounded-xl border px-3.5 py-1.5 text-sm transition ${
                  style === s.id
                    ? "border-accent/50 bg-accent/15 text-ink"
                    : "border-border bg-surface-2 text-ink-muted hover:text-ink"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <label className="mt-5 flex items-center justify-between">
            <span className="text-sm">
              <span className="font-medium">Memoria personalizada</span>
              <span className="block text-xs text-ink-muted">El coach recuerda lo que vos autorices.</span>
            </span>
            <button
              onClick={() => setMemory((v) => !v)}
              className={`relative h-6 w-11 rounded-full transition ${memory ? "bg-accent" : "bg-surface-3"}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${memory ? "left-[22px]" : "left-0.5"}`} />
            </button>
          </label>
        </Card>

        <div className="flex items-center gap-3">
          <Button onClick={save}>Guardar cambios</Button>
          {saved && <span className="text-sm text-success">✓ Guardado</span>}
        </div>
      </div>
    </AppShell>
  );
}
