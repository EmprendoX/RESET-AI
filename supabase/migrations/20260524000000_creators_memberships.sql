-- ============================================================
-- Fase 1 — Multi-tenant: creadores y membresías
-- Un "creador" es el influencer que clona su mentoría. Un usuario puede ser
-- creador (dueño de su espacio) y/o miembro de la comunidad de otro creador.
-- Comparte auth.users con RESET-HUB (mismo login en todo el hub).
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_coach.creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  handle TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (owner_user_id)
);

CREATE TABLE IF NOT EXISTS ai_coach.memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES ai_coach.creators(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('creator', 'member')),
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (creator_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_memberships_user ON ai_coach.memberships(user_id, role);
CREATE INDEX IF NOT EXISTS idx_creators_owner ON ai_coach.creators(owner_user_id);

-- Helpers SECURITY DEFINER: leen sin disparar RLS (evita recursión en las policies).
CREATE OR REPLACE FUNCTION ai_coach.creator_ids_owned()
RETURNS SETOF UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ai_coach AS $$
  SELECT id FROM ai_coach.creators WHERE owner_user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION ai_coach.creator_ids_member()
RETURNS SETOF UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ai_coach AS $$
  SELECT creator_id FROM ai_coach.memberships
  WHERE user_id = auth.uid() AND status = 'active';
$$;

CREATE OR REPLACE FUNCTION ai_coach.is_creator()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ai_coach AS $$
  SELECT EXISTS (
    SELECT 1 FROM ai_coach.memberships
    WHERE user_id = auth.uid() AND role = 'creator' AND status = 'active'
  );
$$;

-- RLS
ALTER TABLE ai_coach.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_coach.memberships ENABLE ROW LEVEL SECURITY;

-- creators: el dueño gestiona; los miembros pueden ver el creador al que pertenecen.
CREATE POLICY creators_owner_all ON ai_coach.creators
  FOR ALL USING (owner_user_id = auth.uid()) WITH CHECK (owner_user_id = auth.uid());
CREATE POLICY creators_member_read ON ai_coach.creators
  FOR SELECT USING (id IN (SELECT ai_coach.creator_ids_member()));

-- memberships: el usuario ve las suyas; el dueño del creador gestiona las de su espacio.
CREATE POLICY memberships_self_read ON ai_coach.memberships
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY memberships_owner_manage ON ai_coach.memberships
  FOR ALL USING (creator_id IN (SELECT ai_coach.creator_ids_owned()))
  WITH CHECK (creator_id IN (SELECT ai_coach.creator_ids_owned()));

-- Grants (estas tablas son nuevas; el grant del init no las cubre).
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_coach.creators, ai_coach.memberships
  TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION ai_coach.creator_ids_owned(), ai_coach.creator_ids_member(), ai_coach.is_creator()
  TO anon, authenticated, service_role;
