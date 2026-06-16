import defaults from "./defaults.json";

export type BrandConfig = typeof defaults;

export const brandConfig: BrandConfig = defaults;

export type FeatureFlagKey =
  | "AI_COACH_ENABLED"
  | "AI_COACH_ONBOARDING_ENABLED"
  | "AI_COACH_CHAT_ENABLED"
  | "AI_COACH_MEMORY_ENABLED"
  | "AI_COACH_GOALS_ENABLED"
  | "AI_COACH_RECOMMENDATIONS_ENABLED"
  | "AI_COACH_CHECK_INS_ENABLED"
  | "AI_COACH_EVENTS_ENABLED";

export function getFeatureFlag(key: FeatureFlagKey): boolean {
  const value = process.env[key];
  if (value === undefined) return true;
  return value === "true" || value === "1";
}

export function getDailyMessageLimit(): number {
  const limit = process.env.AI_COACH_DAILY_MESSAGE_LIMIT;
  return limit ? parseInt(limit, 10) : 30;
}

export function getOpenAiModel(): string {
  return process.env.OPENAI_CHAT_MODEL ?? process.env.OPENAI_MODEL ?? "gpt-4o-mini";
}

export { defaults };
