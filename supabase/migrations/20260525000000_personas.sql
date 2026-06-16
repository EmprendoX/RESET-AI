-- ============================================================
-- Fase 2 — Motor de Persona
-- La "persona" es la personalidad/voz del clon de IA de cada creador.
-- Una persona por creador (de momento). Se compila en el system prompt del chat.
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_coach.personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL UNIQUE REFERENCES ai_coach.creators(id) ON DELETE CASCADE,
  coach_name TEXT NOT NULL DEFAULT 'Coach',
  tagline TEXT,
  avatar TEXT,
  tone JSONB NOT NULL DEFAULT '{}'::jsonb,          -- {directo,cercano,detallado,motivador} 0..100
  voice TEXT,
  values TEXT[] NOT NULL DEFAULT '{}',
  signature_phrases TEXT[] NOT NULL DEFAULT '{}',
  dos TEXT[] NOT NULL DEFAULT '{}',
  donts TEXT[] NOT NULL DEFAULT '{}',
  methodology TEXT,
  sample_replies JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{q,a}]
  is_published BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE ai_coach.personas ENABLE ROW LEVEL SECURITY;

-- El dueño del creador gestiona su persona.
CREATE POLICY personas_owner_manage ON ai_coach.personas
  FOR ALL USING (creator_id IN (SELECT ai_coach.creator_ids_owned()))
  WITH CHECK (creator_id IN (SELECT ai_coach.creator_ids_owned()));

-- Los miembros pueden leer la persona PUBLICADA de los creadores a los que pertenecen.
CREATE POLICY personas_member_read ON ai_coach.personas
  FOR SELECT USING (
    is_published AND creator_id IN (SELECT ai_coach.creator_ids_member())
  );

GRANT SELECT, INSERT, UPDATE, DELETE ON ai_coach.personas
  TO anon, authenticated, service_role;
