"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";

export default function AdminEventsPage() {
  const [events, setEvents] = useState<unknown[]>([]);

  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((d) => setEvents(d.events ?? []));
  }, []);

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-4 text-xl font-semibold">Admin — Events</h1>
        <pre className="max-h-[70vh] overflow-auto rounded-lg border bg-white p-4 text-xs">
          {JSON.stringify(events, null, 2)}
        </pre>
      </div>
    </AppShell>
  );
}
