-- ============================================================
-- Fase 5 — Memoria del coach (por miembro + de la persona), con consentimiento
-- El coach recuerda al miembro entre conversaciones. El miembro decide qué se guarda
-- (consent). Tabla nueva y dedicada (no toca la `memories` del modelo viejo).
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_coach.coach_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES ai_coach.creators(id) ON DELETE CASCADE,
  scope TEXT NOT NULL CHECK (scope IN ('persona','miembro')),
  member_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- null si scope='persona'
  type TEXT NOT NULL DEFAULT 'hecho',
  content TEXT NOT NULL,
  source TEXT,
  consent BOOLEAN NOT NULL DEFAULT false,
  embedding extensions.vector(1536),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coach_mem_creator ON ai_coach.coach_memories(creator_id, scope);
CREATE INDEX IF NOT EXISTS idx_coach_mem_member ON ai_coach.coach_memories(member_user_id);
CREATE INDEX IF NOT EXISTS idx_coach_mem_embedding
  ON ai_coach.coach_memories USING hnsw (embedding extensions.vector_cosine_ops);

ALTER TABLE ai_coach.coach_memories ENABLE ROW LEVEL SECURITY;

-- El dueño del creador ve/gestiona las memorias de su espacio.
CREATE POLICY coach_mem_owner_manage ON ai_coach.coach_memories
  FOR ALL USING (creator_id IN (SELECT ai_coach.creator_ids_owned()))
  WITH CHECK (creator_id IN (SELECT ai_coach.creator_ids_owned()));

-- El miembro ve/gestiona SUS propias memorias (incluido el consentimiento y "olvidar").
CREATE POLICY coach_mem_member_manage ON ai_coach.coach_memories
  FOR ALL USING (member_user_id = auth.uid())
  WITH CHECK (member_user_id = auth.uid());

-- Recuperación semántica de memorias del miembro CON consentimiento. SECURITY DEFINER
-- para que el chat pueda traer el recuerdo justo sin exponer toda la tabla.
CREATE OR REPLACE FUNCTION ai_coach.match_coach_memories(
  p_creator_id UUID,
  p_member_user_id UUID,
  p_query extensions.vector(1536),
  p_k INT DEFAULT 5
)
RETURNS TABLE (type TEXT, content TEXT, similarity FLOAT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ai_coach, extensions AS $$
  SELECT m.type, m.content,
         1 - (m.embedding <=> p_query) AS similarity
  FROM ai_coach.coach_memories m
  WHERE m.creator_id = p_creator_id
    AND m.scope = 'miembro'
    AND m.member_user_id = p_member_user_id
    AND m.consent = true
    AND m.embedding IS NOT NULL
  ORDER BY m.embedding <=> p_query
  LIMIT GREATEST(p_k, 1);
$$;

GRANT SELECT, INSERT, UPDATE, DELETE ON ai_coach.coach_memories
  TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION ai_coach.match_coach_memories(UUID, UUID, extensions.vector, INT)
  TO anon, authenticated, service_role;
