# AI Coach — Base de datos

Ver migración: [`supabase/migrations/20260523000000_init.sql`](../supabase/migrations/20260523000000_init.sql)

## Tablas MVP

| Tabla | Propósito |
|-------|-----------|
| `users_profile` | Perfil extendido del usuario |
| `coach_profiles` | Config del coach, onboarding, memoria |
| `onboarding_forms` | Respuestas del wizard |
| `business_profiles` | Contexto de negocio/proyecto |
| `goals` | Metas del usuario |
| `conversations` | Conversaciones de chat |
| `messages` | Mensajes user/assistant |
| `memories` | Memoria controlada por usuario |
| `recommendations` | Recomendaciones del coach |
| `check_ins` | Check-ins periódicos |
| `tasks` | Tareas (plan 7 días, etc.) |
| `user_events` | Eventos internos con idempotency |
| `audit_logs` | Logs de auditoría |
| `feature_flags` | Flags en DB |
| `usage_counters` | Rate limiting diario |

## RLS

Todas las tablas de usuario filtran por `user_id = auth.uid()`.

## Trigger

`on_auth_user_created` → crea `users_profile` + `coach_profiles` al registrarse.
