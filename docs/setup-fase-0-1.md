# Runbook — Fase 0 y 1 (de prototipo a real)

Esta guía cubre lo que ya quedó hecho en el código y **los pasos manuales que tenés que
hacer vos** en Supabase/Vercel. Mientras `AUTH_ENABLED=false`, el prototipo sigue
funcionando con datos mock sin login.

---

## Lo que ya quedó hecho en el repo (Fase 0 + 1)

- Migración `ai_coach` aplicada como base (schema aislado, RLS, extensiones `pgcrypto` y
  `vector` al inicio, seed idempotente con `ON CONFLICT`).
- Clientes Supabase (browser, server, service, anon) apuntando al schema `ai_coach`.
- Nueva migración `20260524000000_creators_memberships.sql`: tablas `creators` y
  `memberships` + RLS + funciones helper (`creator_ids_owned`, `creator_ids_member`, `is_creator`).
- `ensureCreatorWorkspace()` en `@ai-coach/db`: crea el espacio de creador + membresía al
  primer login/signup (idempotente). Conectado en las rutas de auth.
- Middleware real con roles **detrás del flag `AUTH_ENABLED`** (apagado por defecto).
- `.env.example` y `.env.local` con `OPENAI_CHAT_MODEL`, `EMBEDDING_MODEL`, `AUTH_ENABLED`.

---

## Pasos manuales (en orden)

### 1. Confirmar el proyecto Supabase
Usás `ccxovleaqhifrkiytcpi` (el de `.env.local`). Si querés que conviva con RESET-HUB,
tiene que ser el **mismo** proyecto del hub. Si preferís aislar primero, creá uno dedicado
y actualizá las 3 claves en `.env.local`.

### 2. Aplicar las migraciones
Con Supabase CLI (recomendado):
```bash
supabase link --project-ref ccxovleaqhifrkiytcpi
supabase db push
```
O manual: copiá y ejecutá, en orden, en el **SQL Editor** de Supabase:
1. `supabase/migrations/20260523000000_init.sql`
2. `supabase/migrations/20260524000000_creators_memberships.sql`
3. `supabase/migrations/20260525000000_personas.sql`  (Fase 2)
4. `supabase/migrations/20260526000000_knowledge.sql`  (Fase 3 — requiere extensión `vector`)
5. `supabase/migrations/20260527000000_memory.sql`  (Fase 5 — memoria por miembro)
6. `supabase/migrations/20260528000000_app_data.sql`  (Fase 6 — hábitos, notas, tareas)

> Las extensiones `pgcrypto` y `vector` se crean solas en la primera migración.

### 3. Exponer el schema `ai_coach` (BLOQUEANTE)
Supabase → **Settings → API → Exposed schemas** → agregá `ai_coach` → Save.
Sin esto, PostgREST rechaza todo con error 400 "schema must be one of…".

### 4. Completar la API key de OpenAI
En `apps/web/.env.local`, reemplazá el placeholder:
```
OPENAI_API_KEY=sk-...tu-key-real...
```
(Y cargá las mismas variables en Vercel: Settings → Environment Variables, para preview y prod.)

### 5. (Opcional ahora) Regenerar los tipos de la base
```bash
supabase gen types typescript --project-id ccxovleaqhifrkiytcpi --schema ai_coach \
  > packages/db/src/database.types.ts
```
No es bloqueante (el cliente usa tipos `any`), pero da type-safety real.

### 6. Probar en modo real
Cuando 1–4 estén listos, activá el gate:
```
AUTH_ENABLED=true
```
Reiniciá `npm run dev`. Ahora:
- sin sesión te manda a `/login`,
- al registrarte/iniciar sesión se crea tu espacio de creador,
- `/studio/**` solo entra si tenés rol `creator`.

Para volver al modo demo: `AUTH_ENABLED=false`.

---

## Verificación (criterios de aceptación)

