// ============================================================
// Datos de ejemplo (mock) — Coach RESET-ORDER
// Prototipo de UI: nada de esto toca el backend todavía.
// ============================================================

export interface MockUser {
  name: string;
  email: string;
  streak: number; // racha global en días
  startedDaysAgo: number;
  level: string;
}

export const user: MockUser = {
  name: "Agustín",
  email: "apascalsi@gmail.com",
  streak: 12,
  startedDaysAgo: 34,
  level: "Fase 2 · Constancia",
};

// --- Sistema RESET-ORDER: hábitos / rutinas diarias ----------

export type HabitCategory = "mente" | "cuerpo" | "negocio" | "orden";

export interface Habit {
  id: string;
  title: string;
  description: string;
  category: HabitCategory;
  time: string; // sugerido
  icon: string; // emoji simple
  streak: number;
  done: boolean; // hecho hoy
  // últimos 7 días (índice 0 = hace 6 días ... 6 = hoy)
  week: boolean[];
}

export const categoryMeta: Record<
  HabitCategory,
  { label: string; color: string }
> = {
  mente: { label: "Mente", color: "#5b9bff" },
  cuerpo: { label: "Cuerpo", color: "#2fd486" },
  negocio: { label: "Negocio", color: "#ffb020" },
  orden: { label: "Orden", color: "#b07bff" },
};

export const habits: Habit[] = [
  {
    id: "h1",
    title: "Reset matutino",
    description: "10 min sin pantalla + intención del día",
    category: "mente",
    time: "06:30",
    icon: "🌅",
    streak: 12,
    done: true,
    week: [true, true, true, false, true, true, true],
  },
  {
    id: "h2",
    title: "Mover el cuerpo",
    description: "30 min de movimiento o entrenamiento",
    category: "cuerpo",
    time: "07:15",
    icon: "🏃",
    streak: 8,
    done: true,
    week: [true, false, true, true, true, false, true],
  },
  {
    id: "h3",
    title: "Bloque profundo",
    description: "90 min en la tarea #1 del negocio, sin distracción",
    category: "negocio",
    time: "09:00",
    icon: "🎯",
    streak: 5,
    done: false,
    week: [true, true, false, true, true, true, false],
  },
  {
    id: "h4",
    title: "Ordenar el espacio",
    description: "5 min de orden: escritorio y bandeja de entrada",
    category: "orden",
    time: "18:00",
    icon: "🧹",
    streak: 3,
    done: false,
    week: [false, true, true, false, true, true, false],
  },
  {
    id: "h5",
    title: "Cierre del día",
    description: "Revisar el día y escribir 3 líneas en Notas",
    category: "mente",
    time: "21:30",
    icon: "🌙",
    streak: 12,
    done: false,
    week: [true, true, true, true, true, true, false],
  },
];

export const weekLabels = ["L", "M", "M", "J", "V", "S", "D"];

// --- Tareas (to-do) ------------------------------------------

export type TaskStatus = "pendiente" | "en_curso" | "hecha";
export type TaskPriority = "alta" | "media" | "baja";

export interface TodoTask {
  id: string;
  title: string;
  note?: string;
  status: TaskStatus;
  priority: TaskPriority;
  due: string; // texto legible
  linkedHabit?: string; // título de hábito relacionado
}

export const tasks: TodoTask[] = [
  {
    id: "t1",
    title: "Definir la oferta de los 90 días",
    note: "1 frase clara: a quién, qué resultado, en cuánto tiempo.",
    status: "en_curso",
    priority: "alta",
    due: "Hoy",
    linkedHabit: "Bloque profundo",
  },
  {
    id: "t2",
    title: "Grabar 3 videos cortos",
    status: "pendiente",
    priority: "media",
    due: "Mañana",
    linkedHabit: "Bloque profundo",
  },
  {
    id: "t3",
    title: "Caminar 20 min después de comer",
    status: "pendiente",
    priority: "baja",
    due: "Hoy",
    linkedHabit: "Mover el cuerpo",
  },
  {
    id: "t4",
    title: "Vaciar bandeja de entrada a cero",
    status: "hecha",
    priority: "media",
    due: "Ayer",
    linkedHabit: "Ordenar el espacio",
  },
  {
    id: "t5",
    title: "Planear la semana (domingo)",
    note: "Elegir las 3 prioridades de la semana.",
    status: "pendiente",
    priority: "alta",
    due: "Dom",
  },
];

