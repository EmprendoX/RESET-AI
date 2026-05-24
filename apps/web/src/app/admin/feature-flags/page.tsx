"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";

interface Flag {
  id: string;
  key: string;
  enabled: boolean;
  description: string | null;
}

export default function AdminFeatureFlagsPage() {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [error, setError] = useState("");

  async function load() {
    const res = await fetch("/api/admin/feature-flags");
    const data = await res.json();
    if (data.error) setError(data.error);
    else setFlags(data.flags ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function toggle(key: string, enabled: boolean) {
    await fetch("/api/admin/feature-flags", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, enabled }),
    });
    load();
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-xl">
        <h1 className="mb-4 text-xl font-semibold">Admin — Feature Flags</h1>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="space-y-2">
          {flags.map((f) => (
            <label key={f.id} className="flex items-center justify-between rounded-lg border bg-white p-4">
              <div>
                <p className="font-medium">{f.key}</p>
                <p className="text-xs text-neutral-500">{f.description}</p>
              </div>
              <input
                type="checkbox"
                checked={f.enabled}
                onChange={(e) => toggle(f.key, e.target.checked)}
              />
            </label>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
