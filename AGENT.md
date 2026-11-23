# AGENT.md — OPA Panel de Seguimiento

Guía permanente para agentes de código (Claude Code) que trabajen en este repositorio. Léela completa antes de cualquier cambio. La especificación funcional completa está en `docs/REQUERIMIENTOS.md`; si algo aquí contradice ese documento, gana el documento y avisa a Axel.

## Qué es
Portal web privado donde el despacho contable OP&A (OPA Asesores) ve, monitorea e interactúa con el avance de los proyectos de software que Axel (desarrollador) construye para ellos: dashboard de proyectos, detalle con hitos/tareas/entregables, bitácora del desarrollador, comentarios, solicitudes de cambio y aprobación de entregables.

## Usuarios y roles
- `dev` (Axel): control total, excepto aprobar sus propios entregables.
- `opa` (3 cuentas: Admin OPA, Ejecutivo 1, Ejecutivo 2, **todas con los mismos permisos**): ven todos los proyectos publicados, comentan, crean solicitudes de cambio, **aprueban, rechazan o piden cambios en entregables** y ajustan prioridades. El cargo de cada uno (`job_title`) es solo informativo; no condiciona permisos.
La matriz exacta está en `docs/REQUERIMIENTOS.md` §3.1. Cualquier regla de acceso se implementa en la base de datos (RLS); la UI solo refleja.

## Stack
React 18 + Vite + TypeScript (strict) · Tailwind CSS + shadcn/ui · React Router · TanStack Query · react-hook-form + zod · date-fns (locale `es`) · lucide-react · Vitest + Testing Library · Supabase (Postgres, Auth, Storage, Edge Functions) · Resend para correo · deploy en Vercel para presentar el concepto. Si se aprueba, se moverá a un host privado: mantén la app como SPA estática portable, sin APIs ni funciones específicas de Vercel.

**Restricción dura:** todo debe caber en las tiers gratuitas (Supabase free, Resend free, hosting free). No agregues servicios de pago ni dependencias que requieran uno. Si algo lo exigiría, detente y pregunta.

## Idioma
- Toda la UI, mensajes de error, correos, datos de ejemplo y documentación: **español de México**, tuteo.
- Código (nombres de variables, funciones, componentes, tablas, columnas): **inglés**. Valores de enums de negocio en español (`en_progreso`, `aprobado`, ...) tal como están en el modelo de datos.
- Mensajes de commit en español, formato Conventional Commits (`feat: dashboard con tarjetas de proyecto`).

## Estructura
```
src/
  app/            # router, providers, layout raíz
  components/
    ui/           # componentes shadcn generados (no editar a mano salvo tokens)
    layout/       # Sidebar, Topbar, PageHeader
    shared/       # StatusChip, ProgressBar, EmptyState, DateLabel, RoleGate...
  features/
    dashboard/
    projects/     # detalle y pestañas
    updates/      # bitácora
    deliverables/
    change-requests/
    comments/
    admin/
  data/
    types.ts      # tipos de dominio (espejo del modelo de datos)
    index.ts      # API pública: getProjects(), getProject(slug), reviewDeliverable()...
    mock/         # fase 1: datos de ejemplo y adaptador en memoria
    supabase/     # fase 2: adaptador real
  lib/            # utilidades (formatos de fecha, cn(), permisos)
  styles/ o index.css  # tokens de marca
supabase/
  migrations/     # SQL versionado (fase 2)
  seed.sql
docs/
  REQUERIMIENTOS.md
```

