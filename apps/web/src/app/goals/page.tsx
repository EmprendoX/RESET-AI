"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";

interface Goal {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: string;
  progress: number;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  async function load() {
    const res = await fetch("/api/goals");
    const data = await res.json();
    setGoals(data.goals ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function createGoal() {
    await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, description, status: "active", progress: 0 }),
    });
    setTitle("");
    setDescription("");
    setShowForm(false);
    load();
  }

  async function updateGoal(id: string, updates: Partial<Goal>) {
    await fetch(`/api/goals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    load();
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Metas</h1>
          <button onClick={() => setShowForm(true)} className="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white">
            Nueva meta
          </button>
        </div>

        {showForm && (
          <div className="mb-6 rounded-lg border bg-white p-4">
            <input placeholder="Título" value={title} onChange={(e) => setTitle(e.target.value)} className="mb-2 w-full rounded-lg border px-3 py-2 text-sm" />
            <textarea placeholder="Descripción" value={description} onChange={(e) => setDescription(e.target.value)} className="mb-3 w-full rounded-lg border px-3 py-2 text-sm" rows={2} />
            <div className="flex gap-2">
              <button onClick={createGoal} className="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white">Guardar</button>
              <button onClick={() => setShowForm(false)} className="rounded-lg border px-4 py-2 text-sm">Cancelar</button>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {goals.map((g) => (
            <div key={g.id} className="rounded-lg border bg-white p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">{g.title}</h3>
                  {g.description && <p className="text-sm text-neutral-600">{g.description}</p>}
                  <p className="mt-1 text-xs text-neutral-400">{g.category} · {g.status} · {g.progress}%</p>
                </div>
                <div className="flex gap-2">
                  {g.status === "active" && (
                    <>
                      <button onClick={() => updateGoal(g.id, { status: "completed", progress: 100 })} className="text-xs underline">Completar</button>
                      <button onClick={() => updateGoal(g.id, { status: "paused" })} className="text-xs underline">Pausar</button>
                    </>
                  )}
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={g.progress}
                onChange={(e) => updateGoal(g.id, { progress: Number(e.target.value) })}
                className="mt-3 w-full"
              />
            </div>
          ))}
          {goals.length === 0 && <p className="text-sm text-neutral-500">No tienes metas aún.</p>}
        </div>
      </div>
    </AppShell>
  );
}
