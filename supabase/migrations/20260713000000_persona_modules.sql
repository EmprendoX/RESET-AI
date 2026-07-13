-- ============================================================
-- Constructor de Agentes — módulos adicionales de la persona.
-- Todo aditivo y nullable: no afecta filas existentes ni el prompt actual.
-- (Aplicado en RESET-HUB / ccxovleaqhifrkiytcpi vía MCP.)
-- ============================================================
ALTER TABLE ai_coach.personas
  ADD COLUMN IF NOT EXISTS objective        TEXT,
  ADD COLUMN IF NOT EXISTS role             TEXT,
  ADD COLUMN IF NOT EXISTS target_audience  TEXT,
  ADD COLUMN IF NOT EXISTS business_context TEXT,
  ADD COLUMN IF NOT EXISTS instructions     TEXT,
  ADD COLUMN IF NOT EXISTS workflow         TEXT,
  ADD COLUMN IF NOT EXISTS output_format    TEXT,
  ADD COLUMN IF NOT EXISTS quality_criteria TEXT[] NOT NULL DEFAULT '{}';
