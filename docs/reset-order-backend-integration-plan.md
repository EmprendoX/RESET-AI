# Plan de integración — De prototipo a producción (RESET-ORDER Coach)

Documento de implementación detallado, paso por paso, para convertir el prototipo de
frontend (datos mock) en una plataforma real: un coach de IA por creador, con
**Persona + Conocimiento (RAG) + Memoria**, multi-tenant (creador/miembro), integrado
dentro de **RESET-HUB** compartiendo el proyecto Supabase.

> Regla de oro durante toda la migración: **una capa a la vez, detrás de feature flags,
> sin romper lo que ya funciona**. Cada fase termina con criterios de aceptación
> verificables antes de pasar a la siguiente.

---

## 0. Mapa de estado actual (de qué partimos)

**Ya existe en el repo:**
- Frontend prototipo (oscuro/azul) con todas las pantallas y datos mock
  (`apps/web/src/lib/mock-data.ts`, `lib/notes-store.ts`).
- Backend esqueleto: API routes (`auth`, `chat`, `goals`, `memory`, `onboarding`,
  `recommendations`, `check-ins`, `settings`, `events`, `admin`).
- `packages/agent` — orchestrator con OpenAI function calling + tools.
- `packages/db` — cliente Supabase, schemas Zod, `database.types.ts`.
- `packages/prompts` — `buildCoachSystemPrompt`.
- Migración Supabase con 15 tablas (schema `public`), RLS por `auth.uid()`.
- Parche `docs/patches/ai_coach_schema_refactor.diff` — aísla todo en schema `ai_coach`
  para convivir con RESET-HUB (pendiente de aplicar).
- Middleware de auth DESACTIVADO para el demo.

**Falta para la visión completa:**
- Modelo multi-tenant (creador/miembro, `creator_id` en todo).
- Tabla y motor de **Persona**.
- **Base de conocimiento** con embeddings/pgvector + pipeline de ingesta.
- **Memoria** semántica por miembro con consentimiento real.
- Sistema de **hábitos** diarios (rachas) — hoy es mock; el schema tiene goals/tasks
  pero no `habits`/`habit_logs`.
- Conectar todas las pantallas a APIs reales y reactivar auth con roles.

---

## 1. Decisiones clave (definir antes de empezar)

| # | Decisión | Recomendación | Alternativa |
|---|----------|---------------|-------------|
| D1 | Aislamiento de datos | Aplicar el refactor `ai_coach` (schema dedicado) | Mantener `public` (riesgo de colisión con RESET-HUB) |
| D2 | Proveedor de embeddings | OpenAI `text-embedding-3-small` (1536 dims, barato) | `text-embedding-3-large` (mejor recall, más caro) |
| D3 | Vector store | `pgvector` en el mismo Supabase | Servicio externo (Pinecone/Qdrant) |
| D4 | Persona | Por prompt (editable al instante) ahora; fine-tuning más adelante | Fine-tuning desde el día 1 (lento, caro) |
| D5 | Ingesta (chunk+embed) | Supabase Edge Functions + cola por estado | Worker en Vercel cron / servicio aparte |
| D6 | Transcripción de video | El creador sube transcripción; Whisper en fase 2 | Transcribir todo automático (costo/latencia) |
| D7 | SSO con RESET-HUB | Compartir `auth.users` (mismo login en todo el hub) | Auth separada (peor UX) |

**Costo a vigilar desde el principio:** embeddings de ingesta (una vez por fragmento) y
de cada query, + tokens de chat. Presupuestar y cachear (ver §11).

---

## 2. Fase 0 — Fundaciones y entorno (1–2 días)

**Objetivo:** dejar el proyecto Supabase, las claves y el tooling listos, sin tocar
features todavía.

Pasos:
1. **Proyecto Supabase** (`ccxovleaqhifrkiytcpi`, el que ya está en `.env.local`):
   confirmar que es el proyecto compartido con RESET-HUB o crear uno dedicado.
2. **Habilitar extensiones** en el SQL editor:
   `create extension if not exists vector;` y `pgcrypto` (para `gen_random_uuid`).
3. **Aplicar el refactor `ai_coach`** (D1): aplicar `docs/patches/ai_coach_schema_refactor.diff`
   a la rama principal; arreglar el seed de `feature_flags` con `ON CONFLICT (key) DO NOTHING`.
4. **Exponer el schema** `ai_coach` en *Supabase → Settings → API → Exposed schemas*
   (paso bloqueante; sin esto PostgREST rechaza todo).
