"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";

interface Memory {
  id: string;
  type: string;
  title: string;
  content: string;
  source: string;
  confidence: string;
  is_active: boolean;
}

export default function MemoryPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [filter, setFilter] = useState("");
  const [editing, setEditing] = useState<Memory | null>(null);
  const [error, setError] = useState("");

  async function load() {
    const url = filter ? `/api/memory?type=${filter}` : "/api/memory";
    const res = await fetch(url);
    const data = await res.json();
    setMemories(data.memories ?? []);
  }

  useEffect(() => {
    load();
  }, [filter]);

  async function handleDelete(id: string) {
    const res = await fetch(`/api/memory/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setError("No pudimos actualizar tu memoria en este momento. Intenta de nuevo.");
      return;
    }
    load();
  }

  async function handleSave() {
    if (!editing) return;
    const res = await fetch(`/api/memory/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editing.title, content: editing.content }),
    });
    if (!res.ok) {
      setError("No pudimos actualizar tu memoria en este momento. Intenta de nuevo.");
      return;
    }
    setEditing(null);
    load();
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-4 text-xl font-semibold">Memoria</h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="mb-4 rounded-lg border px-3 py-2 text-sm"
        >
          <option value="">Todos los tipos</option>
          {["profile", "blocker", "business", "goal", "preference", "learning"].map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <div className="space-y-3">
          {memories.map((m) => (
            <div key={m.id} className="rounded-lg border border-neutral-200 bg-white p-4">
              <div className="mb-2 flex items-start justify-between">
                <div>
                  <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs">{m.type}</span>
                  <h3 className="mt-1 font-medium">{m.title}</h3>
                </div>
                <span className="text-xs text-neutral-400">{m.source}</span>
              </div>
              <p className="text-sm text-neutral-700">{m.content}</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => setEditing(m)} className="text-xs text-neutral-600 underline">Editar</button>
                <button onClick={() => handleDelete(m.id)} className="text-xs text-red-600 underline">Borrar</button>
              </div>
            </div>
          ))}
          {memories.length === 0 && <p className="text-sm text-neutral-500">No hay memorias guardadas.</p>}
        </div>

        {editing && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/30 p-4">
            <div className="w-full max-w-md rounded-xl bg-white p-6">
              <h2 className="mb-4 font-medium">Editar memoria</h2>
              <input
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                className="mb-3 w-full rounded-lg border px-3 py-2 text-sm"
              />
              <textarea
                value={editing.content}
                onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                className="mb-4 w-full rounded-lg border px-3 py-2 text-sm"
                rows={4}
              />
              <div className="flex gap-2">
                <button onClick={handleSave} className="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white">Guardar</button>
                <button onClick={() => setEditing(null)} className="rounded-lg border px-4 py-2 text-sm">Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