// --- Notas (bloc) + conversaciones guardadas -----------------

export type NoteKind = "nota" | "conversacion";

export interface Note {
  id: string;
  kind: NoteKind;
  title: string;
  preview: string;
  body: string;
  date: string;
  tags: string[];
}

export const notes: Note[] = [
  {
    id: "n1",
    kind: "nota",
    title: "Mi porqué",
    preview: "Quiero orden para tener libertad, no para controlar todo…",
    body: "Quiero orden para tener libertad, no para controlar todo. Cuando mi día tiene estructura, mi cabeza está tranquila y puedo crear. El reset no es castigo, es volver al centro.",
    date: "Hace 2 días",
    tags: ["mente", "propósito"],
  },
  {
    id: "n2",
    kind: "conversacion",
    title: "Conversación · Bloqueo con la oferta",
    preview: "Coach: ¿Qué pasa cuando te sentás a definir la oferta?…",
    body: "Coach: ¿Qué pasa cuando te sentás a definir la oferta?\nVos: Me trabo, siento que no es suficiente.\nCoach: Esa es la trampa del perfeccionismo. Tu sistema Reset-Order dice acción antes que teoría. Hoy escribí una versión imperfecta en una frase. La mejoramos mañana.",
    date: "Hace 3 días",
    tags: ["negocio", "bloqueo"],
  },
  {
    id: "n3",
    kind: "nota",
    title: "Cierre del día — jueves",
    preview: "1) Cumplí reset y movimiento. 2) Me costó el bloque profundo…",
    body: "1) Cumplí reset y movimiento.\n2) Me costó el bloque profundo, arranqué tarde.\n3) Mañana lo muevo a primera hora, antes del celular.",
    date: "Hace 4 días",
    tags: ["cierre"],
  },
  {
    id: "n4",
    kind: "conversacion",
    title: "Conversación · Plan de 7 días",
    preview: "Coach: Te armo un plan simple para esta semana…",
    body: "Coach: Te armo un plan simple para esta semana, enfocado en constancia, no en intensidad. Día 1: solo reset matutino. Día 2: sumá movimiento. Vamos apilando, no saltando.",
    date: "Hace 6 días",
    tags: ["plan"],
  },
];

// --- Chat del coach ------------------------------------------

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export const sampleConversation: ChatMessage[] = [
  {
    role: "assistant",
    content:
      "Buen día, Agustín. Llevás 12 días de racha — eso es constancia real. Hoy te falta el Bloque profundo y el Cierre del día. ¿Arrancamos por el bloque profundo de 90 min?",
  },
  {
    role: "user",
    content: "Sí, pero estoy medio disperso. No sé por dónde empezar.",
  },
  {
    role: "assistant",
    content:
      "Tu sistema Reset-Order es claro acá: una sola cosa a la vez. Tu tarea #1 de hoy es \"Definir la oferta de los 90 días\". Cerrá todo lo demás, poné 25 minutos y escribí una versión imperfecta. No busques la perfecta, buscá la primera. ¿Listo para arrancar el timer?",
  },
];

export const quickActions = [
  "¿Qué hago hoy?",
  "Revisá mi racha",
  "Me trabé, ayudame",
  "Armá mi plan de 7 días",
  "Prepará mi cierre del día",
  "¿Qué patrón estoy repitiendo?",
];

// --- Progreso ------------------------------------------------

export interface DayProgress {
  label: string;
  pct: number; // 0..100
}

export const last14Days: DayProgress[] = [
  { label: "L", pct: 80 },
  { label: "M", pct: 60 },
  { label: "M", pct: 100 },
  { label: "J", pct: 100 },
  { label: "V", pct: 40 },
  { label: "S", pct: 80 },
  { label: "D", pct: 100 },
  { label: "L", pct: 100 },
  { label: "M", pct: 80 },
  { label: "M", pct: 60 },
  { label: "J", pct: 100 },
  { label: "V", pct: 80 },
  { label: "S", pct: 100 },
  { label: "D", pct: 40 },
];