5. **Variables de entorno:** completar `OPENAI_API_KEY` real en `apps/web/.env.local` y en
   Vercel (preview + production). Agregar `EMBEDDING_MODEL`, `OPENAI_CHAT_MODEL`.
6. **Tooling:** regenerar `packages/db/database.types.ts` desde el schema `ai_coach`
   (`supabase gen types typescript --schema ai_coach`).
7. **Estrategia de ramas:** rama `integration/backend`; cada fase = PR pequeño con flag.

**Criterio de aceptación:** `npm run typecheck` y `npm run build` pasan en la Mac; una
query trivial a una tabla de `ai_coach` desde la app responde (schema expuesto OK).

---

## 3. Fase 1 — Multi-tenant, auth y roles (2–4 días)

**Objetivo:** modelar creador/miembro y reactivar la seguridad. Sin esto, nada de lo
demás puede escalar a "varios creadores".

### 3.1 Modelo de datos (nuevas tablas en `ai_coach`)
```sql
-- Creadores (influencers que clonan su mentoría)
create table ai_coach.creators (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  handle text unique not null,
  display_name text not null,
  created_at timestamptz default now()
);

-- Rol por usuario dentro de un creador (un user puede ser creador y miembro)
create table ai_coach.memberships (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references ai_coach.creators(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('creator','member')),
  status text not null default 'active',
  created_at timestamptz default now(),
  unique (creator_id, user_id)
);
```
- Agregar `creator_id uuid` a **todas** las tablas de contenido (goals, conversations,
  messages, memories, habits, etc.) para scoping por tenant.

### 3.2 RLS (patrón)
- Miembro: `using (user_id = auth.uid())` para sus datos.
- Recursos del creador legibles por sus miembros (persona publicada, conocimiento):
  `using (creator_id in (select creator_id from ai_coach.memberships where user_id = auth.uid()))`.
- Gestión del creador: `using (creator_id in (select id from ai_coach.creators where owner_user_id = auth.uid()))`.

### 3.3 Auth y middleware
1. Restaurar `apps/web/src/middleware.ts` (versión Supabase, hoy desactivada).
2. Rutas `/studio/**` → exigen rol `creator`; resto de la app → miembro autenticado.
3. `ensureCoachProfile` (del refactor) crea perfil + membership al primer login.
4. Login/signup reales (ya existen los endpoints; volver a apuntarlos).

**Criterio de aceptación:** un usuario sin sesión es redirigido a `/login`; un miembro no
puede entrar a `/studio`; un creador sí. Las queries respetan RLS (probado con 2 usuarios).

---

## 4. Fase 2 — Motor de Persona (2–3 días)

**Objetivo:** que la personalidad configurada en el builder afecte de verdad al chat.

### 4.1 Datos
```sql
create table ai_coach.personas (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references ai_coach.creators(id) on delete cascade,
  coach_name text not null,
  tagline text,
  tone jsonb not null default '{}',          -- {directo,cercano,detallado,motivador}
  voice text,
  values text[] default '{}',
  signature_phrases text[] default '{}',
  dos text[] default '{}',
  donts text[] default '{}',
  methodology text,
  sample_replies jsonb default '[]',         -- [{q,a}]
  is_published boolean default false,
  updated_at timestamptz default now()
);
```

### 4.2 Compilación del prompt (`packages/prompts`)
- Extender `buildCoachSystemPrompt` para recibir la persona y construir el system prompt:
  identidad + mapeo de sliders a adjetivos (ej. `directo>=66` → "directo y sin vueltas")
  + voz + valores + qué sí/qué no + metodología + **few-shot** con `sample_replies`.
- Guardrail de marca: "No inventes datos fuera del material; si no sabés, decilo".

### 4.3 API + wiring
- `GET/PUT /api/studio/persona` (scoped al creador, RLS).
- Reemplazar el estado mock de `app/studio/persona/page.tsx` por fetch/guardar reales;
  el preview "Probá tu clon" llama a `/api/chat` en modo *dry-run* (sin persistir).

**Criterio de aceptación:** cambiar un slider y guardar cambia de forma observable el tono
de la respuesta real del modelo en el preview.

---

## 5. Fase 3 — Base de conocimiento: ingesta (4–6 días)

**Objetivo:** subir material del creador y dejarlo indexado para RAG.

