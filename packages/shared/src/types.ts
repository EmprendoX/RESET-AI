export type GoalStatus = "active" | "completed" | "paused" | "cancelled";
export type RecommendationStatus = "pending" | "accepted" | "dismissed" | "completed";
export type TaskStatus = "pending" | "in_progress" | "completed" | "cancelled";
export type MessageRole = "user" | "assistant" | "system";
export type MemoryType =
  | "profile"
  | "goal"
  | "business"
  | "preference"
  | "blocker"
  | "commitment"
  | "learning"
  | "pattern"
  | "decision"
  | "conversation_summary"
  | "progress";
export type MemorySource = "onboarding" | "conversation" | "check_in" | "manual" | "system";
export type CoachingStyle =
  | "directo"
  | "suave"
  | "estrategico"
  | "espiritual"
  | "intenso"
  | "motivador"
  | "practico"
  | "estructurado";
export type FocusArea =
  | "dinero"
  | "negocio"
  | "mentalidad"
  | "disciplina"
  | "habitos"
  | "calma"
  | "ventas"
  | "contenido"
  | "proposito"
  | "productividad"
  | "claridad"
  | "confianza";

export const EVENT_TYPES = [
  "user_signed_up",
  "onboarding_started",
  "onboarding_completed",
  "chat_message_sent",
  "goal_created",
  "goal_completed",
  "memory_created",
  "memory_deleted",
  "recommendation_accepted",
  "recommendation_dismissed",
  "check_in_completed",
  "task_completed",
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export interface OnboardingAnswers {
  step1: {
    name: string;
    country: string;
    timezone: string;
    dailyTimeMinutes: number;
  };
  step2: {
    mainGoal90Days: string;
    focusArea: FocusArea;
  };
  step3: {
    mainBlocker: string;
    repeatingPattern: string;
    triedBefore: string;
  };
  step4: {
    hasBusiness: boolean;
    businessName?: string;
    offer: string;
    idealCustomer: string;
    mainChannel: string;
    growthGoal: string;
    hardestPart: string;
  };
  step5: {
    coachingStyle: CoachingStyle;
  };
  step6: {
    memoryEnabled: boolean;
  };
}

export interface ApiError {
  error: string;
  code?: string;
}

export function generateIdempotencyKey(
  eventType: string,
  userId: string,
  objectId?: string
): string {
  const base = `${eventType}:${userId}:${objectId ?? "none"}:${Date.now()}`;
  return base.slice(0, 128);
}
