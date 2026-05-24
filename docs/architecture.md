# AI Coach — Arquitectura

## Stack

- **Frontend + API:** Next.js 15 App Router (`apps/web`)
- **Auth + DB:** Supabase (proyecto propio, RLS por `auth.uid()`)
- **Agente:** OpenAI + function calling (`packages/agent`)
- **Monorepo:** npm workspaces

## Flujo de chat

1. Usuario envía mensaje → `POST /api/chat`
2. Rate limit via `usage_counters`
3. Mensaje persistido en `messages`
4. `context-builder` carga perfil, metas, memorias
5. OpenAI con system prompt + tools
6. Tools ejecutan queries scoped por `user_id`
7. Respuesta persistida + evento `chat_message_sent`

## Separación para clonado

| Capa | Ubicación |
|------|-----------|
| Branding | `packages/config/defaults.json` |
| Prompts | `packages/prompts/` |
| Agente core | `packages/agent/` |
| Integraciones futuras | `packages/shared/src/integrations.ts` |

## Seguridad

- API keys solo server-side
- RLS en todas las tablas
- Rate limiting en chat
- Audit logs en mutaciones sensibles
- Feature flags env + DB
