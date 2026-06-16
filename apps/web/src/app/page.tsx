"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { Badge, Button, Card, CheckCircle, ProgressRing, StreakFlame } from "@ai-coach/ui";
import {
  categoryMeta,
  habits as seedHabits,
  sampleConversation,
  tasks as seedTasks,
  todayLong,
  user,
  type Habit,
} from "@/lib/mock-data";

export default function HomePage() {
  const [habits, setHabits] = useState<Habit[]>(seedHabits);
  const [pendingTasks, setPendingTasks] = useState(
    seedTasks.filter((t) => t.status !== "hecha").length
  );
  const done = habits.filter((h) => h.done).length;
  const pct = habits.length ? Math.round((done / habits.length) * 100) : 0;
  const nudge = sampleConversation[0].content;

  useEffect(() => {
    let cancel = false;
    fetch("/api/habits")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancel && Array.isArray(d?.habits)) setHabits(d.habits);
      })
      .catch(() => {});
    fetch("/api/tasks")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancel && Array.isArray(d?.tasks)) {
          setPendingTasks(d.tasks.filter((t: { status: string }) => t.status !== "hecha").length);
        }
      })
      .catch(() => {});
    return () => {
      cancel = true;
    };
  }, []);

  function toggle(id: string) {
    setHabits((prev) =>
      prev.map((h) =>
        h.id === id ? { ...h, done: !h.done, streak: h.done ? h.streak - 1 : h.streak + 1 } : h
      )
    );
    fetch(`/api/habits/${id}/toggle`, { method: "POST" }).catch(() => {});
  }

  return (
    <AppShell>
      {/* Saludo + racha */}
      <div className="ro-fade-up mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-accent">{todayLong()}</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">Hola, {user.name} 👋</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Seguí tu sistema RESET-ORDER. Una acción a la vez.
          </p>
        </div>
        <Card className="flex items-center gap-4 !py-3">
          <ProgressRing pct={pct} size={58} color="#2f7bff">
            <span className="text-sm font-bold">{pct}%</span>
          </ProgressRing>
          <div className="leading-tight">
            <div className="text-2xl font-bold">
              <StreakFlame days={user.streak} />
            </div>
            <div className="text-[11px] text-ink-muted">días de racha</div>
          </div>
        </Card>
      </div>

      {/* Empujón del coach */}
      <Card hover className="ro-fade-up mb-6 border-accent/25 bg-accent/[0.06]">
        <div className="flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full ro-accent-gradient text-base">🧭</div>
          <div className="min-w-0">
            <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-accent">
              Tu coach
            </div>
            <p className="text-sm text-ink/90">{nudge}</p>
            <div className="mt-3 flex gap-2">
              <Link href="/chat"><Button size="sm">Abrir el chat</Button></Link>
              <Link href="/tasks"><Button size="sm" variant="secondary">Ver tareas</Button></Link>
            </div>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Rutina de hoy */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-bold">Rutina de hoy</h2>
            <span className="text-sm text-ink-muted">{done}/{habits.length} hechos</span>
          </div>
          <div className="space-y-2.5">
            {habits.map((h) => {
              const meta = categoryMeta[h.category];
              return (
                <Card
                  key={h.id}
                  className={`!p-4 transition ${h.done ? "opacity-60" : ""}`}
                >
                  <div className="flex items-center gap-4">
                    <CheckCircle checked={h.done} onClick={() => toggle(h.id)} color={meta.color} />
                    <div className="text-xl">{h.icon}</div>
                    <div className="min-w-0 flex-1">
                      <div className={`font-semibold ${h.done ? "line-through" : ""}`}>{h.title}</div>
                      <div className="truncate text-xs text-ink-muted">{h.description}</div>
                    </div>
                    <div className="hidden text-right sm:block">
                      <Badge color={meta.color}>{meta.label}</Badge>
                      <div className="mt-1 text-[11px] text-ink-faint">{h.time}</div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Columna lateral */}
        <div className="space-y-4">
          <Card>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-muted">Resumen</h3>
            <div className="space-y-3 text-sm">
              <Row label="Hábitos cumplidos hoy" value={`${done}/${habits.length}`} />
              <Row label="Tareas pendientes" value={`${pendingTasks}`} />
              <Row label="Días en el sistema" value={`${user.startedDaysAgo}`} />
              <Row label="Fase actual" value={user.level.split("·")[0].trim()} />
            </div>
          </Card>

          <Card hover className="bg-surface-2">
            <h3 className="mb-2 text-sm font-bold">Cierre del día</h3>
            <p className="text-xs text-ink-muted">
              Cuando termines, escribí 3 líneas en Notas para cerrar el día con orden.
            </p>
            <Link href="/notes" className="mt-3 inline-block">
              <Button size="sm" variant="secondary">Ir a Notas</Button>
            </Link>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-muted">{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}
