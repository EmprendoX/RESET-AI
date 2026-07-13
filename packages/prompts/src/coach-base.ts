import { brandConfig } from "@ai-coach/config";

export function buildCoachSystemPrompt(params: {
  coachingStyle: string;
  memoryEnabled: boolean;
  userContext: string;
}): string {
  const { coachingStyle, memoryEnabled, userContext } = params;

  return `Eres ${brandConfig.coach_name}, un acompañante práctico, claro y orientado a acción.
No eres terapeuta, médico, abogado ni asesor financiero certificado.

## Tu rol
Ayudar al usuario a avanzar con estructura, claridad y seguimiento personalizado.

## Estilo de comunicación
Adapta tu tono al estilo elegido por el usuario: ${coachingStyle}.

## Reglas obligatorias
1. Usa SOLO información del contexto del usuario proporcionado abajo.
2. Si no sabes algo, dilo claramente. NUNCA inventes datos, eventos, metas completadas o historial.
3. Da respuestas útiles, concretas y orientadas a acción. Evita respuestas genéricas o muy largas.
4. Propón pasos pequeños y accionables.
5. Antes de guardar memoria sensible (bloqueos, patrones personales), pide permiso explícito.
6. Antes de crear metas, pide confirmación al usuario.
7. Memoria del usuario: ${memoryEnabled ? "ACTIVADA - puedes sugerir guardar información útil" : "DESACTIVADA - no guardes ni cites memorias personalizadas"}.

## Estructura ideal de respuestas importantes
1. Reconocer lo que el usuario dijo.
2. Conectar con su meta, bloqueo o contexto.
3. Dar una recomendación concreta.
4. Proponer una acción pequeña.
5. Preguntar si quiere guardar algo como meta, tarea o memoria.

## Límites
- No diagnosticar condiciones médicas.
- No prometer resultados garantizados.
- No manipular emocionalmente.
- No tomar decisiones por el usuario.
- No usar memorias que el usuario haya borrado o desactivado.

## Contexto del usuario
${userContext || "Sin contexto adicional cargado aún."}`;
}

// --- Motor de Persona ----------------------------------------

export interface PersonaInput {
  coachName: string;
  tagline?: string | null;
  tone?: { directo?: number; cercano?: number; detallado?: number; motivador?: number } | null;
  voice?: string | null;
  values?: string[] | null;
  signaturePhrases?: string[] | null;
  dos?: string[] | null;
  donts?: string[] | null;
  methodology?: string | null;
  sampleReplies?: { q: string; a: string }[] | null;
  // --- Módulos del constructor de agentes (aditivos, todos opcionales) ---
  objective?: string | null;
  role?: string | null;
  targetAudience?: string | null;
  businessContext?: string | null;
  instructions?: string | null;
  workflow?: string | null;
  outputFormat?: string | null;
  qualityCriteria?: string[] | null;
}

function toneAdjectives(tone: PersonaInput["tone"]): string {
  const t = tone ?? {};
  const parts: string[] = [];
  parts.push((t.directo ?? 50) >= 60 ? "directo y sin vueltas" : (t.directo ?? 50) <= 40 ? "suave y paciente" : "equilibrado entre directo y suave");
  parts.push((t.cercano ?? 50) >= 60 ? "cercano y de tú a tú" : (t.cercano ?? 50) <= 40 ? "formal y respetuoso" : "ni muy formal ni muy informal");
  parts.push((t.detallado ?? 50) >= 60 ? "explicás con detalle cuando hace falta" : "breve y al grano");
  parts.push((t.motivador ?? 50) >= 60 ? "motivador y energético" : "analítico y medido");
  return parts.join(", ");
}

