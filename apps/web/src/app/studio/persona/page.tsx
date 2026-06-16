"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { StudioTabs } from "@/components/studio-tabs";
import { Badge, Button, Card } from "@ai-coach/ui";
import { persona as seed, type Persona, type ChatMessage } from "@/lib/mock-data";

const TONES: { key: keyof Persona["tone"]; left: string; right: string }[] = [
  { key: "directo", left: "Suave", right: "Directo" },
  { key: "cercano", left: "Formal", right: "Cercano" },
  { key: "detallado", left: "Breve", right: "Detallado" },
  { key: "motivador", left: "Analítico", right: "Motivador" },
];

function generateReply(q: string, p: Persona): string {
  const warm = p.tone.cercano >= 50;
  const blunt = p.tone.directo >= 50;
  const long = p.tone.detallado >= 50;
  const hype = p.tone.motivador >= 50;
  const opener = warm ? "Te entiendo." : "Entiendo tu punto.";
  const core = blunt
    ? "Vamos a lo concreto: elegí UNA cosa y hacela en los próximos 25 minutos."
    : "Probemos con calma: si te parece, elegí una sola cosa para empezar ahora.";
  const detail = long
    ? " Cerrá las otras pestañas, poné un timer y enfocate solo en eso. Cuando termines, me contás y seguimos con el siguiente paso."
    : "";
  const phrase = p.signaturePhrases[0] ? ` ${p.signaturePhrases[0]}` : "";
  const closer = hype ? " Vas a poder — un día más de racha. 🔥" : "";
  return `${opener} ${core}${detail}${phrase}${closer}`.trim();
}

type Pane = "config" | "preview";

