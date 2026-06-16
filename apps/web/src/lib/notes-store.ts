"use client";

// Store de notas compartido entre el chat y la pantalla Notas.
// En modo real (con sesión) sincroniza con /api/notes; en prototipo (sin auth)
// funciona en memoria con el seed.

import { useSyncExternalStore } from "react";
import { notes as seed, type Note } from "./mock-data";

let store: Note[] = [...seed];
const listeners = new Set<() => void>();
let inited = false;

function emit() {
  listeners.forEach((l) => l());
}

function init() {
  if (inited) return;
  inited = true;
  fetch("/api/notes")
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      if (Array.isArray(d?.notes)) {
        store = d.notes;
        emit();
      }
    })
    .catch(() => {});
}

function subscribe(l: () => void) {
  init();
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

function snapshot() {
  return store;
}

async function persist(tempId: string, payload: { kind: Note["kind"]; title: string; body: string; tags: string[] }) {
  try {
    const r = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (r.ok) {
      const d = await r.json();
      if (d?.note) {
        store = store.map((n) => (n.id === tempId ? d.note : n));
        emit();
      }
    }
  } catch {
    // prototipo / offline: queda la nota local
  }
}

export function addNote(input: {
  kind?: Note["kind"];
  title: string;
  body: string;
  tags?: string[];
}): Note {
  const note: Note = {
    id: `n${Date.now()}`,
    kind: input.kind ?? "nota",
    title: input.title.trim() || "Nota sin título",
    preview: input.body.slice(0, 80),
    body: input.body,
    date: "Ahora",
    tags: input.tags ?? [],
  };
  store = [note, ...store];
  emit();
  persist(note.id, { kind: note.kind, title: note.title, body: note.body, tags: note.tags });
  return note;
}

export function useNotes(): Note[] {
  return useSyncExternalStore(subscribe, snapshot, snapshot);
}