## Reglas de arquitectura
1. **Ningún componente importa de `src/data/mock/` ni de `@supabase/supabase-js` directamente.** Todo pasa por `src/data/index.ts` envuelto en hooks de TanStack Query (`useProjects`, `useProject`...). Así la fase 2 cambia el adaptador sin tocar la UI.
2. Los permisos de UI se resuelven con una sola función `can(role, action, entity?)` en `src/lib/permissions.ts`, alineada con la matriz §3.1. No dispersar `if (role === ...)` por los componentes.
3. Rol actual: en fase 1 viene de un selector "Ver como" (solo visible en `import.meta.env.DEV` o con `?demo=1`); en fase 2 viene del perfil en Supabase.
4. Formatos de fecha centralizados en `src/lib/format.ts` (`23 nov 2026`, "en 5 días", "hace 2 h").
5. Markdown de bitácora con `react-markdown` sin `rehype-raw` (nada de HTML crudo).
6. Supabase: el cliente solo usa la `anon key` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`). La `service_role` jamás va al frontend ni al repo. Toda tabla con RLS habilitado. Acciones con lógica (aprobar, cambiar estatus, prioridad) vía funciones RPC.
7. Migraciones SQL siempre como archivos nuevos en `supabase/migrations/`; nunca editar una migración ya aplicada.

## Diseño
Identidad tomada de opasesores.com y modernizada. Tokens (definir como variables CSS y mapear a las variables de shadcn):

| Token | Valor | Uso |
|---|---|---|
| navy-900 | `#1C2A3A` | Sidebar |
| navy-700 | `#334862` | Primario (botones, enlaces, títulos) |
| navy-100 | `#E6EBF1` | Selección / hover |
| gold-600 | `#8A7149` | Texto dorado (solo tamaño grande) |
| gold-500 | `#A3885D` | Acento: nav activa, barras de progreso |
| gold-100 | `#F2ECE1` | Fondo de acento |
| background | `#F7F6F2` | Fondo de la app |
| surface | `#FFFFFF` | Tarjetas |
| border | `#E4E1D8` | Bordes |
| text | `#1F2933` / muted `#5F6B7A` | Texto |
| success / warning / danger / info | `#2F7D5B` / `#B7791F` / `#B23B3B` / `#2F6FA3` | Estatus |

- Tipografía: **Inter** para UI (cifras con `tabular-nums`), **Source Serif 4** 600 para títulos de página y nombres de proyecto.
- Estilo serio y empresarial: tarjetas blancas, radio 10–12 px, sombras mínimas, mucho aire, sin degradados llamativos. Sidebar azul marino con el logo en blanco.
- Logo: los originales están en la carpeta `logo/` del workspace (no los modifiques). Copia lo necesario a `public/brand/`. Si no hay versión en blanco para la sidebar oscura, genérala (SVG con `fill` blanco, o filtro CSS sobre el PNG) y avisa.
- Contraste WCAG AA, foco visible, navegación por teclado. Responsive desde 375 px.

## Flujo de trabajo
- Trabaja en ramas `feat/...`, `fix/...`; no hagas commits directos a `main` salvo el commit inicial del scaffold.
- **No hagas `git push` ni abras PRs sin que Axel lo pida.** Commits locales sí, pequeños y descriptivos.
- Antes de dar algo por terminado: `npm run lint`, `npm run typecheck`, `npm test` y `npm run build` deben pasar. Si algo falla, dilo; no lo ocultes ni desactives reglas o tests para pasar.
- Si un requerimiento es ambiguo, elige la opción más sencilla coherente con `docs/REQUERIMIENTOS.md`, márcala con `// SUPUESTO:` y menciónala en tu resumen.
- No instales dependencias fuera del stack sin justificarlo en tu resumen.
- Nunca subas `.env*` (excepto `.env.example`) ni credenciales.

## Scripts esperados (package.json)
`dev`, `build`, `preview`, `lint`, `format`, `typecheck` (`tsc --noEmit`), `test` (`vitest run`).

## Estado del proyecto
- [ ] Fase 1 — Maqueta navegable con datos de ejemplo  ← **actual**
- [ ] Fase 2 — Supabase: auth, esquema, RLS, datos reales
- [ ] Fase 3 — Interacción completa y notificaciones por correo

Actualiza esta sección al cerrar cada fase.