### 5.1 Datos
```sql
create table ai_coach.knowledge_sources (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references ai_coach.creators(id) on delete cascade,
  title text not null,
  type text not null check (type in ('curso','pdf','video','post')),
  storage_path text,                         -- archivo en Supabase Storage
  status text not null default 'pendiente',  -- pendiente|procesando|indexado|error
  error text,
  chunks int default 0,
  lessons int,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table ai_coach.kb_chunks (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references ai_coach.knowledge_sources(id) on delete cascade,
  creator_id uuid not null,
  content text not null,
  lesson_label text,                         -- para la cita (ej. "Lección 3")
  embedding vector(1536),
  token_count int,
  created_at timestamptz default now()
);
create index on ai_coach.kb_chunks using hnsw (embedding vector_cosine_ops);
```

### 5.2 Pipeline de ingesta (Edge Function, D5)
1. **Subida:** archivo → Supabase Storage; crear `knowledge_source` en `pendiente`.
2. **Extracción de texto por tipo:**
   - PDF → `pdf-parse`.
   - Post/curso (texto) → directo.
   - Video → transcripción provista por el creador (fase 1); Whisper más adelante (D6).
3. **Chunking:** ~500–800 tokens con solapamiento de ~80; preservar `lesson_label`.
4. **Embeddings:** batch a OpenAI (`EMBEDDING_MODEL`); guardar en `kb_chunks`.
5. **Estado:** `procesando` → `indexado` (o `error` con detalle); actualizar `chunks`.
6. **Idempotencia y reintentos:** key por `source_id`; reintentos con backoff.

### 5.3 API + wiring
- `POST /api/studio/knowledge` (subir), `GET` (listar con estado), `DELETE` (borra source
  + chunks). Conectar `app/studio/knowledge/page.tsx` (incluido el polling de estado).

**Criterio de aceptación:** subir un PDF real lo deja `indexado` con N chunks; los embeddings
existen en `kb_chunks`; borrar la fuente elimina sus chunks.

---

## 6. Fase 4 — Chat con RAG y citas (3–5 días)

**Objetivo:** el coach responde fundado en el material, citando la fuente.

### 6.1 Recuperación
- Función SQL `match_kb_chunks(creator_id, query_embedding, k, min_similarity)` con
  `embedding <=> query` (cosine), filtrada por `creator_id`.
- En el orchestrator (`packages/agent`): embeber la consulta del usuario (o una reescritura
  de la query) → recuperar top-k → inyectar en el contexto con metadatos de fuente.

### 6.2 Generación con citas
- Pasar los chunks como contexto e instruir: "usá solo este material; al afirmar algo,
  citá `[fuente · lección]`". Devolver las citas estructuradas junto a la respuesta.
- **Guardrail anti-alucinación:** si no hay chunks por encima del umbral, el coach lo dice
  y ofrece el siguiente paso, en vez de inventar (principio "no inventar datos").

### 6.3 Wiring
- Extender `/api/chat` para devolver `{ message, citations[] }`.
- Mostrar las citas bajo el mensaje del coach (el componente ya existe en el prototipo de
  Conocimiento; portarlo al chat real).

**Criterio de aceptación:** una pregunta cubierta por el material se responde con cita
correcta a la lección; una pregunta fuera del material recibe la respuesta de "no lo
tengo en el material" en vez de inventar.

---

## 7. Fase 5 — Motor de Memoria (3–4 días)

**Objetivo:** que el coach recuerde a cada miembro, con consentimiento real.

### 7.1 Datos (extender `memories` del schema)
- Campos: `scope ('persona'|'miembro')`, `member_user_id`, `type`, `content`, `source`,
  `consent boolean default false`, `embedding vector(1536)`.
- Índice HNSW para recuperación semántica.

### 7.2 Escritura de memoria
- Durante el chat, una *tool* `save_user_memory` propone recuerdos (ya existe en
  `packages/agent/tools`); persistir con `consent=false` por defecto y pedir aprobación
  del miembro (o auto-consent según política definida).

### 7.3 Recuperación + consentimiento
- Al armar el contexto del chat: traer memorias relevantes **solo con `consent=true`**
  (enforced también por RLS), más metas activas siempre.
- Pantalla `/studio/memory`: conectar toggles de consentimiento y "Olvidar" a la API real.

**Criterio de aceptación:** un dato marcado sin consentimiento nunca aparece en el contexto
del modelo (verificado en logs); "Olvidar" lo borra de forma permanente.

---

