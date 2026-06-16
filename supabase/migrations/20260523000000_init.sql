-- AI Coach MVP Schema
-- Isolated in its own `ai_coach` schema so it can safely share a Supabase
-- project with another app (RESET-HUB community) without colliding with `public`.
-- NOTE: No trigger on auth.users — coach profile rows are bootstrapped from the
-- app (see ensureCoachProfile in packages/db) to avoid clobbering the shared
-- public.handle_new_user / on_auth_user_created trigger.

-- Extensiones requeridas (idempotentes).
-- pgcrypto: gen_random_uuid(). vector: embeddings para la base de conocimiento (Fase 3+).
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS vector;

CREATE SCHEMA IF NOT EXISTS ai_coach;
GRANT USAGE ON SCHEMA ai_coach TO anon, authenticated, service_role;

-- Users profile (extends auth.users)
CREATE TABLE IF NOT EXISTS ai_coach.users_profile (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_login_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS ai_coach.coach_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  language TEXT NOT NULL DEFAULT 'es',
  timezone TEXT,
  main_focus TEXT,
  coaching_style TEXT,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  memory_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_coach.onboarding_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  answers_json JSONB NOT NULL DEFAULT '{}',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_coach.business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  has_business BOOLEAN NOT NULL DEFAULT false,
  business_name TEXT,
  business_type TEXT,
  offer TEXT,
  ideal_customer TEXT,
  main_channel TEXT,
  monthly_goal TEXT,
  main_blocker TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_coach.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  target_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_by TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_coach.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_coach.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_coach.conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_coach.memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  confidence TEXT NOT NULL DEFAULT 'medium',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_coach.recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_by TEXT NOT NULL DEFAULT 'coach',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_coach.check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers_json JSONB NOT NULL DEFAULT '{}',
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_coach.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  due_date DATE,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_coach.user_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'ai_coach_app',
  object_type TEXT,
  object_id TEXT,
  metadata_json JSONB,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  idempotency_key TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS ai_coach.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  metadata_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_coach.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  enabled BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_coach.usage_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  coach_messages INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, day)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_goals_user_status ON ai_coach.goals(user_id, status);
CREATE INDEX IF NOT EXISTS idx_memories_user_active ON ai_coach.memories(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON ai_coach.messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_user_events_user ON ai_coach.user_events(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_user_status ON ai_coach.recommendations(user_id, status);

-- RLS
ALTER TABLE ai_coach.users_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_coach.coach_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_coach.onboarding_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_coach.business_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_coach.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_coach.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_coach.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_coach.memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_coach.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_coach.check_ins ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_coach.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_coach.user_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_coach.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_coach.feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_coach.usage_counters ENABLE ROW LEVEL SECURITY;

-- Users can only access own data
CREATE POLICY users_profile_own ON ai_coach.users_profile FOR ALL USING (id = auth.uid());
CREATE POLICY coach_profiles_own ON ai_coach.coach_profiles FOR ALL USING (user_id = auth.uid());
CREATE POLICY onboarding_forms_own ON ai_coach.onboarding_forms FOR ALL USING (user_id = auth.uid());
CREATE POLICY business_profiles_own ON ai_coach.business_profiles FOR ALL USING (user_id = auth.uid());
CREATE POLICY goals_own ON ai_coach.goals FOR ALL USING (user_id = auth.uid());
CREATE POLICY conversations_own ON ai_coach.conversations FOR ALL USING (user_id = auth.uid());
CREATE POLICY messages_own ON ai_coach.messages FOR ALL USING (user_id = auth.uid());
CREATE POLICY memories_own ON ai_coach.memories FOR ALL USING (user_id = auth.uid());
CREATE POLICY recommendations_own ON ai_coach.recommendations FOR ALL USING (user_id = auth.uid());
CREATE POLICY check_ins_own ON ai_coach.check_ins FOR ALL USING (user_id = auth.uid());
CREATE POLICY tasks_own ON ai_coach.tasks FOR ALL USING (user_id = auth.uid());
CREATE POLICY user_events_own ON ai_coach.user_events FOR ALL USING (user_id = auth.uid());
CREATE POLICY usage_counters_own ON ai_coach.usage_counters FOR ALL USING (user_id = auth.uid());

-- Audit logs: users see own, admins see all
CREATE POLICY audit_logs_own ON ai_coach.audit_logs FOR SELECT USING (user_id = auth.uid() OR user_id IS NULL);
CREATE POLICY audit_logs_insert ON ai_coach.audit_logs FOR INSERT WITH CHECK (true);

-- Feature flags: readable by all authenticated
CREATE POLICY feature_flags_read ON ai_coach.feature_flags FOR SELECT TO authenticated USING (true);

-- Table grants (RLS still enforced)
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ai_coach TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA ai_coach TO anon, authenticated, service_role;

-- Seed feature flags
INSERT INTO ai_coach.feature_flags (key, enabled, description) VALUES
  ('AI_COACH_ENABLED', true, 'Master switch'),
  ('AI_COACH_ONBOARDING_ENABLED', true, 'Onboarding flow'),
  ('AI_COACH_CHAT_ENABLED', true, 'Chat with coach'),
  ('AI_COACH_MEMORY_ENABLED', true, 'Memory system'),
  ('AI_COACH_GOALS_ENABLED', true, 'Goals system'),
  ('AI_COACH_RECOMMENDATIONS_ENABLED', true, 'Recommendations'),
  ('AI_COACH_CHECK_INS_ENABLED', true, 'Check-ins'),
  ('AI_COACH_EVENTS_ENABLED', true, 'Internal events')
ON CONFLICT (key) DO NOTHING;
