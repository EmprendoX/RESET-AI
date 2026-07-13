"use client";

import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@ai-coach/ui";
import { quickActions, type ChatMessage } from "@/lib/mock-data";
import { addNote, useNotes } from "@/lib/notes-store";

const CANNED =
  "Entiendo. Recordá el principio de RESET-ORDER: acción antes que teoría. Elegí UNA cosa de tu rutina de hoy y hacela en los próximos 25 minutos. Yo te marco el siguiente paso cuando termines. ¿Cuál elegís?";

type Pane = "chat" | "notas";
type Citation = { source: string; lesson: string };
type Msg = ChatMessage & { citations?: Citation[] };

export default function ChatWorkspace() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [pane, setPane] = useState<Pane>("chat"); // solo controla mobile
  const [showNotes, setShowNotes] = useState(true); // solo controla desktop
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const notes = useNotes();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  // Carga el historial real de la última conversación al abrir (persistente entre sesiones).
  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const r = await fetch("/api/conversations");
        if (!r.ok) return;
        const { conversations } = await r.json();
        const latest = conversations?.[0];
        if (!latest) return;
        const r2 = await fetch(`/api/conversations/${latest.id}`);
        if (!r2.ok) return;
        const { messages: msgs } = await r2.json();
        if (cancel) return;
        setConversationId(latest.id);
        setMessages(
          (msgs ?? []).map((m: { role: string; content: string; metadata_json?: { citations?: Citation[] } }) => ({
            role: m.role === "assistant" ? "assistant" : "user",
            content: m.content,
            citations: m.metadata_json?.citations ?? [],
          }))
        );
      } catch {}
    })();
    return () => {
      cancel = true;
    };
  }, []);

  async function send(text: string) {
    if (!text.trim() || typing) return;
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((p) => [...p, { role: "user", content: text }]);
    setInput("");
    setTyping(true);
    // Coach real (RAG + persona + citas); si no hay auth/clave, cae a la respuesta de ejemplo.
    try {
      const res = await fetch("/api/coach/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history, conversation_id: conversationId }),
      });
      if (res.ok) {
        const d = await res.json();
        if (d.reply) {
          if (d.conversation_id) setConversationId(d.conversation_id);
          setMessages((p) => [...p, { role: "assistant", content: d.reply, citations: d.citations ?? [] }]);
          setTyping(false);
          return;
        }
      }
    } catch {}
    setMessages((p) => [...p, { role: "assistant", content: CANNED }]);
    setTyping(false);
  }

  async function copy(text: string, id: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
    setCopied(id);
    setTimeout(() => setCopied(null), 1400);
  }

  function toDraft(text: string) {
    setDraft((d) => (d ? `${d}\n${text}` : text));
    setPane("notas"); // en mobile, salta al bloc
  }

  function saveDraft() {
    if (!draft.trim()) return;
    addNote({ title: draft.split("\n")[0].slice(0, 40), body: draft });
    setDraft("");
  }

  function saveConversation() {
    const body = messages.map((m) => `${m.role === "user" ? "Vos" : "Coach"}: ${m.content}`).join("\n");
    addNote({ kind: "conversacion", title: "Conversación con el coach", body });
    setCopied("conv");
    setTimeout(() => setCopied(null), 1400);
  }

  // --- Voz: grabar + transcribir (Whisper) ---
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || "audio/webm" });
        await transcribe(blob);
      };
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
    } catch {
      setRecording(false);
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  async function transcribe(blob: Blob) {
    setTranscribing(true);
    try {
      const form = new FormData();
      form.append("audio", blob, "audio.webm");
      const res = await fetch("/api/coach/transcribe", { method: "POST", body: form });
      if (res.ok) {
        const d = await res.json();
        if (d.text) setInput((prev) => (prev ? `${prev} ${d.text}` : d.text));
      }
    } catch {}
    setTranscribing(false);
  }

  // --- Voz: escuchar la respuesta del coach (TTS) ---
  async function speak(text: string, id: string) {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (speakingId === id) {
      setSpeakingId(null);
      return;
    }
    setSpeakingId(id);
    try {
      const res = await fetch("/api/coach/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) {
        setSpeakingId(null);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => {
        setSpeakingId(null);
        URL.revokeObjectURL(url);
      };
      await audio.play();
    } catch {
      setSpeakingId(null);
    }
  }

  const chatVisible = pane === "chat";
  const notesVisible = pane === "notas";

  return (
    <AppShell>
      {/* Cambio rápido de pantalla (mobile) */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-border bg-surface p-1 md:hidden">
          <button
            onClick={() => setPane("chat")}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${pane === "chat" ? "bg-surface-3 text-ink" : "text-ink-muted"}`}
          >
            💬 Chat
          </button>
          <button
            onClick={() => setPane("notas")}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${pane === "notas" ? "bg-surface-3 text-ink" : "text-ink-muted"}`}
          >
            📝 Notas
          </button>
        </div>
        <h1 className="hidden text-lg font-bold md:block">Coach + Notas</h1>
        <button
          onClick={() => setShowNotes((v) => !v)}
          className="hidden items-center gap-2 rounded-xl border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-ink-muted transition hover:text-ink md:inline-flex"
        >
          {showNotes ? "Ocultar notas →" : "← Mostrar notas"}
        </button>
      </div>

      <div className="flex h-[calc(100vh-11rem)] gap-4 md:h-[calc(100vh-8rem)]">
        {/* ---------- CHAT ---------- */}
        <section className={`${chatVisible ? "flex" : "hidden"} min-w-0 flex-1 flex-col md:flex`}>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full ro-accent-gradient text-base ro-glow">🧭</div>
              <div>
                <div className="font-bold leading-tight">Coach RESET-ORDER</div>
                <div className="text-[11px] text-success">● te da seguimiento</div>
              </div>
            </div>
            <Button size="sm" variant="secondary" onClick={saveConversation}>
              {copied === "conv" ? "✓ Guardada" : "Guardar chat"}
            </Button>
          </div>

          <div className="ro-card flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((m, i) => {
              const id = `m${i}`;
              return (
                <div key={i} className={`group flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                  <div className="flex items-start gap-2">
                    {m.role === "assistant" && (
                      <div className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent/15 text-sm">🧭</div>
                    )}
                    <div
                      className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        m.role === "user" ? "ro-accent-gradient text-white" : "border border-border-soft bg-surface-2 text-ink"
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                  {/* citas a las lecciones del creador */}
                  {m.role === "assistant" && m.citations && m.citations.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5 pl-9">
                      {m.citations.map((c, ci) => (
                        <span key={ci} className="inline-flex items-center gap-1 rounded-lg border border-border-soft bg-surface px-2 py-1 text-[11px] text-ink-muted">
                          <span className="text-accent">🔗</span>
                          <span className="font-medium text-ink">{c.source}</span>
                          {c.lesson && <span className="text-ink-faint">· {c.lesson}</span>}
                        </span>
                      ))}
                    </div>
                  )}
                  {/* acciones por mensaje */}
                  <div className="mt-1 flex gap-3 px-9 text-[11px] text-ink-faint opacity-0 transition group-hover:opacity-100">
                    <button onClick={() => copy(m.content, id)} className="hover:text-accent">
                      {copied === id ? "✓ copiado" : "Copiar"}
                    </button>
                    <button onClick={() => toDraft(m.content)} className="hover:text-accent">→ A nota</button>
                    {m.role === "assistant" && (
                      <button onClick={() => speak(m.content, id)} className="hover:text-accent">
                        {speakingId === id ? "⏹ Detener" : "🔊 Escuchar"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
            {typing && <p className="ro-pulse pl-9 text-sm text-ink-faint">El coach está escribiendo…</p>}
            <div ref={bottomRef} />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {quickActions.slice(0, 4).map((a) => (
              <button
                key={a}
                onClick={() => send(a)}
                className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-ink-muted transition hover:border-accent/50 hover:text-ink"
              >
                {a}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="mt-3 flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                transcribing ? "Transcribiendo tu audio…" : recording ? "Grabando… tocá el micro para terminar" : "Escribí o grabá tu mensaje…"
              }
              className="flex-1 rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-accent/70 focus:ring-2 focus:ring-accent/20"
            />
            <button
              type="button"
              onClick={recording ? stopRecording : startRecording}
              disabled={transcribing || typing}
              title={recording ? "Detener y transcribir" : "Grabar mensaje de voz"}
              className={`grid w-12 shrink-0 place-items-center rounded-xl border text-lg transition ${
                recording
                  ? "border-danger bg-danger/10 text-danger ro-pulse"
                  : "border-border bg-surface-2 text-ink-muted hover:border-accent/60 hover:text-accent"
              } disabled:opacity-50`}
            >
              {transcribing ? "…" : recording ? "⏺" : "🎤"}
            </button>
            <Button type="submit" disabled={typing}>Enviar</Button>
          </form>
        </section>

        {/* ---------- NOTAS ---------- */}
        <aside
          className={`${notesVisible ? "flex" : "hidden"} min-w-0 flex-1 flex-col md:flex-none ${
            showNotes ? "md:flex md:w-80 lg:w-96" : "md:hidden"
          }`}
        >
          <div className="mb-3 flex items-center justify-between">
            <div className="font-bold">📝 Bloc de notas</div>
            <span className="text-[11px] text-ink-faint">{notes.length} guardadas</span>
          </div>

          <div className="ro-card flex flex-1 flex-col overflow-hidden p-4">
            {/* notepad */}
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Pegá o escribí acá lo que quieras guardar…"
              className="min-h-[110px] w-full resize-none rounded-xl border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint outline-none focus:border-accent/70 focus:ring-2 focus:ring-accent/20"
            />
            <div className="mt-2 flex gap-2">
              <Button size="sm" onClick={saveDraft} disabled={!draft.trim()}>Guardar nota</Button>
              <Button size="sm" variant="ghost" onClick={() => setDraft("")} disabled={!draft.trim()}>Limpiar</Button>
            </div>

            {/* guardadas */}
            <div className="mt-4 flex-1 space-y-2 overflow-y-auto border-t border-border-soft pt-3">
              {notes.map((n) => (
                <div key={n.id} className="group rounded-xl border border-border-soft bg-surface-2 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="truncate text-sm font-semibold">{n.title}</div>
                    <button
                      onClick={() => copy(n.body, n.id)}
                      className="shrink-0 text-[11px] text-ink-faint transition hover:text-accent"
                    >
                      {copied === n.id ? "✓" : "Copiar"}
                    </button>
                  </div>
                  <div className="mt-0.5 line-clamp-2 text-xs text-ink-muted">{n.preview}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <p className="mt-2 text-center text-[11px] text-ink-faint">
        Prototipo — respuestas de ejemplo. Copiá un mensaje o mandalo a una nota con un toque.
      </p>
    </AppShell>
  );
}
