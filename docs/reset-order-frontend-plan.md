# Plan — Rediseño del frontend del Coach RESET-ORDER (prototipo navegable)

## Objetivo

Rediseñar el frontend de la app del coach para que se vea como parte de **RESET-ORDER**
(comunidad RESETE-HUB), con la estética oscura/premium del sitio
`resete-order.netlify.app`. El coach acompaña al usuario a **cumplir el sistema
Reset-Order, basado en hábitos y rutinas diarias**, dando seguimiento.

Se entrega como **prototipo navegable con datos de ejemplo (mock)**: todo se ve y se
clickea, pero todavía no conecta al backend (Supabase/OpenAI). Listo para enchufar.

## Qué se agrega (pedido del usuario)

1. **Seguimiento de hábitos/rutinas diarias** — el corazón del sistema Reset-Order.
2. **Bloc de notas** — guardar notas y **guardar conversaciones** del chat.
3. **To-Do / Tareas** — crear tareas, marcarlas y darles seguimiento.

## Dirección de diseño (basada en el sitio RESET-ORDER)

- **Tema oscuro/premium**: fondo casi negro, tarjetas en gris oscuro elevadas,
  texto blanco, secundario gris.
- **Acento**: un color vivo de "crecimiento/energía" (a confirmar: verde lima,
  ámbar/dorado, o el que uses en la marca). Un solo acento para mantener limpio.
- **Marca**: wordmark RESET-ORDER, logo `Logot_Reset_Order.png`, idioma español (MX).
- Tipografía fuerte para títulos, esquinas redondeadas, bordes sutiles, glows suaves.
- Responsive con navegación inferior en mobile.

## Pantallas

| Pantalla | Qué muestra |
|----------|-------------|
| **Inicio (dashboard)** | Rutina de hoy (checklist), racha, % de avance, próximo paso, empujón del coach |
| **Coach (chat)** | Chat rediseñado oscuro; coach como guía del sistema; acciones rápidas Reset-Order; botón "Guardar conversación en Notas" |
| **Hábitos** | Gestionar hábitos diarios, ver rachas, grilla semanal tipo habit tracker |
| **Tareas (To-Do)** | Crear tareas, marcar hechas, fechas, seguimiento; vinculables a hábitos/metas |
| **Notas** | Bloc de notas: crear/editar notas y conversaciones guardadas |
| **Progreso** | Rachas, % de cumplimiento, historial |
| **Ajustes** | Perfil, estilo del coach, marca |

## Pasos de implementación

1. **Fundación de tema** — tokens oscuros en `globals.css`, paleta Tailwind,
   fuentes, rebrand de `packages/config/defaults.json` a RESET-ORDER, logo.
2. **Kit de UI** — actualizar `packages/ui` a tema oscuro y sumar componentes:
   Checkbox, Badge, ProgressRing, StreakFlame, Tabs.
3. **App shell** — sidebar/topbar oscuro con logo y nav nueva + nav inferior mobile.
4. **Capa de mock data** — `apps/web/src/lib/mock-data.ts` con hábitos, tareas,
   notas, conversaciones y rachas de ejemplo.
5. **Pantallas** — construir las 7 pantallas con la mock data.
6. **Interacciones vivas (client-side)** — marcar hábito/tarea, crear nota,
   "guardar conversación en Notas" funcionando con estado local (sin backend).
7. **Pulido** — estados vacíos, responsive, micro-interacciones.
8. **Verificación** — `npm run typecheck` + `npm run build` y revisión visual.

## Fuera de alcance (en este pase)

- Conexión real a Supabase / OpenAI (queda para el pase de integración a RESET-HUB).
- Aplicar el refactor de schema `ai_coach` (ya documentado en `docs/patches/`).
- Auth real (las pantallas usan un usuario de ejemplo).
