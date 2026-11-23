# OPA Panel de Seguimiento — Documento de requerimientos

**Versión:** 0.1 (borrador para revisión) · **Fecha:** 23 nov 2026 · **Autor:** Axel GH (con apoyo de Claude)
**Repositorio:** https://github.com/axelgh-dev/OPA-Panel-de-Seguimiento

> Los puntos marcados con **[SUPUESTO]** son decisiones tomadas por defecto que Axel debe confirmar o corregir.

---

## 1. Contexto y objetivo

Axel desarrolla varios proyectos de software para el despacho contable y fiscal **OP&A (OPA Asesores)**. Hoy el avance se comunica por mensajes y reuniones sueltas. El **Panel de Seguimiento** es un portal web privado donde el despacho puede:

- **Visualizar** el estado de todos los proyectos en un solo lugar.
- **Monitorear** avance, próximas entregas y riesgos.
- **Leer** la bitácora de actualizaciones del desarrollador.
- **Interactuar**: comentar, pedir cambios y aprobar o rechazar entregables.

**Indicador de éxito:** el Admin OPA puede responder "¿cómo va el proyecto X y qué necesitas de nosotros?" sin preguntarle a Axel.

## 2. Alcance

### Dentro del MVP
1. Dashboard de tarjetas por proyecto.
2. Detalle de proyecto: fases/hitos en línea de tiempo, tareas y entregables.
3. Bitácora de actualizaciones del desarrollador.
4. Comentarios, solicitudes de cambio y aprobación de entregables.
5. Autenticación y roles (4 usuarios).
6. Notificaciones por correo (fase 3).

### Fuera del MVP (posibles fases futuras)
- Facturación, cotizaciones o control de horas.
- Chat en tiempo real.
- App móvil nativa (el portal será responsive).
- Integración con GitHub/Jira (se puede añadir después para jalar commits o issues).
- Registro abierto de usuarios: las cuentas solo las crea Axel.

## 3. Usuarios y roles

Hay solo **dos roles**. Los tres usuarios del despacho tienen exactamente los mismos permisos (confirmado por Axel); su cargo es solo una etiqueta informativa.

| Usuario | Rol en sistema | Cargo (`job_title`, informativo) |
|---|---|---|
| Axel | `dev` | Desarrollador |
| Admin OPA | `opa` | Gerente del despacho |
| Ejecutivo 1 | `opa` | Administración |
| Ejecutivo 2 | `opa` | Administración |

### 3.1 Matriz de permisos

| Acción | dev | opa |
|---|:-:|:-:|
| Ver dashboard y detalle de proyectos publicados | ✅ | ✅ |
| Ver proyectos en borrador (no publicados) | ✅ | ❌ |
| Crear / editar / archivar proyectos, fases, tareas | ✅ | ❌ |
| Publicar entradas de bitácora | ✅ | ❌ |
| Subir entregables y enviarlos a revisión | ✅ | ❌ |
| **Aprobar, rechazar o pedir cambios en entregables** | ❌ ¹ | ✅ |
| Comentar en proyectos, entregables y bitácora | ✅ | ✅ |
| Editar / borrar sus propios comentarios (15 min) | ✅ | ✅ |
| Crear solicitudes de cambio | ❌ | ✅ |
| Cambiar estatus de solicitudes de cambio (aceptar, rechazar, completar) | ✅ | ❌ |
| Fijar prioridad de proyectos y solicitudes | ✅ | ✅ |
| Gestionar usuarios (invitar, desactivar, cambiar rol) | ✅ | ❌ |
| Ver historial de actividad | ✅ | ✅ |

¹ El desarrollador no aprueba sus propios entregables, para que la aprobación tenga valor como registro del cliente (confirmado).

- Basta con **una** aprobación de cualquier usuario OPA para que un entregable quede aprobado. Queda registrado quién aprobó. **[SUPUESTO]**
- Todos los usuarios de OPA ven todos los proyectos publicados (confirmado). El modelo deja preparada una tabla `project_members` por si esto cambia.

## 4. Módulos funcionales

