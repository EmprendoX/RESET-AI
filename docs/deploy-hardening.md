# Deploy y endurecimiento (Fase 7)

Guía para llevar RESET-ORDER Coach a producción de forma segura y controlada en costo.

## 1. Deploy (Vercel + Supabase)

- **Supabase:** aplicá las 6 migraciones (`supabase db push`), exponé el schema `ai_coach`
  en Settings → API → Exposed schemas, y habilitá las extensiones `pgcrypto` y `vector`
  (se crean en la migración init).
- **Vercel:** el `apps/web` se despliega solo. Cargá en *Settings → Environment Variables*
  (preview y production):
  - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
  - `OPENAI_API_KEY`, `OPENAI_CHAT_MODEL`, `EMBEDDING_MODEL`
  - `AUTH_ENABLED=true`, `AI_COACH_DAILY_MESSAGE_LIMIT` (ej. 30)
- **Rollout por etapas:** 1 creador piloto → beta cerrada → general. Mantené el flag
  `AUTH_ENABLED` y los `AI_COACH_*_ENABLED` para apagar features sin redeploy.

## 2. Seguridad / privacidad

- **RLS en todas las tablas** (verificado con 2 usuarios). El `service_role` solo se usa
  server-side (rutas de API); nunca llega al cliente.
- **Consentimiento de memoria:** una memoria con `consent = false` NUNCA entra al contexto
  del modelo (filtrado en SQL + RLS). "Olvidar" borra de forma permanente.
- **Funciones de recuperación** (`match_kb_chunks`, `match_coach_memories`) son
  `SECURITY DEFINER` y filtran por creador/miembro: no exponen datos de otros.
- **Derecho al olvido:** `DELETE` real en notas, tareas, memorias y fuentes (cascada de chunks).

## 3. Control de costo (tokens y embeddings)

- **Rate limit diario** por usuario en el chat (`/api/coach/ask` → `usage_counters`),
  configurable con `AI_COACH_DAILY_MESSAGE_LIMIT`. Devuelve 429 al pasarse.
- **Modelos baratos por defecto:** `gpt-4o-mini` (chat) y `text-embedding-3-small` (1536).
- **Recuperación acotada:** `k=6` (conocimiento) y `k=5` (memoria), con umbral de similitud
  para no inflar el prompt.
- **Truncado de entradas:** mensajes a 4000 chars, historial a 6 turnos, ingesta a 200k chars.
- **Embeddings de ingesta** se calculan una sola vez por fragmento (no en cada query).
- Configurá **alertas de gasto** en el panel de OpenAI.

## 4. Observabilidad

- `/api/coach/ask` emite un log estructurado por respuesta:
  `{ evt, creator, ms, chunks, memories, tokens, cites, daily }`.
  En Vercel se ven en *Logs*; se pueden enviar a un destino (Datadog/Logflare) o sumar Sentry
  para errores.
- `audit_logs` y `user_events` (ya en el schema) registran mutaciones sensibles e hitos.

## 5. Evals de calidad del coach

Mide fidelidad (cita cuando corresponde) y no-alucinación (rechaza sin inventar):

```bash
COACH_URL=https://tu-app.vercel.app/api/coach/ask \
COACH_COOKIE="<cookie de sesión de un usuario logueado>" \
node scripts/eval-coach.mjs
```

Casos en `evals/coach-cases.json` (editables). Corré la suite tras cambios de prompt,
persona o material y exigí un umbral (ej. 100% de los casos) antes de promover a producción.

## 6. Pendientes / siguientes mejoras

- Ingesta de **PDF/video binarios** (pdf-parse / Whisper) y, para archivos grandes,
  mover la indexación a una **Edge Function** en background.
- Reescritura de query antes de recuperar (mejora recall en preguntas vagas).
- Caché de embeddings de queries frecuentes.
- Tests E2E (Playwright) de los flujos críticos y unit tests del chunking / prompt.
