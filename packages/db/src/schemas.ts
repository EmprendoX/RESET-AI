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
