"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    name: "",
    coaching_style: "practico",
    memory_enabled: true,
    language: "es",
    timezone: "",
  });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((d) => {
        if (d.settings) setSettings(d.settings);
      });
  }, []);

  async function handleSave() {
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: settings.name,
        coaching_style: settings.coaching_style,
        memory_enabled: settings.memory_enabled,
        language: settings.language,
        timezone: settings.timezone,
      }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-xl">
        <h1 className="mb-4 text-xl font-semibold">Settings</h1>
        <div className="space-y-4 rounded-lg border bg-white p-6">
          <div>
            <label className="mb-1 block text-sm font-medium">Nombre</label>
            <input
              value={settings.name ?? ""}
              onChange={(e) => setSettings({ ...settings, name: e.target.value })}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Estilo de coach</label>
            <select
              value={settings.coaching_style ?? "practico"}
              onChange={(e) => setSettings({ ...settings, coaching_style: e.target.value })}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            >
              {["directo", "suave", "estrategico", "practico", "motivador"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.memory_enabled ?? false}
              onChange={(e) => setSettings({ ...settings, memory_enabled: e.target.checked })}
            />
            Activar memoria personalizada
          </label>
          <button
            onClick={handleSave}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white"
          >
            Guardar cambios
          </button>
          {saved && <p className="text-sm text-green-600">Guardado</p>}
        </div>
      </div>
    </AppShell>
  );
}