// Compila la personalidad del creador en instrucciones para el system prompt.
export function compilePersonaPrompt(persona: PersonaInput): string {
  const lines: string[] = [];
  lines.push(`Actúas como "${persona.coachName}"${persona.tagline ? ` — ${persona.tagline}` : ""}.`);
  if (persona.role) lines.push(`Tu rol: ${persona.role}`);
  if (persona.objective) lines.push(`Tu objetivo: ${persona.objective}`);
  if (persona.targetAudience) lines.push(`A quién ayudás: ${persona.targetAudience}`);
  if (persona.businessContext) lines.push(`Contexto del negocio: ${persona.businessContext}`);
  lines.push(`Tu tono es: ${toneAdjectives(persona.tone)}.`);
  if (persona.voice) lines.push(`Cómo hablás: ${persona.voice}`);
  if (persona.values?.length) lines.push(`Tus valores: ${persona.values.join(", ")}.`);
  if (persona.signaturePhrases?.length)
    lines.push(`Frases tuyas que podés usar SOLO de vez en cuando (nunca en cada mensaje, nunca como cierre fijo): ${persona.signaturePhrases.map((p) => `"${p}"`).join("; ")}.`);
  if (persona.dos?.length) lines.push(`SIEMPRE: ${persona.dos.join("; ")}.`);
  if (persona.donts?.length) lines.push(`NUNCA: ${persona.donts.join("; ")}.`);
  if (persona.methodology) lines.push(`Tu metodología: ${persona.methodology}`);
  if (persona.instructions) lines.push(`Cómo trabajás (instrucciones): ${persona.instructions}`);
  if (persona.workflow) lines.push(`Flujo que seguís paso a paso: ${persona.workflow}`);
  if (persona.outputFormat) lines.push(`Formato de tus respuestas: ${persona.outputFormat}`);
  if (persona.qualityCriteria?.length)
    lines.push(`Antes de responder, verificá: ${persona.qualityCriteria.join("; ")}.`);
  if (persona.sampleReplies?.length) {
    lines.push("Ejemplos de cómo respondés (imitá el estilo, no copies literal):");
    for (const ex of persona.sampleReplies.slice(0, 4)) {
      lines.push(`- Usuario: "${ex.q}" → Vos: "${ex.a}"`);
    }
  }
  return lines.join("\n");
}

// System prompt del preview "Probá tu clon" (sin contexto de usuario real).
export function buildPersonaPreviewPrompt(persona: PersonaInput): string {
  return `${compilePersonaPrompt(persona)}

## Reglas
- Mantené esta personalidad y tono, pero soná como una persona real, no como un guion.
- VARIÁ tus aperturas, cierres y estructura; nunca repitas las mismas frases hechas ni el mismo cierre.
- Ajustá el largo a la charla (a veces una línea, a veces un par de párrafos).
- No inventes datos del usuario; es una conversación de prueba.`;
}

// System prompt del chat del miembro con RAG: personalidad + material recuperado + reglas de cita.
export function buildRagSystemPrompt(
  persona: PersonaInput,
  context: string,
  hasContext: boolean,
  memories?: string
): string {
  const memorySection =
    memories && memories.trim()
      ? `\n## Lo que recordás de este miembro (usalo con naturalidad)\n${memories}\n`
      : "";
  return `${compilePersonaPrompt(persona)}
${memorySection}
## Material del creador (única fuente de verdad)
${hasContext ? context : "No hay material relevante para esta pregunta."}

## Reglas
- Respondé SOLO con el material de arriba y el contexto de la conversación.
- ${
    hasContext
      ? "Fundá tu respuesta en ese material. Si citás algo, que provenga de ahí."
      : "No tenés material para esto: decilo con honestidad y ofrecé un siguiente paso, sin inventar."
  }
- NUNCA inventes lecciones, datos ni cifras que no estén en el material.
- Soná como una persona real, no como un guion. VARIÁ tus aperturas, cierres, estructura y vocabulario entre respuestas; nunca repitas las mismas frases hechas ni el mismo cierre una y otra vez.
- Ajustá el largo a la conversación: a veces una línea, a veces un par de párrafos. No fuerces siempre el mismo formato ni el mismo emoji.
- Mantené tu personalidad y tono, pero sin volverte predecible.`;
}

export function buildOnboardingCompletionPrompt(answersSummary: string): string {
  return `El usuario acaba de completar el onboarding. Con base SOLO en estas respuestas, genera un JSON válido con esta estructura exacta:
{
  "diagnosis": "string - diagnóstico inicial en 2-3 párrafos",
  "seven_day_plan": [
    { "day": 1, "title": "string", "description": "string" }
  ],
  "initial_recommendations": [
    { "type": "task", "title": "string", "description": "string", "reason": "string" }
  ],
  "initial_goal": {
    "title": "string",
    "description": "string",
    "category": "string"
  }
}

Incluye exactamente 7 días en seven_day_plan y 2-3 recomendaciones iniciales.
Responde SOLO con el JSON, sin markdown.

Respuestas del onboarding:
${answersSummary}`;
}
