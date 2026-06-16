"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Badge, Button, Card, CheckCircle, PageHeader, StreakFlame } from "@ai-coach/ui";
import {
  categoryMeta,
  habits as seedHabits,
  weekLabels,
  type Habit,
} from "@/lib/mock-data";

export default function HabitsPage() {
  const [habits, setHabits] = useState<Habit[]>(seedHabits);

  useEffect(() => {
    let cancel = false;
    fetch("/api/habits")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancel && Array.isArray(d?.habits)) setHabits(d.habits);
      })
      .catch(() => {});
    return () => {
      cancel = true;
    };
  }, []);

  function toggleToday(id: string) {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== id) return h;
        const done = !h.done;
        const week = [...h.week];
        week[6] = done;
        return { ...h, done, week, streak: done ? h.streak + 1 : Math.max(0, h.streak - 1) };
      })
    );
    fetch(`/api/habits/${id}/toggle`, { method: "POST" }).catch(() => {});
  }

  const doneToday = habits.filter((h) => h.done).length;

  return (
    <AppShell>
      <PageHeader
        title="Hábitos"
        subtitle="Tu sistema RESET-ORDER, día a día. La constancia gana a la intensidad."
        action={<Button size="sm">+ Nuevo hábito</Button>}
      />

      {/* Tira de stats */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Hechos hoy" value={`${doneToday}/${habits.length}`} />
        <Stat label="Hábitos activos" value={`${habits.length}`} />
        <Stat label="Mejor racha" value="18 🔥" />
        <Stat label="Esta semana" value="82%" accent />
      </div>

      {/* Tabla de hábitos */}
      <Card className="!p-0">
        <div className="hidden grid-cols-[1fr_auto] items-center gap-4 border-b border-border-soft px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-ink-faint sm:grid">
          <span>Hábito</span>
          <div className="flex items-center gap-4">
            <div className="flex gap-1.5">
              {weekLabels.map((w, i) => (
                <span key={i} className="w-6 text-center">{w}</span>
              ))}
            </div>
            <span className="w-12 text-right">Racha</span>
          </div>
        </div>

        <div className="divide-y divide-border-soft">
          {habits.map((h) => {
            const meta = categoryMeta[h.category];
            return (
              <div key={h.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle checked={h.done} onClick={() => toggleToday(h.id)} color={meta.color} />
                  <div className="text-xl">{h.icon}</div>
                  <div>
                    <div className="font-semibold">{h.title}</div>
                    <div className="flex items-center gap-2 text-xs text-ink-muted">
                      <Badge color={meta.color}>{meta.label}</Badge>
                      <span>{h.time}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 pl-9 sm:pl-0">
                  <div className="flex gap-1.5">
                    {h.week.map((d, i) => (
                      <div
                        key={i}
                        className="grid h-6 w-6 place-items-center rounded-md text-[10px]"
                        style={{
                          backgroundColor: d ? `${meta.color}` : "var(--color-surface-3)",
                          color: d ? "#fff" : "var(--color-ink-faint)",
                          opacity: d ? 1 : 0.6,
                        }}
                        title={d ? "Cumplido" : "Sin cumplir"}
                      >
                        {d ? "" : ""}
                      </div>
                    ))}
                  </div>
                  <div className="w-12 text-right">
                    <StreakFlame days={h.streak} className="text-sm" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </AppShell>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card className="!p-4">
      <div className={`text-2xl font-bold ${accent ? "text-accent" : ""}`}>{value}</div>
      <div className="mt-0.5 text-xs text-ink-muted">{label}</div>
    </Card>
  );
}
