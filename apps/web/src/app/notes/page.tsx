"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Badge, Button, Card, PageHeader, Tabs } from "@ai-coach/ui";
import { type Note } from "@/lib/mock-data";
import { addNote, useNotes } from "@/lib/notes-store";

const FILTERS = [
  { id: "todas", label: "Todas" },
  { id: "nota", label: "Notas" },
  { id: "conversacion", label: "Conversaciones" },
];

export default function NotesPage() {
  const notes = useNotes();
  const [filter, setFilter] = useState("todas");
  const [open, setOpen] = useState<Note | null>(null);
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  function create(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() && !body.trim()) return;
    addNote({ title, body });
    setTitle("");
    setBody("");
    setCreating(false);
  }

  const visible = notes.filter((n) => (filter === "todas" ? true : n.kind === filter));

  return (
    <AppShell>
      <PageHeader
        title="Notas"
        subtitle="Tu bloc de notas y las conversaciones que guardás del coach."
        action={<Button size="sm" onClick={() => setCreating((v) => !v)}>+ Nueva nota</Button>}
      />

      {creating && (
        <Card className="mb-5 ro-fade-up">
          <form onSubmit={create} className="space-y-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título"
              className="w-full rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-accent/70 focus:ring-2 focus:ring-accent/20"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Escribí acá…"
              rows={4}
              className="w-full rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-accent/70 focus:ring-2 focus:ring-accent/20"
            />
            <div className="flex gap-2">
              <Button type="submit">Guardar</Button>
              <Button type="button" variant="ghost" onClick={() => setCreating(false)}>Cancelar</Button>
            </div>
          </form>
        </Card>
      )}

      <div className="mb-4">
        <Tabs items={FILTERS} active={filter} onChange={setFilter} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {visible.map((n) => (
          <Card key={n.id} hover className="cursor-pointer" >
            <button onClick={() => setOpen(n)} className="w-full text-left">
              <div className="mb-2 flex items-center justify-between">
                <Badge color={n.kind === "conversacion" ? "#2f7bff" : "#2fd486"}>
                  {n.kind === "conversacion" ? "💬 Conversación" : "📝 Nota"}
                </Badge>
                <span className="text-[11px] text-ink-faint">{n.date}</span>
              </div>
              <h3 className="font-semibold">{n.title}</h3>
              <p className="mt-1 line-clamp-2 text-xs text-ink-muted">{n.preview}</p>
              {n.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {n.tags.map((t) => (
                    <span key={t} className="rounded-full bg-surface-3 px-2 py-0.5 text-[10px] text-ink-muted">#{t}</span>
                  ))}
                </div>
              )}
            </button>
          </Card>
        ))}
      </div>

      {/* Detalle */}
      {open && (
        <div
          className="fixed inset-0 z-40 grid place-items-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setOpen(null)}
        >
          <div
            className="ro-card ro-fade-up max-h-[80vh] w-full max-w-lg overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <Badge color={open.kind === "conversacion" ? "#2f7bff" : "#2fd486"}>
                {open.kind === "conversacion" ? "💬 Conversación" : "📝 Nota"}
              </Badge>
              <button onClick={() => setOpen(null)} className="text-ink-faint hover:text-ink">✕</button>
            </div>
            <h2 className="text-xl font-bold">{open.title}</h2>
            <p className="mb-4 text-xs text-ink-faint">{open.date}</p>
            <p className="whitespace-pre-line text-sm leading-relaxed text-ink/90">{open.body}</p>
          </div>
        </div>
      )}
    </AppShell>
  );
}
