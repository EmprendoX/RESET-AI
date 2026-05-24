"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";

interface Recommendation {
  id: string;
  type: string;
  title: string;
  description: string | null;
  reason: string | null;
  status: string;
}

export default function RecommendationsPage() {
  const [recs, setRecs] = useState<Recommendation[]>([]);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/recommendations");
    const data = await res.json();
    setRecs(data.recommendations ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleAction(id: string, action: string) {
    const res = await fetch(`/api/recommendations/${id}/${action}`, { method: "POST" });
    if (!res.ok) {
      setError("No pude generar recomendaciones nuevas ahora. Puedes seguir trabajando con tus metas actuales.");
      return;
    }
    load();
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-4 text-xl font-semibold">Recomendaciones</h1>
        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
        <div className="space-y-3">
          {recs.map((r) => (
            <div key={r.id} className="rounded-lg border bg-white p-4">
              <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs">{r.type}</span>
              <h3 className="mt-1 font-medium">{r.title}</h3>
              {r.description && <p className="text-sm text-neutral-600">{r.description}</p>}
              {r.reason && <p className="mt-1 text-xs text-neutral-400">Razón: {r.reason}</p>}
              <p className="mt-1 text-xs capitalize text-neutral-500">{r.status}</p>
              {r.status === "pending" && (
                <div className="mt-3 flex gap-2">
                  <button onClick={() => handleAction(r.id, "accept")} className="text-xs underline">Aceptar</button>
                  <button onClick={() => handleAction(r.id, "dismiss")} className="text-xs underline">Descartar</button>
                  <button onClick={() => handleAction(r.id, "complete")} className="text-xs underline">Completar</button>
                </div>
              )}
            </div>
          ))}
          {recs.length === 0 && <p className="text-sm text-neutral-500">No hay recomendaciones.</p>}
        </div>
      </div>
    </AppShell>
  );
}