### 4.1 Dashboard (inicio)
- Resumen superior (KPIs): proyectos activos, entregas en los próximos 14 días, entregables pendientes de aprobación, solicitudes de cambio abiertas.
- Grid de **tarjetas por proyecto** con: nombre, estatus (chip de color), salud (en tiempo / en riesgo / retrasado), barra de % avance, fase actual, próxima entrega con fecha y días restantes, contador de alertas (entregables por aprobar, comentarios sin leer, solicitudes abiertas).
- Filtros: estatus, prioridad, búsqueda por nombre. Orden: prioridad, próxima entrega, último movimiento.
- Sección "Requiere tu atención" para usuarios OPA: entregables esperando aprobación. Para dev: solicitudes de cambio nuevas y entregables rechazados.

### 4.2 Detalle de proyecto
Encabezado con nombre, descripción corta, estatus, salud, % avance, fechas de inicio y entrega objetivo, prioridad. Pestañas:
1. **Resumen:** línea de tiempo horizontal de fases/hitos (completada, en curso, pendiente, retrasada), próximos 3 hitos, últimas 3 entradas de bitácora.
2. **Tareas:** lista agrupada por fase con estatus (pendiente, en progreso, bloqueada, hecha). Solo lectura para OPA. **[SUPUESTO]** Axel puede marcar tareas como internas (no visibles para OPA).
3. **Entregables:** lista con versión, fecha, estatus (borrador, en revisión, aprobado, rechazado, cambios solicitados), enlace o archivo, historial de revisiones y botones Aprobar / Rechazar / Pedir cambios (usuarios OPA). Rechazar o pedir cambios exige comentario.
4. **Bitácora:** entradas del proyecto en orden cronológico inverso.
5. **Solicitudes de cambio:** lista y formulario.
6. **Comentarios / actividad:** hilo general del proyecto e historial de eventos.

### 4.3 Bitácora del desarrollador
- Entrada con título, cuerpo en Markdown, tipo (avance, entrega, bloqueo, nota, reunión), proyecto, fecha, adjuntos o enlaces opcionales.
- Vista global (todas las entradas, filtrable por proyecto) y vista por proyecto.
- Comentarios en cada entrada.
- Indicador "nuevo" para entradas no leídas por el usuario.

### 4.4 Comentarios, solicitudes de cambio y aprobaciones
- **Comentarios:** en proyecto, entregable o entrada de bitácora. Texto plano con saltos de línea y menciones simples (@Axel). Sin hilos anidados en el MVP (un nivel de respuesta).
- **Solicitudes de cambio:** título, descripción, prioridad, proyecto, adjunto opcional. Estatus: nueva → en análisis → aceptada / rechazada → en progreso → completada. Axel responde con un comentario y, si aplica, estimación de impacto (texto libre, p. ej. "+3 días").
- **Aprobación de entregables:** cada decisión queda registrada (quién, cuándo, decisión, comentario, versión). Un entregable aprobado no se puede editar; una nueva versión crea un registro nuevo.

### 4.5 Usuarios y cuenta
- Login con correo y contraseña; recuperación de contraseña por correo.
- Registro público **deshabilitado**. Axel invita usuarios desde una pantalla de administración (o desde el panel de Supabase en fase 2).
- Perfil: nombre, avatar opcional, preferencias de notificación (fase 3).

### 4.6 Notificaciones por correo (fase 3)
| Evento | Destinatarios |
|---|---|
| Entregable enviado a revisión | todos los de OPA |
| Entregable aprobado / rechazado | dev + los demás de OPA (para que sepan que ya se resolvió) |
| Nueva solicitud de cambio | dev |
| Cambio de estatus de una solicitud | todos los de OPA |
| Nueva entrada de bitácora tipo "entrega" o "bloqueo" | todos los de OPA |
| Comentario nuevo | dev, y el autor del elemento comentado |
| Resumen semanal (lunes 8:00, hora de Cancún) | todos los de OPA |

Cada usuario puede apagar los correos no críticos. **[SUPUESTO]** Zona horaria del despacho: America/Cancun (los teléfonos del sitio usan lada 987, Quintana Roo).

## 5. Requerimientos no funcionales
- **Idioma:** todo en español (México). Fechas en formato `23 nov 2026`, moneda no aplica.
- **Responsive:** utilizable en móvil para consultar y aprobar; la captura intensiva es de escritorio.
- **Accesibilidad:** contraste WCAG AA, navegación por teclado, foco visible.
- **Rendimiento:** dashboard carga en < 2 s en conexión normal.
- **Seguridad:** toda regla de acceso se aplica en la base de datos con RLS, no solo en la UI. Sin llaves de servicio en el cliente.
- **Costo:** $0 al mes. Ver sección 9.

## 6. Arquitectura y stack

