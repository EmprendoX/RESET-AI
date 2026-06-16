#!/usr/bin/env node
// Evalúa la calidad del coach contra evals/coach-cases.json.
// Mide: fidelidad (cita cuando corresponde) y no-alucinación (rechaza sin inventar).
//
// Uso:
//   COACH_URL=http://localhost:3000/api/coach/ask \
//   COACH_COOKIE="sb-...=...; sb-...=..." \
//   node scripts/eval-coach.mjs
//
// COACH_COOKIE es la cookie de sesión de un usuario logueado (DevTools → Application →
// Cookies). Requiere AUTH_ENABLED=true, OPENAI_API_KEY y material indexado.

import fs from "node:fs";

const URL = process.env.COACH_URL;
const COOKIE = process.env.COACH_COOKIE ?? "";
if (!URL) {
  console.error("Falta COACH_URL (ej. http://localhost:3000/api/coach/ask)");
  process.exit(1);
}

const { cases } = JSON.parse(
  fs.readFileSync(new URL("../evals/coach-cases.json", import.meta.url), "utf8")
);

const REFUSAL = [/no.*(material|información|datos)/i, /no lo tengo/i, /no tengo/i];

let pass = 0;
for (const c of cases) {
  let ok = false;
  let why = "";
  try {
    const res = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: COOKIE },
      body: JSON.stringify({ message: c.question }),
    });
    const d = await res.json().catch(() => ({}));
    const reply = d.reply ?? "";
    const cites = d.citations ?? [];

    if (c.expect.cite) {
      ok = cites.length > 0;
      why = ok ? `citó ${cites.length} fuente(s)` : "esperaba citas y no citó";
    } else if (c.expect.refuse) {
      const refused = REFUSAL.some((r) => r.test(reply)) && cites.length === 0;
      ok = refused;
      why = ok ? "rechazó sin inventar" : "no rechazó / pudo inventar";
    }
  } catch (e) {
    why = `error: ${e.message}`;
  }
  console.log(`${ok ? "PASS" : "FAIL"}  ${c.id}  ${why}`);
  if (ok) pass++;
}

const pct = Math.round((pass / cases.length) * 100);
console.log(`\nFidelidad/anti-alucinación: ${pass}/${cases.length} (${pct}%)`);
process.exit(pass === cases.length ? 0 : 1);