## 8. Fase 6 — Conectar el resto de la app (3–5 días)

**Objetivo:** reemplazar el resto de mock por datos reales.

1. **Hábitos** (nuevo): tablas `habits` + `habit_logs` (un log por día/hábito); cálculo de
   racha y % diario en el server. Conectar Inicio, Hábitos y Progreso.
2. **Tareas / Notas:** endpoints CRUD reales; reemplazar `lib/notes-store.ts` (el "Guardar
   chat" pasa a persistir como nota tipo conversación).
3. **Progreso:** consultas de agregación (cumplimiento 30 días, rachas, por pilar).
4. **Estados de carga/error/vacío** en cada pantalla; updates optimistas donde aplique.

**Criterio de aceptación:** recargar la página mantiene los datos; dos dispositivos del
mismo usuario ven lo mismo.

---

## 9. Fase 7 — Endurecimiento, QA y lanzamiento (4–6 días)

1. **Seguridad/privacidad:** auditar RLS con tests; secrets solo server-side; revisar que
   `service_role` nunca llegue al cliente; política de retención y borrado de memoria
   (derecho al olvido).
2. **Rate limiting y costos:** usar `usage_counters` para límites diarios; cachear
   embeddings de queries repetidas; elegir `k` y umbral para controlar tokens; alertas de
   gasto en OpenAI.
3. **Observabilidad:** logs estructurados del chat (latencia, tokens, chunks usados),
   `audit_logs` en mutaciones sensibles, captura de errores (Sentry).
4. **Pruebas:**
   - Unit (chunking, compilación de prompt, mapeo de tono).
   - Integración (ingesta end-to-end, retrieval, RLS por rol).
   - **Evals de calidad** del coach: set de preguntas con respuestas/citas esperadas;
     medir fidelidad (cita correcta) y "no alucinación".
   - E2E (Playwright) de los flujos críticos.
5. **Despliegue:** Vercel (web) + Supabase (DB/Storage/Edge); migraciones versionadas;
   feature flags por fase; rollout en etapas (1 creador piloto → beta → general).

**Criterio de aceptación:** suite verde, eval de coach por encima del umbral acordado, y
un creador piloto operando end-to-end en producción.

---

## 10. Orden recomendado y dependencias

```
Fase 0 (entorno)
   └─> Fase 1 (multi-tenant + auth)   ← base de todo
          ├─> Fase 2 (Persona)        ← chat real con personalidad
          ├─> Fase 3 (ingesta KB) ─> Fase 4 (RAG + citas)
          └─> Fase 5 (Memoria)
                 └─> Fase 6 (resto de la app)
                        └─> Fase 7 (hardening + lanzamiento)
```
- **Camino crítico:** 0 → 1 → 2 → 3 → 4. Memoria (5) y app (6) pueden ir en paralelo una vez
  que el chat real funciona.
- **Estimación total:** ~4–6 semanas de un dev enfocado (sin contar fine-tuning ni
  transcripción automática de video, que son fases posteriores).

---

## 11. Riesgos y mitigaciones

| Riesgo | Mitigación |
|--------|-----------|
| Colisión de datos con RESET-HUB | Schema `ai_coach` aislado + RLS estricto (D1) |
| Alucinaciones del coach | Umbral de similitud + guardrail "no inventar" + evals |
| Costo de tokens/embeddings | Caché, `k` acotado, límites diarios, modelo small |
| Privacidad de memoria | Consentimiento por defecto off + RLS + borrado real |
| Schema no expuesto (PostgREST 400) | Checklist Fase 0, paso 4 |
| Ingesta lenta/fallida | Cola con estados, reintentos, idempotencia |
| Calidad de persona insuficiente | Empezar por prompt; medir; fine-tuning si hace falta |

---

## 12. Checklist de arranque (primeros pasos concretos)

- [ ] Confirmar proyecto Supabase y completar `OPENAI_API_KEY`.
- [ ] `create extension vector;` + `pgcrypto`.
- [ ] Aplicar parche `ai_coach` + arreglar seed `feature_flags`.
- [ ] Exponer schema `ai_coach` en la API de Supabase.
- [ ] Regenerar `database.types.ts`.
- [ ] Rama `integration/backend` + primer PR (Fase 1: tablas creators/memberships + auth).

---

*Este plan es incremental y reversible: cada fase entrega valor verificable y queda detrás
de un feature flag para poder pausar o revertir sin afectar lo anterior.*
