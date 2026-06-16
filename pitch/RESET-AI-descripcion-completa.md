# RESET-AI
### Descripción para socios, colaboradores e inversionistas

> Los campos entre **[corchetes]** son placeholders para que completes con tus datos
> (cifras, fechas, equipo, valuación). El resto describe el producto y la tecnología reales.

---

## 1. Resumen ejecutivo

**RESET-AI es la plataforma que convierte a cada creador en un mentor de inteligencia
artificial.** Un creador, coach o influencer puede **clonar su mentoría** en un agente de IA
que habla como él, responde fundado en su propio contenido y acompaña a cada miembro de su
comunidad día a día, sin perder cercanía ni escalar costos de forma lineal.

A diferencia de un chatbot genérico, el coach de RESET-AI se construye sobre tres capas:
**Persona** (cómo habla), **Conocimiento** (qué sabe, con citas a su material) y **Memoria**
(qué recuerda de cada persona, con consentimiento). Encima vive una app de seguimiento diario
—el sistema **RESET-ORDER**— y un panel de administración para el creador, el **Creator Studio**.

El producto nace dentro de la comunidad **RESET-ORDER / RESETE-HUB** y está diseñado para ser
**clonable (white-label)**: la misma plataforma puede dar de alta a muchos creadores.

---

## 2. El problema

- **La mentoría no escala.** El acompañamiento 1:1 de un creador llega a pocas personas; el
  resto compra cursos que mayormente no termina.
- **El conocimiento se desperdicia.** Años de contenido (cursos, lives, PDFs, hilos) quedan
  dispersos y sin forma de consultarse de manera conversacional y confiable.
- **La IA genérica no sirve para esto.** No suena como el creador, no conoce su método y
  **alucina**: inventa datos, lo que destruye la confianza y la marca.
- **La comunidad pide cercanía continua**, no una respuesta enlatada una vez por semana.

## 3. La solución

Un **coach de IA propio de cada creador**, fiel a su voz y a su material, que da seguimiento
real. Tres capas lo hacen posible:

1. **Persona** — el creador define tono, valores, qué sí y qué no dice, sus frases típicas y
   su metodología. Eso se compila en la personalidad del agente; puede probarse en vivo.
2. **Conocimiento (RAG)** — sube sus cursos, PDFs, videos y posts; el sistema los convierte en
   fragmentos con *embeddings* y, al responder, **recupera lo relevante y cita la lección**.
   Si algo no está en su material, el coach lo dice en vez de inventar.
3. **Memoria** — el coach recuerda metas, bloqueos y preferencias de cada miembro entre
   conversaciones. El miembro decide qué se guarda; **sin consentimiento, no se usa**.

## 4. El producto

**Para el miembro (la comunidad):**
- Chat con el coach del creador, con respuestas citadas y memoria.
- Sistema **RESET-ORDER** de hábitos y rutinas diarias (4 pilares: mente, cuerpo, negocio, orden)
  con rachas y seguimiento.
- Tareas (to-do), bloc de notas (incluye guardar conversaciones) y panel de progreso.

**Para el creador (Creator Studio):**
- **Persona:** constructor de la personalidad del clon, con prueba en vivo.
- **Conocimiento:** subir/gestionar fuentes y ver qué sabe el agente.
- **Memoria:** ver y administrar lo que el coach recuerda de cada miembro, con consentimiento.

## 5. Tecnología y arquitectura

- **Frontend + API:** Next.js (App Router), desplegable en Vercel.
- **Datos y auth:** Supabase (PostgreSQL con **pgvector**, Row-Level Security por usuario).
- **IA:** OpenAI para chat y *embeddings*; recuperación semántica (RAG) con citación de fuentes.
- **Multi-tenant:** arquitectura aislada por creador, pensada para convivir con la comunidad
  RESET-HUB y para clonarse a nuevos creadores.
- **Privacidad y seguridad por diseño:** RLS en todas las tablas, memoria con consentimiento
  obligatorio, claves sensibles solo del lado del servidor, y registros de auditoría.
- **Control de costos:** límites de uso por usuario, modelos eficientes y recuperación acotada.

## 6. Diferenciadores

| | RESET-AI | Chatbot genérico | Curso tradicional |
|---|---|---|---|
| Habla como el creador | ✅ | ❌ | — |
| Fundado en su material, con cita | ✅ | ❌ | parcial |
| No inventa (anti-alucinación) | ✅ | ❌ | — |
| Memoria por miembro, con consentimiento | ✅ | limitado | ❌ |
| Seguimiento diario + comunidad | ✅ | ❌ | ❌ |
| Clonable / white-label | ✅ | — | — |

## 7. Mercado y oportunidad *(completar con tus fuentes)*

- **Creator economy** y **e-learning** en crecimiento sostenido; cada creador es un micro-SaaS
  potencial. Mercado estimado: **[$___ / TAM-SAM-SOM]**.
- **ICP inicial:** creadores y mentores de habla hispana con comunidad activa (**[N seguidores]**,
  **[N miembros de pago]**) en desarrollo personal, negocios y bienestar.
- **Wedge:** empezar dentro de RESET-ORDER y expandir a otros creadores con el mismo motor.

## 8. Modelo de negocio *(a confirmar)*

- **Suscripción SaaS al creador** por planes (ej. **[Starter $X / Pro $Y / Scale $Z]** al mes).
- **Ingreso por comunidad:** **[fee por miembro activo / rev-share %]** sobre su membresía.
- **Costos de IA** trasladados de forma transparente o incluidos por tramos de uso.
- **Servicios:** onboarding y migración de contenido **[$___]** (opcional).
- Métricas clave: creadores activos, miembros activos, retención, margen por creador, costo de IA
  por conversación.

## 9. Estado actual y roadmap

**Hoy:** prototipo funcional de toda la experiencia + integración de backend construida de punta
a punta (multi-tenant, persona, base de conocimiento con embeddings, memoria con consentimiento,
app del miembro con datos reales, rate-limits y observabilidad). Listo para **piloto**.

**Próximos pasos:**
- Puesta en producción y **piloto con [N] creadores**.
- Ingesta de archivos binarios (PDF/video con transcripción) a escala.
- Evaluación continua de calidad del coach (fidelidad y no-alucinación).
- **[Hitos por trimestre]**.

## 10. Equipo *(completar)*

- **Agustín Pascal** — **[rol: fundador / producto]** · apascalsi@gmail.com
- **[Nombre]** — **[rol]**
- Buscamos **[perfiles: ingeniería, growth, partnerships con creadores]**.

## 11. La inversión / El ask *(completar)*

- Buscamos **[monto: $___]** en una ronda **[pre-seed / seed]** vía **[SAFE / equity]**,
  valuación **[$___]**.
- **Uso de fondos:** **[% producto, % go-to-market con creadores, % equipo, % infraestructura/IA]**.
- **Objetivo de la ronda:** llegar a **[hito: N creadores, $MRR, retención X%]** en **[meses]**.

## 12. Por qué ahora y visión

La IA generativa ya permite clonar voz y conocimiento con calidad suficiente; los creadores
necesitan escalar su mentoría sin volverse impersonales; y las comunidades son el canal directo
con su audiencia. **La visión:** que cualquier creador encienda, en minutos, un mentor de IA
que sea fiel a él, viva dentro de su comunidad y acompañe a su gente todos los días — y que
RESET-AI sea la infraestructura que lo hace posible.

---

**Contacto:** Agustín Pascal · apascalsi@gmail.com
