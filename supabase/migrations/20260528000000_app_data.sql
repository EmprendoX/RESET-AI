-- ============================================================
-- Fase 6 — Datos de la app del miembro: hábitos, registros, notas y tareas
-- Todo scoped por user_id (datos personales del miembro). RLS por auth.uid().
-- Tablas dedicadas para no chocar con `tasks` (plan 7 días del agente).
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_coach.habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'mente' CHECK (category IN ('mente','cuerpo','negocio','orden')),
  time TEXT,
  icon TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_coach.habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES ai_coach.habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day DATE NOT NULL,
  done BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (habit_id, day)
);

CREATE TABLE IF NOT EXISTS ai_coach.notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'nota' CHECK (kind IN ('nota','conversacion')),
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_coach.app_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  note TEXT,
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente','en_curso','hecha')),
  priority TEXT NOT NULL DEFAULT 'media' CHECK (priority IN ('alta','media','baja')),
  due TEXT,
  linked_habit TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_habits_user ON ai_coach.habits(user_id, active);
CREATE INDEX IF NOT EXISTS idx_habit_logs_user ON ai_coach.habit_logs(user_id, day DESC);
CREATE INDEX IF NOT EXISTS idx_notes_user ON ai_coach.notes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_app_tasks_user ON ai_coach.app_tasks(user_id, status);

ALTER TABLE ai_coach.habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_coach.habit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_coach.notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_coach.app_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY habits_own ON ai_coach.habits
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY habit_logs_own ON ai_coach.habit_logs
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY notes_own ON ai_coach.notes
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY app_tasks_own ON ai_coach.app_tasks
  FOR ALL USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE, DELETE
  ON ai_coach.habits, ai_coach.habit_logs, ai_coach.notes, ai_coach.app_tasks
  TO anon, authenticated, service_role;
