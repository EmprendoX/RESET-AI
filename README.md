# AI Coach App

App independiente de AI Coach — monorepo standalone con Next.js, Supabase y OpenAI.

## Estructura

```txt
apps/web/          Next.js 15 (UI + API routes)
packages/agent/    Orchestrator, tools, OpenAI
packages/db/       Supabase client, schemas, queries
packages/prompts/  System prompts
packages/config/   Brand + feature flags
packages/ui/       Componentes compartidos
packages/shared/   Types, events, integrations stubs
supabase/          Migraciones SQL + RLS
docs/              PRD, arquitectura, database
```

## Setup

1. Clona el repo e instala dependencias:

```bash
npm install
```

2. Crea un proyecto Supabase dedicado y copia credenciales:

```bash
cp .env.example apps/web/.env.local
```

3. Aplica la migración en Supabase SQL Editor o con Supabase CLI:

```bash
supabase db push
```

4. Inicia el servidor de desarrollo:

```bash
npm run dev
```

## Variables de entorno

Ver [`.env.example`](.env.example).

## Deploy

- **Frontend/API:** Vercel (`apps/web`)
- **DB/Auth:** Supabase Cloud (proyecto propio)

## Rutas principales

| Ruta | Descripción |
|------|-------------|
| `/login`, `/signup` | Auth |
| `/onboarding` | Wizard 6 pasos |
| `/chat` | Chat con coach |
| `/memory` | CRUD memoria |
| `/goals` | Metas |
| `/recommendations` | Recomendaciones |
| `/check-in` | Check-ins |
| `/settings` | Configuración |
| `/admin/*` | Panel interno |

## Documentación

- [PRD](docs/prd.md)
- [Arquitectura](docs/architecture.md)
- [Base de datos](docs/database.md)