export const progressStats = {
  cumplimiento30: 78, // % últimos 30 días
  mejorRacha: 18,
  habitosActivos: 5,
  diasPerfectos: 9, // días 100% en el mes
};

// --- Helpers -------------------------------------------------

export function todayDone(list: Habit[] = habits) {
  return list.filter((h) => h.done).length;
}

export function todayPct(list: Habit[] = habits) {
  if (list.length === 0) return 0;
  return Math.round((todayDone(list) / list.length) * 100);
}

export function todayLong() {
  return new Date().toLocaleDateString("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

// --- Persona / clon del creador ------------------------------

export interface PersonaTone {
  directo: number; // 0 suave ... 100 directo
  cercano: number; // 0 formal ... 100 cercano
  detallado: number; // 0 breve ... 100 detallado
  motivador: number; // 0 analítico ... 100 motivador
}

export interface Persona {
  coachName: string;
  creator: string;
  tagline: string;
  avatar: string;
  tone: PersonaTone;
  voice: string;
  values: string[];
  signaturePhrases: string[];
  dos: string[];
  donts: string[];
  methodology: string;
  sampleReplies: { q: string; a: string }[];
  objective: string;
  role: string;
  targetAudience: string;
  businessContext: string;
  instructions: string;
  workflow: string;
  outputFormat: string;
  qualityCriteria: string[];
}

export const persona: Persona = {
  coachName: "Coach RESET-ORDER",
  creator: "Agustín P.",
  tagline: "Orden, reset y crecimiento. Acción antes que teoría.",
  avatar: "🧭",
  tone: { directo: 70, cercano: 75, detallado: 35, motivador: 65 },
  voice:
    "Habla de tú/vos, cercano pero firme. Frases cortas. Empuja a la acción y no deja que el usuario se quede en la teoría. Usa ejemplos concretos.",
  values: ["Constancia", "Claridad", "Acción", "Honestidad", "Orden"],
  signaturePhrases: [
    "Una sola cosa a la vez.",
    "Acción antes que teoría.",
    "No busques la perfecta, buscá la primera.",
    "La constancia le gana a la intensidad.",
  ],
  dos: [
    "Dar un siguiente paso concreto y chico",
    "Recordar el porqué del usuario",
    "Celebrar la racha y el progreso",
  ],
  donts: [
    "Dar consejos genéricos de autoayuda",
    "Abrumar con listas largas",
    "Inventar datos que no están en el material",
  ],
  methodology:
    "Sistema RESET-ORDER: hábitos y rutinas diarias agrupados en 4 pilares (Mente, Cuerpo, Negocio, Orden). Se avanza por constancia, apilando un hábito a la vez.",
  objective: "",
  role: "",
  targetAudience: "",
  businessContext: "",
  instructions: "",
  workflow: "",
  outputFormat: "",
  qualityCriteria: [],
  sampleReplies: [
    {
      q: "No tengo ganas hoy.",
      a: "Te entiendo. No necesitás ganas, necesitás un primer paso chico. Hacé solo el reset matutino de 10 minutos. Una sola cosa. Después vemos.",
    },
    {
      q: "¿Por dónde empiezo con mi negocio?",
      a: "Por una sola cosa: definí tu oferta en una frase. A quién ayudás, qué resultado, en cuánto tiempo. Imperfecta está bien. La acción primero.",
    },
  ],
};

// --- Base de conocimiento ------------------------------------

export type SourceType = "curso" | "pdf" | "video" | "post";
export type IndexStatus = "indexado" | "procesando" | "error";

export interface KnowledgeSource {
  id: string;
  title: string;
  type: SourceType;
  status: IndexStatus;
  chunks: number;
  lessons?: number;
  updated: string;
}

export const sourceMeta: Record<SourceType, { label: string; icon: string; color: string }> = {
  curso: { label: "Curso", icon: "🎓", color: "#5b9bff" },
  pdf: { label: "PDF", icon: "📄", color: "#ff5470" },
  video: { label: "Video", icon: "🎬", color: "#ffb020" },
  post: { label: "Post", icon: "✍️", color: "#2fd486" },
};

export const knowledgeSources: KnowledgeSource[] = [
  { id: "k1", title: "Curso: El Sistema RESET-ORDER (12 lecciones)", type: "curso", status: "indexado", chunks: 184, lessons: 12, updated: "Hace 2 días" },
  { id: "k2", title: "Masterclass: Oferta de 90 días", type: "video", status: "indexado", chunks: 96, updated: "Hace 5 días" },
  { id: "k3", title: "Guía PDF: Rutina matutina de 10 min", type: "pdf", status: "indexado", chunks: 22, updated: "Hace 1 semana" },
  { id: "k4", title: "Curso: Constancia sobre intensidad", type: "curso", status: "procesando", chunks: 0, lessons: 8, updated: "Subiendo ahora" },
  { id: "k5", title: "Hilo: 7 errores al empezar", type: "post", status: "indexado", chunks: 14, updated: "Hace 2 semanas" },
];

export interface Citation {
  source: string;
  lesson: string;
}

export const kbPreview: { q: string; a: string; citations: Citation[] } = {
  q: "¿Cómo armo mi rutina de la mañana?",
  a: "Empezá con 10 minutos sin pantalla y una intención clara del día. No sumes más hábitos hasta que ese esté firme — constancia sobre intensidad. Cuando lo cumplas 7 días seguidos, sumás el movimiento.",
  citations: [
    { source: "Guía: Rutina matutina de 10 min", lesson: "Paso 1 · El reset" },
    { source: "Curso: El Sistema RESET-ORDER", lesson: "Lección 3 · Apilar hábitos" },
  ],
};

// --- Memoria -------------------------------------------------

export interface Member {
  id: string;
  name: string;
  initial: string;
  joined: string;
  memories: number;
}

export const members: Member[] = [
  { id: "m1", name: "Lucía R.", initial: "L", joined: "hace 3 sem", memories: 6 },
  { id: "m2", name: "Marcos T.", initial: "M", joined: "hace 1 mes", memories: 9 },
  { id: "m3", name: "Sofía V.", initial: "S", joined: "hace 5 días", memories: 3 },
];

export type MemoryScope = "persona" | "miembro";

export interface MemoryItem {
  id: string;
  scope: MemoryScope;
  memberId?: string;
  type: string; // meta, preferencia, bloqueo, contexto, hecho
  content: string;
  source: string; // de dónde lo aprendió
  consent: boolean;
  date: string;
}

export const memoryItems: MemoryItem[] = [
  // Persona (sobre el creador / marca)
  { id: "me1", scope: "persona", type: "estilo", content: "El coach nunca da consejos genéricos; siempre pide un paso concreto.", source: "Constructor de persona", consent: true, date: "Hace 1 mes" },
  { id: "me2", scope: "persona", type: "marca", content: "El método se llama RESET-ORDER y se basa en 4 pilares diarios.", source: "Base de conocimiento", consent: true, date: "Hace 1 mes" },
  // Miembro: Lucía
  { id: "me3", scope: "miembro", memberId: "m1", type: "meta", content: "Quiere lanzar su tienda online en 90 días.", source: "Onboarding", consent: true, date: "Hace 3 sem" },
  { id: "me4", scope: "miembro", memberId: "m1", type: "bloqueo", content: "Se traba con el perfeccionismo al crear contenido.", source: "Chat · 12 jun", consent: true, date: "Hace 4 días" },
  { id: "me5", scope: "miembro", memberId: "m1", type: "preferencia", content: "Prefiere mensajes cortos y por la mañana.", source: "Chat", consent: false, date: "Hace 1 sem" },
  // Miembro: Marcos
  { id: "me6", scope: "miembro", memberId: "m2", type: "meta", content: "Recuperar la rutina de ejercicio 4x por semana.", source: "Onboarding", consent: true, date: "Hace 1 mes" },
  { id: "me7", scope: "miembro", memberId: "m2", type: "contexto", content: "Trabaja de noche, entrena mejor a la tarde.", source: "Chat", consent: true, date: "Hace 2 sem" },
];
