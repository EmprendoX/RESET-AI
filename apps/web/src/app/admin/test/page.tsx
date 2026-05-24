"use client";

import { useState } from "react";
import { AppShell } from "@/components/app-shell";

export default function AdminTestPage() {
  const [userId, setUserId] = useState("");
  const [message, setMessage] = useState("¿Qué hago hoy?");
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");

  async function runTest() {
    setError("");
    const res = await fetch("/api/admin/test", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, message }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Error");
      return;
    }
    setResult(data);
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-4 text-xl font-semibold">Admin — Test Agent</h1>
        <div className="space-y-4 rounded-lg border bg-white p-6">
          <input
            placeholder="User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm"
            rows={3}
          />
          <button onClick={runTest} className="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white">
            Ejecutar test
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {result && (
            <pre className="max-h-96 overflow-auto rounded bg-neutral-100 p-4 text-xs">
              {JSON.stringify(result, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </AppShell>
  );
}
