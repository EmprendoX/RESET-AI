"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { StudioTabs } from "@/components/studio-tabs";
import { Badge, Button, Card } from "@ai-coach/ui";
import {
  kbPreview,
  knowledgeSources as seed,
  sourceMeta,
  type IndexStatus,
  type KnowledgeSource,
} from "@/lib/mock-data";

const statusMeta: Record<IndexStatus, { label: string; color: string }> = {
  indexado: { label: "Indexado", color: "#2fd486" },
  procesando: { label: "Procesando", color: "#ffb020" },
  error: { label: "Error", color: "#ff5470" },
};

export default function KnowledgePage() {
  const [sources, setSources] = useState<KnowledgeSource[]>(seed);
  const [asked, setAsked] = useState(false);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<KnowledgeSource["type"]>("post");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);

  const indexed = sources.filter((s) => s.status === "indexado");
  const totalChunks = sources.reduce((a, s) => a + s.chunks, 0);

  // Carga las fuentes reales si hay sesión; en prototipo usa el seed.
  useEffect(() => {
    let cancel = false;
    fetch("/api/studio/knowledge")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancel && Array.isArray(d?.sources)) setSources(d.sources);
      })
      .catch(() => {});
    return () => {
      cancel = true;
    };
  }, []);

  async function addSource(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/studio/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, type, content }),
      });
      if (res.ok) {
        const d = await res.json();
        if (d.source) setSources((prev) => [d.source, ...prev]);
      } else {
        // sin auth (prototipo): simulamos la indexación
        simulateUpload(title, type);
      }
    } catch {
      simulateUpload(title, type);
    }
    setBusy(false);
    setOpen(false);
    setTitle("");
    setContent("");
  }

  function simulateUpload(t = "Documento subido", ty: KnowledgeSource["type"] = "pdf") {
    const id = `k${Date.now()}`;
    setSources((prev) => [
      { id, title: `${t} (subiendo…)`, type: ty, status: "procesando", chunks: 0, updated: "Ahora" },
      ...prev,
    ]);
    setTimeout(() => {
      setSources((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, title: t, status: "indexado", chunks: 24, updated: "Ahora" }
            : s
        )
      );
    }, 1600);
  }

  return (
    <AppShell>
      <StudioTabs />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-accent">Creator Studio</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Base de conocimiento</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Subí tus cursos y contenido. Tu coach responde fundado en tu material, con citas.
          </p>
        </div>
        <Button onClick={() => setOpen((v) => !v)}>+ Subir fuente</Button>
      </div>

      {/* Formulario de ingesta */}
      {open && (
        <Card className="mb-6 ro-fade-up">
          <form onSubmit={addSource} className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título (ej. Lección 3 · Apilar hábitos)"
                className="flex-1 rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-accent/70 focus:ring-2 focus:ring-accent/20"
              />
              <select
                value={type}
                onChange={(e) => setType(e.target.value as KnowledgeSource["type"])}
                className="rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-ink outline-none focus:border-accent/70"
              >
                <option value="post">Post / texto</option>
                <option value="curso">Curso</option>
                <option value="pdf">PDF (pegá el texto)</option>
                <option value="video">Video (pegá la transcripción)</option>
              </select>
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Pegá acá el contenido o la transcripción. Se parte en fragmentos y se indexa con embeddings."
              rows={6}
              className="w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-accent/70 focus:ring-2 focus:ring-accent/20"
            />
            <div className="flex items-center gap-2">
              <Button type="submit" disabled={busy}>{busy ? "Indexando…" : "Indexar"}</Button>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancelar</Button>
              <span className="text-[11px] text-ink-faint">El texto se convierte en embeddings y queda buscable por el coach.</span>
            </div>
          </form>
        </Card>
      )}

      {/* KPIs */}
      <div className="mb-6 grid grid-cols-3 gap-3">
        <Stat label="Fuentes" value={`${sources.length}`} />
        <Stat label="Indexadas" value={`${indexed.length}`} accent />
        <Stat label="Fragmentos" value={`${totalChunks}`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Lista de fuentes (creador) */}
        <div className="lg:col-span-2">
          <h2 className="mb-3 text-lg font-bold">Tus fuentes</h2>
          <div className="space-y-2.5">
            {sources.map((s) => {
              const meta = sourceMeta[s.type];
              const st = statusMeta[s.status];
              return (
                <Card key={s.id} className="!p-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-surface-3 text-lg">{meta.icon}</div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{s.title}</div>
                      <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                        <Badge color={meta.color}>{meta.label}</Badge>
                        {s.lessons ? <span>{s.lessons} lecciones</span> : null}
                        <span>· {s.chunks} fragmentos</span>
                        <span>· {s.updated}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: st.color }}>
                      {s.status === "procesando" && <span className="ro-pulse">●</span>}
                      {s.status === "indexado" && <span>●</span>}
                      {st.label}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <Card className="mt-3 border-dashed text-center !py-6">
            <p className="text-sm text-ink-muted">Arrastrá un archivo o</p>
            <button onClick={() => setOpen(true)} className="mt-1 text-sm font-semibold text-accent hover:underline">
              elegí cursos, PDFs, videos o posts
            </button>
          </Card>
        </div>

        {/* Vista del miembro: respuesta con citas */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Qué sabe tu agente</h2>
            <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">VISTA MIEMBRO</span>
          </div>
          <Card>
            <div className="mb-3 flex justify-end">
              <div className="rounded-2xl ro-accent-gradient px-4 py-2 text-sm text-white">{kbPreview.q}</div>
            </div>
            {asked ? (
              <div className="ro-fade-up">
                <div className="flex gap-2">
                  <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent/15 text-sm">🧭</div>
                  <div className="rounded-2xl border border-border-soft bg-surface-2 px-4 py-2.5 text-sm leading-relaxed">
                    {kbPreview.a}
                  </div>
                </div>
                <div className="mt-3 pl-9">
                  <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-ink-faint">Fuentes citadas</div>
                  <div className="space-y-1.5">
                    {kbPreview.citations.map((c, i) => (
                      <div key={i} className="flex items-center gap-2 rounded-lg border border-border-soft bg-surface px-3 py-1.5 text-xs">
                        <span className="text-accent">🔗</span>
                        <span className="font-medium">{c.source}</span>
                        <span className="text-ink-faint">· {c.lesson}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <Button size="sm" variant="secondary" onClick={() => setAsked(true)}>Ver respuesta con citas →</Button>
            )}
          </Card>
          <p className="text-center text-[11px] text-ink-faint">
            El agente solo responde con lo que está en tu base. No inventa.
          </p>
        </div>
      </div>
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