| Capa | Elección |
|---|---|
| Frontend | React 18 + Vite + TypeScript (strict) |
| UI | Tailwind CSS + shadcn/ui (Radix), íconos lucide-react |
| Ruteo | React Router |
| Datos servidor | TanStack Query |
| Formularios | react-hook-form + zod |
| Fechas | date-fns con locale `es` |
| Markdown | react-markdown (sin HTML crudo) |
| Backend | Supabase: Postgres, Auth, Storage, Edge Functions |
| Correo (fase 3) | Resend (free tier) llamado desde Edge Function o Database Webhook |
| Deploy | Vercel para la presentación del concepto (SPA estática con rewrite a `index.html`); host privado si se aprueba |
| Calidad | ESLint, Prettier, Vitest + Testing Library |

**Capa de datos desacoplada:** desde la fase 1 todo acceso a datos pasa por funciones en `src/data/` (p. ej. `getProjects()`, `getProject(slug)`), que en fase 1 leen datos mock y en fase 2 se reemplazan por Supabase sin tocar componentes.

## 7. Modelo de datos (Supabase / Postgres)

### 7.1 Enums
```sql
create type user_role         as enum ('dev','opa');
create type project_status    as enum ('planeacion','en_progreso','en_pausa','en_revision','completado','cancelado');
create type project_health    as enum ('en_tiempo','en_riesgo','retrasado');
create type priority_level    as enum ('alta','media','baja');
create type milestone_status  as enum ('pendiente','en_curso','completado','retrasado');
create type task_status       as enum ('pendiente','en_progreso','bloqueada','hecha');
create type deliverable_status as enum ('borrador','en_revision','aprobado','rechazado','cambios_solicitados');
create type review_decision   as enum ('aprobado','rechazado','cambios_solicitados');
create type update_type       as enum ('avance','entrega','bloqueo','nota','reunion');
create type change_req_status as enum ('nueva','en_analisis','aceptada','rechazada','en_progreso','completada');
create type comment_target    as enum ('project','deliverable','update','change_request');
```

### 7.2 Tablas

| Tabla | Columnas principales | Notas |
|---|---|---|
| `profiles` | `id uuid PK → auth.users`, `full_name`, `email`, `role user_role`, `job_title`, `avatar_url`, `is_active bool`, `notify_prefs jsonb`, `created_at` | Se crea por trigger al invitar usuario. Solo dev cambia `role` e `is_active`. |
| `projects` | `id`, `slug unique`, `name`, `summary`, `description_md`, `status`, `health`, `priority`, `progress_override smallint null`, `start_date`, `target_date`, `is_published bool`, `archived_at`, `created_at`, `updated_at` | `progress` se calcula en la vista `project_overview`; si hay override se usa ese. |
| `project_members` | `project_id`, `user_id`, PK compuesta | Reservada. En el MVP no se usa para filtrar. |
| `milestones` | `id`, `project_id`, `name`, `description`, `position int`, `weight smallint default 1`, `start_date`, `due_date`, `status`, `completed_at` | Fases/hitos de la línea de tiempo. |
| `tasks` | `id`, `project_id`, `milestone_id null`, `title`, `status`, `due_date`, `is_internal bool`, `position`, `updated_at` | `is_internal` = oculta para OPA. |
| `deliverables` | `id`, `project_id`, `milestone_id null`, `title`, `description`, `version int`, `status`, `link_url`, `storage_path`, `submitted_at`, `decided_at`, `created_by` | Inmutable una vez aprobado (trigger). |
| `deliverable_reviews` | `id`, `deliverable_id`, `reviewer_id`, `decision`, `comment`, `created_at` | Histórico de decisiones; solo insert. |
| `project_updates` | `id`, `project_id`, `author_id`, `type`, `title`, `body_md`, `published_at`, `created_at` | Bitácora. |
| `change_requests` | `id`, `project_id`, `requested_by`, `title`, `description`, `priority`, `status`, `impact_note`, `resolved_at`, `created_at`, `updated_at` | |
| `comments` | `id`, `project_id`, `target_type comment_target`, `target_id uuid`, `parent_id null`, `author_id`, `body`, `created_at`, `edited_at`, `deleted_at` | `project_id` siempre presente para simplificar RLS. |
| `read_receipts` | `user_id`, `target_type`, `target_id`, `read_at` | Para indicadores "nuevo / sin leer". |
| `activity_log` | `id`, `project_id`, `actor_id`, `action text`, `entity_type`, `entity_id`, `meta jsonb`, `created_at` | Llenada por triggers. Solo insert. |
| `notifications_outbox` (fase 3) | `id`, `event`, `payload jsonb`, `recipients uuid[]`, `status`, `sent_at`, `error` | Cola que procesa la Edge Function de correo. |

