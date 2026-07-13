import { z } from "zod";
import { EVENT_TYPES } from "@ai-coach/shared";

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const onboardingSchema = z.object({
  step1: z.object({
    name: z.string().min(1),
    country: z.string().min(1),
    timezone: z.string().min(1),
    dailyTimeMinutes: z.number().min(5).max(480),
  }),
  step2: z.object({
    mainGoal90Days: z.string().min(1),
    focusArea: z.string().min(1),
  }),
  step3: z.object({
    mainBlocker: z.string().min(1),
    repeatingPattern: z.string().min(1),
    triedBefore: z.string().min(1),
  }),
  step4: z.object({
    hasBusiness: z.boolean(),
    businessName: z.string().optional(),
    offer: z.string().min(1),
    idealCustomer: z.string().min(1),
    mainChannel: z.string().min(1),
    growthGoal: z.string().min(1),
    hardestPart: z.string().min(1),
  }),
  step5: z.object({
    coachingStyle: z.string().min(1),
  }),
  step6: z.object({
    memoryEnabled: z.boolean(),
  }),
});

export const chatMessageSchema = z.object({
  conversation_id: z.string().uuid().optional(),
  message: z.string().min(1).max(4000),
});

export const memorySchema = z.object({
  type: z.string().min(1),
  title: z.string().min(1),
  content: z.string().min(1),
  source: z.string().optional(),
  confidence: z.string().optional(),
});

export const memoryUpdateSchema = memorySchema.partial();

export const goalSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  target_date: z.string().optional(),
  status: z.enum(["active", "completed", "paused", "cancelled"]).optional(),
  progress: z.number().min(0).max(100).optional(),
});

export const checkInSchema = z.object({
  achieved: z.string().min(1),
  notDone: z.string().min(1),
  blocked: z.string().min(1),
  learned: z.string().min(1),
  needToday: z.string().min(1),
  adjustGoal: z.string().optional(),
});

export const eventSchema = z.object({
  event_type: z.enum(EVENT_TYPES),
  source: z.string().default("ai_coach_app"),
  object_type: z.string().optional(),
  object_id: z.string().optional(),
  occurred_at: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
  idempotency_key: z.string().min(1),
});

export const settingsUpdateSchema = z.object({
  memory_enabled: z.boolean().optional(),
  coaching_style: z.string().optional(),
  name: z.string().optional(),
  language: z.string().optional(),
  timezone: z.string().optional(),
});

export const personaSchema = z.object({
  coach_name: z.string().min(1).max(80),
  tagline: z.string().max(160).optional().nullable(),
  avatar: z.string().max(8).optional().nullable(),
  tone: z
    .object({
      directo: z.number().min(0).max(100),
      cercano: z.number().min(0).max(100),
      detallado: z.number().min(0).max(100),
      motivador: z.number().min(0).max(100),
    })
    .partial()
    .optional(),
  voice: z.string().max(1000).optional().nullable(),
  values: z.array(z.string()).max(20).optional(),
  signature_phrases: z.array(z.string()).max(20).optional(),
  dos: z.array(z.string()).max(20).optional(),
  donts: z.array(z.string()).max(20).optional(),
  methodology: z.string().max(2000).optional().nullable(),
  sample_replies: z
    .array(z.object({ q: z.string(), a: z.string() }))
    .max(10)
    .optional(),
  // --- Módulos del constructor de agentes (aditivos, todos opcionales) ---
  objective: z.string().max(500).optional().nullable(),
  role: z.string().max(300).optional().nullable(),
  target_audience: z.string().max(800).optional().nullable(),
  business_context: z.string().max(2000).optional().nullable(),
  instructions: z.string().max(2000).optional().nullable(),
  workflow: z.string().max(2000).optional().nullable(),
  output_format: z.string().max(300).optional().nullable(),
  quality_criteria: z.array(z.string().max(200)).max(10).optional(),
  is_published: z.boolean().optional(),
});

export const personaPreviewSchema = z.object({
  message: z.string().min(1).max(2000),
  persona: personaSchema,
});

export const knowledgeSourceSchema = z.object({
  title: z.string().min(1).max(200),
  type: z.enum(["curso", "pdf", "video", "post"]),
  content: z.string().min(1).max(200000),
});

export const coachMemorySchema = z.object({
  scope: z.enum(["persona", "miembro"]).default("miembro"),
  member_user_id: z.string().uuid().optional().nullable(),
  type: z.string().min(1).max(40),
  content: z.string().min(1).max(2000),
  source: z.string().max(120).optional(),
  consent: z.boolean().optional(),
});

export const memoryConsentSchema = z.object({ consent: z.boolean() });

export const habitCreateSchema = z.object({
  title: z.string().min(1).max(120),
  description: z.string().max(300).optional(),
  category: z.enum(["mente", "cuerpo", "negocio", "orden"]).default("mente"),
  time: z.string().max(20).optional(),
  icon: z.string().max(8).optional(),
});

export const noteCreateSchema = z.object({
  kind: z.enum(["nota", "conversacion"]).default("nota"),
  title: z.string().min(1).max(200),
  body: z.string().max(20000).default(""),
  tags: z.array(z.string()).max(20).optional(),
});

export const taskCreateSchema = z.object({
  title: z.string().min(1).max(200),
  note: z.string().max(500).optional(),
  priority: z.enum(["alta", "media", "baja"]).default("media"),
  due: z.string().max(40).optional(),
  linked_habit: z.string().max(120).optional(),
});

export const taskUpdateSchema = z.object({
  status: z.enum(["pendiente", "en_curso", "hecha"]).optional(),
  title: z.string().min(1).max(200).optional(),
  priority: z.enum(["alta", "media", "baja"]).optional(),
});
