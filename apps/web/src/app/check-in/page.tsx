"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";

export default function CheckInPage() {
  const [form, setForm] = useState({
    achieved: "",
    notDone: "",
    blocked: "",
    learned: "",
    needToday: "",
    adjustGoal: "",
  });
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/check-ins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (res.ok) {
      setSummary(data.check_in?.summary ?? "Check-in registrado.");
    }
  }

  const fields = [
    { key: "achieved", label: "¿Qué lograste desde la última vez?" },
    { key: "notDone", label: "¿Qué no hiciste?" },
    { key: "blocked", label: "¿Qué te bloqueó?" },
    { key: "learned", label: "¿Qué aprendiste?" },
    { key: "needToday", label: "¿Qué necesitas hoy?" },
    { key: "adjustGoal", label: "¿Quieres ajustar tu meta?" },
  ] as const;

  return (
    <AppShell>
      <div className="mx-auto max-w-xl">
        <h1 className="mb-4 text-xl font-semibold">Check-in</h1>
        {summary ? (
          <div className="rounded-lg border bg-white p-6">
            <h2 className="mb-2 font-medium">Resumen</h2>
            <p className="whitespace-pre-wrap text-sm text-neutral-700">{summary}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(({ key, label }) => (
              <div key={key}>
                <label className="mb-1 block text-sm font-medium">{label}</label>
                <textarea
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  rows={2}
                  required={key !== "adjustGoal"}
                />
              </div>
            ))}
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {loading ? "Enviando..." : "Enviar check-in"}
            </button>
          </form>
        )}
      </div>
    </AppShell>
  );
}