Vista **`project_overview`**: une proyecto + % avance calculado (`sum(weight de hitos completados) / sum(weight)`) + próximo hito + contadores de alertas. Es lo que consume el dashboard.

**Storage:** bucket privado `deliverables`, ruta `{project_id}/{deliverable_id}/{archivo}`. Descarga por URL firmada. Límite sugerido de 20 MB por archivo para cuidar el 1 GB gratuito; los archivos grandes van como enlace (Drive, Figma, etc.).

### 7.3 Políticas RLS (resumen)

Funciones auxiliares (`security definer`, `stable`, `search_path` fijo):
```sql
create function public.current_role() returns user_role ...  -- role del profile de auth.uid(), solo si is_active
create function public.is_dev()  returns bool ... -- current_role() = 'dev'
create function public.is_opa()  returns bool ... -- current_role() = 'opa'
create function public.can_see_project(p uuid) returns bool ... -- is_dev() or (is_opa() and proyecto publicado y no archivado)
```

| Tabla | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `profiles` | cualquier usuario activo | trigger | propio (excepto `role`, `is_active`); dev todo | nadie (se desactiva) |
| `projects` | `can_see_project(id)` | dev | dev; OPA solo `priority` (vía RPC `set_project_priority`) | dev |
| `milestones` | `can_see_project(project_id)` | dev | dev | dev |
| `tasks` | dev; OPA si `can_see_project` y `not is_internal` | dev | dev | dev |
| `deliverables` | dev; OPA si `can_see_project` y `status <> 'borrador'` | dev | dev, excepto si `status='aprobado'` | dev si borrador |
| `deliverable_reviews` | `can_see_project` | solo vía RPC `review_deliverable()` que valida rol `opa` y estado `en_revision` | nadie | nadie |
| `project_updates` | `can_see_project` | dev | dev | dev |
| `change_requests` | `can_see_project` | OPA, con `requested_by = auth.uid()` y `status='nueva'` | dev (estatus, impact_note); OPA solo `priority`; autor puede editar mientras `status='nueva'` | nadie |
| `comments` | `can_see_project` | usuario activo con `author_id = auth.uid()` | autor dentro de 15 min | soft delete del autor; dev puede ocultar |
| `read_receipts` | propios | propios | propios | propios |
| `activity_log` | `can_see_project` | triggers (`security definer`) | nadie | nadie |

**Reglas clave:**
- Las acciones con lógica (aprobar entregable, cambiar estatus de solicitud, cambiar prioridad) se hacen con funciones RPC de Postgres que validan rol y estado, y escriben en `activity_log` en la misma transacción.
- El cliente usa solo la `anon key`. La `service_role` vive solo en Edge Functions.
- `alter table ... enable row level security` en **todas** las tablas; ninguna tabla sin políticas.
- Pruebas de RLS: script SQL que simula cada rol (`set local role authenticated; set local request.jwt.claims ...`) y verifica lo permitido y lo prohibido.

## 8. Guía de diseño

Extraída del sitio actual (opasesores.com, WordPress con tema Flatsome), modernizada.

### 8.1 Identidad observada
- **Nombre de marca:** OP&A. Lema: "Te asesoramos en acelerar el éxito de tu empresa".
- **Logo:** Axel lo dejó en la carpeta `logo/` del workspace. El agente lo copia a `public/brand/` y, si no hay versión en blanco para la sidebar oscura, la genera (SVG con `fill` blanco o filtro CSS) o usa la sidebar clara como alternativa.
- **Colores del sitio:** dorado/arena `#A3885D` (botones y acentos), azul marino `#334862` (títulos y enlaces), beige `#ECE9E1` y `#F3F2EE` (fondos de sección), grises de texto `#333333`, `#4D4D4D`, `#777777`.
- **Tipografía del sitio:** Lato (cuerpo), Source Serif Pro (detalles), Dancing Script (decorativa).

### 8.2 Tokens propuestos

