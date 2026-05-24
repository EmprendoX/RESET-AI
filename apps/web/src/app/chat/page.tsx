"use client";

import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/app-shell";

const QUICK_ACTIONS = [
  "¿Qué hago hoy?",
  "Revisa mi meta.",
  "Dame una tarea.",
  "Ayúdame con mi negocio.",
  "Hazme un plan de 7 días.",
  "¿Qué bloqueo estoy repitiendo?",
  "Dame claridad.",
  "Prepara mi check-in.",
  "Ayúdame a vender.",
  "Ayúdame a organizarme.",
];

interface Message {
  role: string;
  content: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage(text: string) {
    if (!text.trim() || loading) return;
    setError("");
    setLoading(true);
    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");

    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversation_id: conversationId, message: text }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Error en el chat");
      return;
    }

    if (data.conversation_id) setConversationId(data.conversation_id);
    setMessages((prev) => [...prev, { role: "assistant", content: data.message }]);
  }

  return (
    <AppShell>
      <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-3xl flex-col">
        <h1 className="mb-4 text-xl font-semibold">Chat con tu Coach</h1>

        <div className="mb-3 flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((action) => (
            <button
              key={action}
              onClick={() => setInput(action)}
              className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs hover:bg-neutral-50"
            >
              {action}
            </button>
          ))}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto rounded-xl border border-neutral-200 bg-white p-4">
          {messages.length === 0 && (
            <p className="text-sm text-neutral-500">Escribe un mensaje o usa una acción rápida.</p>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`max-w-[85%] rounded-lg px-4 py-2 text-sm ${
                msg.role === "user"
                  ? "ml-auto bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-900"
              }`}
            >
              {msg.content}
            </div>
          ))}
          {loading && <p className="text-sm text-neutral-400">El coach está pensando...</p>}
          <div ref={bottomRef} />
        </div>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="mt-4 flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escribe tu mensaje..."
            className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            Enviar
          </button>
        </form>
      </div>
    </AppShell>
  );
}
