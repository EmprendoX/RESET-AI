"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";

export default function AdminLogsPage() {
  const [logs, setLogs] = useState<unknown[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/logs")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setLogs(d.logs ?? []);
      });
  }, []);

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-4 text-xl font-semibold">Admin — Logs</h1>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <pre className="max-h-[70vh] overflow-auto rounded-lg border bg-white p-4 text-xs">
          {JSON.stringify(logs, null, 2)}
        </pre>
      </div>
    </AppShell>
  );
}
