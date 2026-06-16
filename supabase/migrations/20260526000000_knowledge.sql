-- ============================================================
-- Fase 3 — Base de conocimiento (RAG)
-- Fuentes del creador (cursos, PDFs, videos, posts) → fragmentos con embeddings.
-- El coach recupera fragmentos relevantes por creador y responde con cita (Fase 4).
-- ============================================================

CREATE TABLE IF NOT EXISTS ai_coach.knowledge_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES ai_coach.creators(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('curso','pdf','video','post')),
  storage_path TEXT,
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente','procesando','indexado','error')),
  error TEXT,
  chunks INT NOT NULL DEFAULT 0,
  lessons INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_coach.kb_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID NOT NULL REFERENCES ai_coach.knowledge_sources(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES ai_coach.creators(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  lesson_label TEXT,
  embedding vector(1536),
  token_count INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_kb_chunks_creator ON ai_coach.kb_chunks(creator_id);
CREATE INDEX IF NOT EXISTS idx_kb_sources_creator ON ai_coach.knowledge_sources(creator_id, created_at DESC);
-- Índice vectorial (coseno). HNSW para buena recuperación.
CREATE INDEX IF NOT EXISTS idx_kb_chunks_embedding
  ON ai_coach.kb_chunks USING hnsw (embedding vector_cosine_ops);

ALTER TABLE ai_coach.knowledge_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_coach.kb_chunks ENABLE ROW LEVEL SECURITY;

-- El dueño gestiona; los miembros pueden VER las fuentes (metadatos) de sus creadores.
CREATE POLICY kb_sources_owner_manage ON ai_coach.knowledge_sources
  FOR ALL USING (creator_id IN (SELECT ai_coach.creator_ids_owned()))
  WITH CHECK (creator_id IN (SELECT ai_coach.creator_ids_owned()));
CREATE POLICY kb_sources_member_read ON ai_coach.knowledge_sources
  FOR SELECT USING (creator_id IN (SELECT ai_coach.creator_ids_member()));

-- Los chunks (texto + embedding) solo los gestiona el dueño. Los miembros NO leen chunks
-- directamente: el acceso a su contenido es vía la función de recuperación (SECURITY DEFINER).
CREATE POLICY kb_chunks_owner_manage ON ai_coach.kb_chunks
  FOR ALL USING (creator_id IN (SELECT ai_coach.creator_ids_owned()))
  WITH CHECK (creator_id IN (SELECT ai_coach.creator_ids_owned()));

-- Recuperación semántica top-k, acotada por creador. SECURITY DEFINER para que el chat
-- del miembro pueda recuperar contexto del creador sin exponer toda la tabla.
CREATE OR REPLACE FUNCTION ai_coach.match_kb_chunks(
  p_creator_id UUID,
  p_query vector(1536),
  p_k INT DEFAULT 6
)
RETURNS TABLE (content TEXT, lesson_label TEXT, source_id UUID, similarity FLOAT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ai_coach AS $$
  SELECT c.content, c.lesson_label, c.source_id,
         1 - (c.embedding <=> p_query) AS similarity
  FROM ai_coach.kb_chunks c
  WHERE c.creator_id = p_creator_id AND c.embedding IS NOT NULL
  ORDER BY c.embedding <=> p_query
  LIMIT GREATEST(p_k, 1);
$$;

GRANT SELECT, INSERT, UPDATE, DELETE ON ai_coach.knowledge_sources, ai_coach.kb_chunks
  TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION ai_coach.match_kb_chunks(UUID, vector, INT)
  TO anon, authenticated, service_role;