| Token | Valor | Uso |
|---|---|---|
| `--brand-navy-900` | `#1C2A3A` | Sidebar, encabezados oscuros |
| `--brand-navy-700` | `#334862` | Color primario: botones primarios, enlaces, títulos |
| `--brand-navy-100` | `#E6EBF1` | Fondos seleccionados, hover suave |
| `--brand-gold-600` | `#8A7149` | Texto dorado sobre blanco (cumple AA en tamaño grande) |
| `--brand-gold-500` | `#A3885D` | Acento: indicador de navegación activa, barras de progreso, bordes destacados |
| `--brand-gold-100` | `#F2ECE1` | Fondos de acento |
| `--surface` | `#FFFFFF` | Tarjetas |
| `--background` | `#F7F6F2` | Fondo de la app (beige muy claro, eco del sitio) |
| `--border` | `#E4E1D8` | Bordes |
| `--text` | `#1F2933` | Texto principal |
| `--text-muted` | `#5F6B7A` | Texto secundario |
| `--success` | `#2F7D5B` | En tiempo / aprobado / completado |
| `--warning` | `#B7791F` | En riesgo / en revisión |
| `--danger` | `#B23B3B` | Retrasado / rechazado / bloqueado |
| `--info` | `#2F6FA3` | En progreso / informativo |

- Mapear estos tokens a las variables CSS de shadcn (`--primary`, `--accent`, `--ring`, etc.) en `src/index.css`, en formato HSL.
- El dorado **no** se usa para texto pequeño sobre blanco (contraste insuficiente); solo acentos o texto grande con `gold-600`.
- **[SUPUESTO]** Solo modo claro en el MVP; los tokens se definen de forma que el modo oscuro se pueda añadir después.

### 8.3 Tipografía
- **UI y cuerpo:** Inter (Google Fonts), con `font-variant-numeric: tabular-nums` en cifras y porcentajes. Más moderna y legible en dashboards que Lato. **[SUPUESTO]** Si se prefiere continuidad total con el sitio, usar Lato.
- **Títulos de página y nombre de proyecto:** Source Serif 4 (sucesora de Source Serif Pro), peso 600. Da el toque "despacho profesional".
- Escala: 12 / 14 (base) / 16 / 20 / 24 / 30 px.

### 8.4 Estilo de componentes
- Layout: sidebar fija azul marino con logo en blanco, navegación (Inicio, Proyectos, Bitácora, Solicitudes, Administración solo dev) y usuario abajo; contenido sobre fondo beige claro.
- Tarjetas blancas, radio 10–12 px, borde `--border`, sombra muy sutil; hover eleva ligeramente.
- Barra de progreso dorada sobre gris claro; chips de estatus con fondo tenue y texto oscuro del mismo tono.
- Densidad media, mucho aire, sin degradados ni ilustraciones infantiles. Íconos lucide de trazo 1.5.
- Estados vacíos con texto claro ("Aún no hay entregables en este proyecto").
- Microcopias en tono profesional y cercano. **[SUPUESTO]** Tuteo, igual que el sitio ("Te asesoramos").

## 9. Restricciones de tier gratuita

| Servicio | Límite relevante (free) | Cómo nos afecta |
|---|---|---|
| Supabase | 500 MB de base de datos, 1 GB de Storage, 50 000 usuarios activos al mes, 500 000 invocaciones de Edge Functions, 2 proyectos activos | Sobra para 4 usuarios. Cuidar Storage: archivos grandes como enlace. |
| Supabase | **El proyecto se pausa tras 7 días sin actividad** | Programar un "ping" semanal (cron de Vercel o GitHub Actions que haga una consulta ligera). |
| Supabase | Sin backups automáticos descargables en free | GitHub Action semanal con `pg_dump` (o `supabase db dump`) a un artefacto privado. |
| Supabase Auth | El SMTP integrado tiene límite muy bajo de correos por hora | Configurar SMTP propio (Resend) para invitaciones y recuperación de contraseña desde la fase 2. |
| Resend | 3 000 correos/mes, 100/día, requiere verificar un dominio | Suficiente. Requiere acceso DNS a un dominio (ver pendientes). |
| Vercel Hobby | Uso no comercial; 100 GB de transferencia | Se usa solo para **presentar el concepto**. Si OPA aprueba, el proyecto se traslada a un host privado. Por eso el frontend se mantiene como SPA estática sin dependencias propias de Vercel. |

*(Límites vigentes según la documentación pública conocida; verificar en los sitios oficiales al configurar.)*

## 10. Fases y criterios de aceptación

