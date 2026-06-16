"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Badge, Button, Card, CheckCircle, PageHeader, Tabs } from "@ai-coach/ui";
import { tasks as seedTasks, type TaskStatus, type TodoTask } from "@/lib/mock-data";

const priorityColor: Record<string, string> = {
  alta: "#ff5470",
  media: "#ffb020",
  baja: "#9aa3b4",
};

const FILTERS = [
  { id: "todas", label: "Todas" },
  { id: "pendiente", label: "Pendientes" },
  { id: "en_curso", label: "En curso" },
  { id: "hecha", label: "Hechas" },
];

export default function TasksPage() {
  const [tasks, setTasks] = useState<TodoTask[]>(seedTasks);
  const [filter, setFilter] = useState("todas");
  const [draft, setDraft] = useState("");

  useEffect(() => {
    let cancel = false;
    fetch("/api/tasks")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancel && Array.isArray(d?.tasks)) setTasks(d.tasks);
      })
      .catch(() => {});
    return () => {
      cancel = true;
    };
  }, []);

  function toggleDone(id: string) {
    let nextStatus: TaskStatus = "hecha";
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        nextStatus = t.status === "hecha" ? "pendiente" : "hecha";
        return { ...t, status: nextStatus };
      })
    );
    fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    }).catch(() => {});
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    const title = draft.trim();
    setDraft("");
    const temp: TodoTask = {
      id: `t${Date.now()}`,
      title,
      status: "pendiente" as TaskStatus,
      priority: "media",
      due: "Hoy",
    };
    setTasks((prev) => [temp, ...prev]);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (res.ok) {
        const d = await res.json();
        if (d?.task) setTasks((prev) => prev.map((t) => (t.id === temp.id ? d.task : t)));
      }
    } catch {}
  }

  const visible = tasks.filter((t) => (filter === "todas" ? true : t.status === filter));
  const pending = tasks.filter((t) => t.status !== "hecha").length;

  return (
    <AppShell>
      <PageHeader
        title="Tareas"
        subtitle={`${pending} pendientes · el coach les da seguimiento`}
      />

      {/* Crear tarea */}
      <Card className="mb-5">
        <form onSubmit={addTask} className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Agregar una tarea…"
            className="flex-1 rounded-xl border border-border bg-surface-2 px-4 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-accent/70 focus:ring-2 focus:ring-accent/20"
          />
          <Button type="submit">Agregar</Button>
        </form>
      </Card>

      <div className="mb-4">
        <Tabs items={FILTERS} active={filter} onChange={setFilter} />
      </div>

      <div className="space-y-2.5">
        {visible.map((t) => {
          const done = t.status === "hecha";
          return (
            <Card key={t.id} className={`!p-4 ${done ? "opacity-55" : ""}`}>
              <div className="flex items-start gap-3">
                <CheckCircle checked={done} onClick={() => toggleDone(t.id)} color="#2fd486" />
                <div className="min-w-0 flex-1">
                  <div className={`font-semibold ${done ? "line-through" : ""}`}>{t.title}</div>
                  {t.note && <div className="mt-0.5 text-xs text-ink-muted">{t.note}</div>}
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge color={priorityColor[t.priority]}>● {t.priority}</Badge>
                    {!done && t.status === "en_curso" && <Badge color="#2f7bff">en curso</Badge>}
                    <span className="text-[11px] text-ink-faint">📅 {t.due}</span>
                    {t.linkedHabit && (
                      <span className="text-[11px] text-ink-faint">🔗 {t.linkedHabit}</span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
        {visible.length === 0 && (
          <Card className="text-center text-sm text-ink-muted">No hay tareas en este filtro.</Card>
        )}
      </div>
    </AppShell>
  );
}