export default function PersonaBuilder() {
  const [p, setP] = useState<Persona>(seed);
  const [pane, setPane] = useState<Pane>("config");
  const [saved, setSaved] = useState(false);
  const [phrase, setPhrase] = useState("");
  const [chat, setChat] = useState<ChatMessage[]>([
    { role: "user", content: "No tengo ganas hoy." },
    { role: "assistant", content: generateReply("No tengo ganas hoy.", seed) },
  ]);
  const [input, setInput] = useState("");

  // Carga la persona real si hay sesión; en modo prototipo (sin auth) usa el seed.
  useEffect(() => {
    let cancel = false;
    fetch("/api/studio/persona")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!cancel && d?.persona) setP((prev) => ({ ...prev, ...d.persona }));
      })
      .catch(() => {});
    return () => {
      cancel = true;
    };
  }, []);

  function toPayload(x: Persona) {
    return {
      coach_name: x.coachName,
      tagline: x.tagline,
      avatar: x.avatar,
      tone: x.tone,
      voice: x.voice,
      values: x.values,
      signature_phrases: x.signaturePhrases,
      dos: x.dos,
      donts: x.donts,
      methodology: x.methodology,
      sample_replies: x.sampleReplies,
    };
  }

  function set<K extends keyof Persona>(key: K, value: Persona[K]) {
    setP((prev) => ({ ...prev, [key]: value }));
  }
  function setTone(key: keyof Persona["tone"], value: number) {
    setP((prev) => ({ ...prev, tone: { ...prev.tone, [key]: value } }));
  }
  function addPhrase() {
    if (!phrase.trim()) return;
    set("signaturePhrases", [...p.signaturePhrases, phrase.trim()]);
    setPhrase("");
  }
  function removePhrase(i: number) {
    set("signaturePhrases", p.signaturePhrases.filter((_, idx) => idx !== i));
  }
  async function send(text: string) {
    if (!text.trim()) return;
    setChat((c) => [...c, { role: "user", content: text }]);
    setInput("");
    // Intenta el clon real (OpenAI); si no hay auth/clave, cae al generador local.
    try {
      const res = await fetch("/api/studio/persona/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, persona: toPayload(p) }),
      });
      if (res.ok) {
        const d = await res.json();
        if (d.reply) {
          setChat((c) => [...c, { role: "assistant", content: d.reply }]);
          return;
        }
      }
    } catch {}
    setChat((c) => [...c, { role: "assistant", content: generateReply(text, p) }]);
  }

  async function save() {
    try {
      await fetch("/api/studio/persona", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toPayload(p)),
      });
    } catch {}
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  }

  return (
    <AppShell>
      <StudioTabs />
      {/* Encabezado + contexto creador */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-accent">Creator Studio</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Constructor de Persona</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Definí cómo habla y actúa tu clon de IA. Probalo en vivo a la derecha.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {saved && <span className="text-sm text-success">✓ Guardado</span>}
          <Button onClick={save}>Guardar persona</Button>
        </div>
      </div>

      {/* Switch mobile */}
      <div className="mb-4 inline-flex rounded-xl border border-border bg-surface p-1 md:hidden">
        <button onClick={() => setPane("config")} className={`rounded-lg px-4 py-1.5 text-sm font-semibold ${pane === "config" ? "bg-surface-3 text-ink" : "text-ink-muted"}`}>⚙️ Configurar</button>
        <button onClick={() => setPane("preview")} className={`rounded-lg px-4 py-1.5 text-sm font-semibold ${pane === "preview" ? "bg-surface-3 text-ink" : "text-ink-muted"}`}>👁️ Probar</button>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {/* ---------- CONFIG (vista del creador) ---------- */}
        <div className={`${pane === "config" ? "block" : "hidden"} space-y-5 md:block`}>
          <Card>
            <SectionLabel>Identidad</SectionLabel>
            <Field label="Nombre del coach">
              <input value={p.coachName} onChange={(e) => set("coachName", e.target.value)} className={inputCls} />
            </Field>
            <Field label="Frase / tagline">
              <input value={p.tagline} onChange={(e) => set("tagline", e.target.value)} className={inputCls} />
            </Field>
          </Card>

          <Card>
            <SectionLabel>Tono de voz</SectionLabel>
            <div className="space-y-4">
              {TONES.map((t) => (
                <div key={t.key}>
                  <div className="mb-1 flex justify-between text-xs text-ink-muted">
                    <span>{t.left}</span>
                    <span>{t.right}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={p.tone[t.key]}
                    onChange={(e) => setTone(t.key, Number(e.target.value))}
                    className="w-full accent-[var(--color-accent)]"
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionLabel>Cómo habla</SectionLabel>
            <textarea value={p.voice} onChange={(e) => set("voice", e.target.value)} rows={3} className={inputCls} />
            <div className="mt-4">
              <div className="mb-2 text-xs text-ink-muted">Valores</div>
              <div className="flex flex-wrap gap-2">
                {p.values.map((v) => (
                  <Badge key={v} color="#5b9bff">{v}</Badge>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <SectionLabel>Frases firma</SectionLabel>
            <div className="space-y-2">
              {p.signaturePhrases.map((s, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl border border-border-soft bg-surface-2 px-3 py-2 text-sm">
                  <span>“{s}”</span>
                  <button onClick={() => removePhrase(i)} className="text-ink-faint hover:text-danger">✕</button>
                </div>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                value={phrase}
                onChange={(e) => setPhrase(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addPhrase()}
                placeholder="Agregar una frase típica…"
                className={inputCls}
              />
              <Button size="sm" variant="secondary" onClick={addPhrase}>+</Button>
            </div>
          </Card>

          <div className="grid gap-5 sm:grid-cols-2">
            <Card>
              <SectionLabel>Qué SÍ hace ✅</SectionLabel>
              <ul className="space-y-1.5 text-sm text-ink/90">
                {p.dos.map((d) => <li key={d}>· {d}</li>)}
              </ul>
            </Card>
            <Card>
              <SectionLabel>Qué NO hace ⛔</SectionLabel>
              <ul className="space-y-1.5 text-sm text-ink/90">
                {p.donts.map((d) => <li key={d}>· {d}</li>)}
              </ul>
            </Card>
          </div>

          <Card>
            <SectionLabel>Metodología</SectionLabel>
            <textarea value={p.methodology} onChange={(e) => set("methodology", e.target.value)} rows={3} className={inputCls} />
          </Card>
        </div>

        {/* ---------- PREVIEW (vista del miembro) ---------- */}
        <div className={`${pane === "preview" ? "block" : "hidden"} md:block`}>
          <div className="md:sticky md:top-6">
            <div className="mb-2 flex items-center justify-between">
              <SectionLabel>Vista del miembro · Probá tu clon</SectionLabel>
              <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold text-accent">EN VIVO</span>
            </div>
            <Card className="flex h-[560px] flex-col !p-0">
              {/* header del clon */}
              <div className="flex items-center gap-3 border-b border-border-soft p-4">
                <div className="grid h-11 w-11 place-items-center rounded-full ro-accent-gradient text-lg ro-glow">{p.avatar}</div>
                <div>
                  <div className="font-bold leading-tight">{p.coachName}</div>
                  <div className="text-[11px] text-ink-muted">por {p.creator} · {p.tagline}</div>
                </div>
              </div>
              {/* mensajes */}
              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {chat.map((m, i) => (
                  <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                    {m.role === "assistant" && <div className="mr-2 mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent/15 text-sm">{p.avatar}</div>}
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${m.role === "user" ? "ro-accent-gradient text-white" : "border border-border-soft bg-surface-2"}`}>
                      {m.content}
                    </div>
                  </div>
                ))}
              </div>
              {/* input */}
              <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2 border-t border-border-soft p-3">
                <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Escribí como un miembro…" className="flex-1 rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-accent/70 focus:ring-2 focus:ring-accent/20" />
                <Button type="submit">Probar</Button>
              </form>
            </Card>
            <p className="mt-2 text-center text-[11px] text-ink-faint">
              La respuesta cambia según los sliders de tono y las frases firma.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

const inputCls =
  "w-full rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-accent/70 focus:ring-2 focus:ring-accent/20";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink-muted">{children}</h3>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3 last:mb-0">
      <label className="mb-1.5 block text-xs text-ink-muted">{label}</label>
      {children}
    </div>
  );
}
