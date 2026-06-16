"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Card, PageHeader, ProgressRing } from "@ai-coach/ui";
import {
  categoryMeta,
  habits as seedHabits,
  last14Days,
  progressStats,
  type Habit,
  type HabitCategory,
} from "@/lib/mock-data";

export default function ProgressPage() {
  const maxPct = 100;
  const [habits, setHabits] = useState<Habit[]>(seedHabits);
  const [stats, setStats] = useState(progressStats);
  const [chart, setChart] = useState(last14Days);

  useEffect(() => {
    let cancel = false;
    fetch("/api/habits")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancel && Array.isArray(d?.habits)) setHabits(d.habits);
      })
      .catch(() => {});
    fetch("/api/stats/progress")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancel || !d) return;
        if (d.stats) setStats(d.stats);
        if (Array.isArray(d.last14Days)) setChart(d.last14Days);
      })
      .catch(() => {});
    return () => {
      cancel = true;
    };
  }, []);

  // cumplimiento de hoy por categoría (datos reales de hábitos)
  const byCategory = (Object.keys(categoryMeta) as HabitCategory[]).map((cat) => {
    const list = habits.filter((h) => h.category === cat);
    const avg = list.length
      ? Math.round((list.filter((h) => h.done).length / list.length) * 100)
      : 0;
    return { cat, meta: categoryMeta[cat], avg, count: list.length };
  });

  const activeHabits = habits.length;

  return (
    <AppShell>
      <PageHeader
        title="Progreso"
        subtitle="Tu constancia con el sistema RESET-ORDER en el tiempo."
      />

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Kpi label="Cumplimiento (30 días)" value={`${stats.cumplimiento30}%`} accent />
        <Kpi label="Mejor racha" value={`${stats.mejorRacha} 🔥`} />
        <Kpi label="Días perfectos" value={`${stats.diasPerfectos}`} />
        <Kpi label="Hábitos activos" value={`${activeHabits}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Gráfico de barras 14 días */}
        <Card className="lg:col-span-2">
          <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-ink-muted">
            Últimos 14 días
          </h3>
          <div className="flex h-44 items-end gap-1.5">
            {chart.map((d, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex w-full flex-1 items-end">
                  <div
                    className="w-full rounded-t-md transition-all"
                    style={{
                      height: `${(d.pct / maxPct) * 100}%`,
                      background:
                        d.pct >= 100
                          ? "linear-gradient(180deg,#5b9bff,#1e5fe0)"
                          : "var(--color-surface-3)",
                      minHeight: 6,
                    }}
                    title={`${d.pct}%`}
                  />
                </div>
                <span className="text-[10px] text-ink-faint">{d.label}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Anillo global */}
        <Card className="flex flex-col items-center justify-center text-center">
          <ProgressRing pct={stats.cumplimiento30} size={140} stroke={12} color="#2f7bff">
            <div>
              <div className="text-3xl font-bold">{stats.cumplimiento30}%</div>
              <div className="text-[11px] text-ink-muted">este mes</div>
            </div>
          </ProgressRing>
          <p className="mt-4 text-sm text-ink-muted">
            Vas firme. Mantené la racha un día más.
          </p>
        </Card>
      </div>

      {/* Por categoría */}
      <Card className="mt-6">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-ink-muted">
          Por pilar del sistema
        </h3>
        <div className="space-y-4">
          {byCategory.map(({ cat, meta, avg }) => (
            <div key={cat}>
              <div className="mb-1.5 flex items-center justify-between text-sm">
                <span className="font-medium">{meta.label}</span>
                <span className="text-ink-muted">{avg}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-surface-3">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${avg}%`, backgroundColor: meta.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </AppShell>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Card className="!p-4">
      <div className={`text-2xl font-bold ${accent ? "text-accent" : ""}`}>{value}</div>
      <div className="mt-0.5 text-xs text-ink-muted">{label}</div>
    </Card>
  );
}