- [ ] `npm run typecheck` y `npm run build` pasan en tu Mac.
- [ ] Una query a una tabla de `ai_coach` responde (schema expuesto OK).
- [ ] Con `AUTH_ENABLED=true`: un usuario sin sesión va a `/login`.
- [ ] Un miembro (sin rol creator) no entra a `/studio`; un creador sí.
- [ ] Tras el primer login existe 1 fila en `ai_coach.creators` y 1 en `ai_coach.memberships`.

---

## Notas de seguridad

- Las funciones helper son `SECURITY DEFINER` para evitar recursión de RLS; leen membresías
  sin exponer datos de otros (filtran por `auth.uid()`).
- `SUPABASE_SERVICE_ROLE_KEY` es solo server-side (rutas de API). Nunca al cliente.
- El modelo actual da a cada usuario su propio espacio de creador. Cuando sumes la lógica de
  "unirse a la comunidad de otro creador", se agrega una membresía `member` sin tocar lo anterior.

---

## Fase 2 — Motor de Persona (HECHO en código)
- Migración `20260525000000_personas.sql`: tabla `personas` + RLS (dueño gestiona;
  miembros leen la publicada).
- `compilePersonaPrompt` / `buildPersonaPreviewPrompt` en `@ai-coach/prompts` (mapea los
  sliders de tono y las frases a instrucciones reales).
- `previewPersonaReply` en `@ai-coach/agent` (genera con OpenAI).
- API: `GET/PUT /api/studio/persona` y `POST /api/studio/persona/preview`.
- La pantalla `/studio/persona` carga/guarda vía API y el "Probá tu clon" llama a OpenAI;
  en modo prototipo (sin auth) cae al generador local — el demo sigue intacto.

**Para probar la persona real:** aplicá la migración 3, poné `OPENAI_API_KEY`, y con
`AUTH_ENABLED=true` entrá como creador. Cambiar un slider y mandar un mensaje en el preview
ahora genera una respuesta real con ese tono.

## Fase 3 — Base de conocimiento / ingesta (HECHO en código)
- Migración `20260526000000_knowledge.sql`: `knowledge_sources` + `kb_chunks`
  (`vector(1536)` + índice HNSW) + RLS + función `match_kb_chunks` (recuperación top-k por creador).
- Motor en `@ai-coach/agent` (`knowledge.ts`): `chunkText` (con solapamiento y detección de
  lección/paso/módulo), `embedTexts` (OpenAI), y `retrieveChunks` (lista para Fase 4).
- API: `GET /api/studio/knowledge` (listar), `POST` (ingestar texto → chunk → embeddings →
  guardar → marcar indexado), `DELETE /api/studio/knowledge/[id]`.
- Pantalla `/studio/knowledge`: formulario para pegar contenido/transcripción que se indexa
  de verdad; lista las fuentes reales. En prototipo (sin auth) simula la indexación.

**Para probar:** aplicá la migración 4, con `AUTH_ENABLED=true` y `OPENAI_API_KEY`, pegá un
texto en "Subir fuente" → se crea la fuente, se generan embeddings y queda `indexado` con N
fragmentos en `ai_coach.kb_chunks`.

**Pendiente (mejoras de la fase):** subir archivos binarios reales (PDF/video) requiere
extracción de texto (pdf-parse / transcripción Whisper) y, para archivos grandes, mover la
ingesta a una Edge Function en background. Hoy se ingesta texto pegado de forma síncrona.

## Fase 4 — Chat del miembro con RAG y citas (HECHO en código)
- `buildRagSystemPrompt` en `@ai-coach/prompts` (personalidad + material recuperado + reglas
  de cita y anti-alucinación).
- `answerWithKnowledge` en `@ai-coach/agent`: recupera fragmentos por creador
  (`retrieveChunks`), arma el contexto, llama a OpenAI con la persona, y devuelve la
  respuesta + las **citas** (fuente · lección).
- `getActiveCreatorId` en `@ai-coach/db` (resuelve a qué coach le habla el miembro).
- API: `POST /api/coach/ask` → `{ reply, citations }`.
- El chat `/chat` llama al endpoint real y muestra las citas bajo el mensaje del coach; sin
  auth/clave cae a la respuesta de ejemplo (el demo no se rompe).