### Fase 1 — Maqueta navegable con datos de ejemplo
**Objetivo:** validar diseño y flujo con el despacho antes de construir backend.

Entregables:
- Proyecto Vite + React + TS + Tailwind + shadcn configurado, con lint, formato y tests.
- Tokens de marca y tipografía aplicados.
- Layout (sidebar, encabezado, contenido) responsive.
- Páginas: Login (visual, sin auth real), Dashboard, Detalle de proyecto con sus 6 pestañas, Bitácora global, Solicitudes de cambio global, Administración de usuarios (visual).
- Datos mock tipados en `src/data/mock/` (3–4 proyectos realistas del despacho en distintos estados) servidos por `src/data/` con la misma firma que tendrá Supabase.
- Selector de "ver como" (Axel / Admin OPA / Ejecutivo 1 / Ejecutivo 2) en modo desarrollo y demo para revisar la UI por rol.
- Deploy de vista previa.

Criterios de aceptación:
- [ ] `npm run dev`, `npm run build`, `npm run lint` y `npm test` pasan sin errores.
- [ ] El dashboard muestra KPIs y tarjetas con todos los campos de 4.1, con filtros y orden funcionando sobre el mock.
- [ ] El detalle muestra línea de tiempo de hitos con los 4 estados visualmente distintos.
- [ ] Cambiar el rol en el selector oculta o muestra acciones según la matriz 3.1 (p. ej. botón Aprobar solo para usuarios OPA; tareas internas ocultas para OPA; herramientas de edición solo para dev).
- [ ] Aprobar, rechazar, comentar y crear solicitud funcionan en memoria (estado local) con validación de formularios.
- [ ] Se ve bien en 375 px, 768 px y 1440 px de ancho, sin scroll horizontal.
- [ ] Todo el texto visible está en español; fechas con locale `es`.
- [ ] Ningún componente importa datos mock directamente: todo pasa por `src/data/`.
- [ ] Axel y el Admin OPA revisan la maqueta y aprueban el diseño.

### Fase 2 — Autenticación y datos reales
- Proyecto Supabase creado; migraciones SQL versionadas en `supabase/migrations/`.
- Esquema, enums, vista, triggers, RPCs y RLS de la sección 7.
- Auth con correo y contraseña, registro deshabilitado, 4 usuarios invitados, rutas protegidas.
- `src/data/` reimplementado sobre Supabase; tipos generados con `supabase gen types`.
- Pantalla de administración para que dev cree y edite proyectos, hitos, tareas, entregables y bitácora.
- Seed de desarrollo; ping semanal anti-pausa; respaldo semanal.

Criterios de aceptación:
- [ ] Un usuario OPA autenticado no puede, ni por UI ni llamando a la API con su token, ver proyectos no publicados, tareas internas o entregables en borrador, ni editar proyectos (probado con el script de RLS).
- [ ] Cualquier usuario OPA puede aprobar o rechazar un entregable y la decisión queda en `deliverable_reviews` y `activity_log`; dev no puede.
- [ ] Un entregable aprobado no se puede modificar.
- [ ] Sin `service_role` en el bundle del frontend (verificado buscando en `dist/`).
- [ ] Todas las tablas tienen RLS habilitado.
- [ ] Recuperar contraseña funciona por correo.

### Fase 3 — Interacción completa y notificaciones
- Indicadores de no leído, menciones, historial de actividad.
- `notifications_outbox` + Edge Function que envía con Resend; preferencias por usuario.
- Resumen semanal.
- Pulido: estados vacíos, carga, errores, accesibilidad.

Criterios de aceptación:
- [ ] Cada evento de la tabla 4.6 genera correo a los destinatarios correctos en menos de 2 minutos.
- [ ] Un usuario que apaga un tipo de correo no lo recibe.
- [ ] El resumen semanal llega el lunes con proyectos, avances y pendientes de aprobación.
- [ ] Auditoría Lighthouse ≥ 90 en accesibilidad y buenas prácticas.

## 11. Pendientes por confirmar
1. Dominio para correo (fase 3): Resend necesita un dominio verificado con acceso DNS.
2. Lista de proyectos reales actuales para sembrar la fase 2.
3. Inter vs. Lato como tipografía principal.

**Resuelto (23 nov 2026):** los 3 usuarios OPA tienen los mismos permisos; todos ven todos los proyectos; Vercel solo para presentar el concepto; logo en `logo/` del workspace.