**Para probar el flujo completo:** con las 4 migraciones aplicadas, schema expuesto,
`OPENAI_API_KEY` y `AUTH_ENABLED=true`: 1) en `/studio/knowledge` pegá material → se indexa;
2) en `/studio/persona` ajustá la voz; 3) en `/chat` preguntá algo cubierto por el material
→ el coach responde con tu tono y **cita la lección**; algo no cubierto → dice que no lo tiene,
sin inventar.

> No requiere migración nueva (usa `match_kb_chunks` de la Fase 3).

## Fase 5 — Memoria por miembro con consentimiento (HECHO en código)
- Migración `20260527000000_memory.sql`: tabla `coach_memories` (scope persona/miembro,
  `member_user_id`, `consent`, `embedding` + HNSW), RLS (dueño gestiona; el miembro gestiona
  las suyas, incluido consentimiento y "olvidar"), y función `match_coach_memories` que
  recupera SOLO memorias del miembro **con consentimiento**.
- `@ai-coach/agent`: `retrieveMemories`, `storeMemory`, y `answerWithKnowledge` ahora inyecta
  las memorias del miembro en el prompt (sección "Lo que recordás de este miembro").
- API: `GET/POST /api/studio/memory` y `PATCH (consent) / DELETE /api/studio/memory/[id]`.
- Pantalla `/studio/memory` conectada: lista real por miembro + persona, el toggle guarda el
  consentimiento y "Olvidar" borra de verdad. Sin auth (prototipo) usa el mock.

**Privacidad:** una memoria con consentimiento apagado NUNCA entra al contexto del modelo
(filtrado en SQL `consent = true`), además del RLS.

**Para probar:** con todo aplicado y `AUTH_ENABLED=true`, guardá memorias (vía API/POST),
prendé su consentimiento, y en `/chat` el coach las usa con naturalidad; apagá el
consentimiento y deja de usarlas.

## Fase 6 — Datos reales de la app (HECHO en código)
- Migración `20260528000000_app_data.sql`: `habits`, `habit_logs`, `notes`, `app_tasks`
  (scoped por `user_id`, RLS por `auth.uid()`).
- APIs: `/api/habits` (GET con racha+semana, POST) y `/api/habits/[id]/toggle`;
  `/api/notes` (GET/POST) y `/api/notes/[id]` (DELETE); `/api/tasks` (GET/POST) y
  `/api/tasks/[id]` (PATCH/DELETE). La racha y la semana se calculan desde `habit_logs`.
- Pantallas conectadas con fallback a mock: **Inicio** (rutina + tareas pendientes),
  **Hábitos** (toggle persiste el día), **Tareas** (crear/marcar), **Notas** (el store
  `notes-store` ahora sincroniza con `/api/notes`, lo que también hace real el "Guardar chat"),
  **Progreso** (hábitos activos + por pilar con datos reales).

**Pendiente (refinamiento):** el histórico de 30 días / "días perfectos" / "mejor racha" del
Progreso sigue ilustrativo; falta un endpoint de agregación sobre `habit_logs` (Fase 7).

## Fase 7 — Endurecimiento (HECHO en código)
- **Rate limit** diario en `/api/coach/ask` (`usage_counters`, 429 al pasarse,
  `AI_COACH_DAILY_MESSAGE_LIMIT`).
- **Observabilidad:** log estructurado por respuesta (latencia, chunks, memorias, tokens, citas).
- **Stats reales de Progreso:** `/api/stats/progress` agrega `habit_logs` (cumplimiento 30d,
  mejor racha, días perfectos, 14 días); la pantalla Progreso ya los usa.
- **Evals:** `evals/coach-cases.json` + `scripts/eval-coach.mjs` (fidelidad y no-alucinación).
- **Guía de deploy y seguridad:** `docs/deploy-hardening.md`.

Con esto, **las 8 fases (0–7) del plan están completas en código.** Lo que queda es
operativo: aplicar migraciones, exponer el schema, cargar claves, activar `AUTH_ENABLED`,
y correr los evals antes de promover a producción (ver `docs/deploy-hardening.md`).
