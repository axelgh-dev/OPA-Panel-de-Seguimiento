import type { Milestone, Project } from '../types'
import { d, t } from './dates'

export const PORTAL = 'pr-portal'
export const CONCILIA = 'pr-concilia'
export const SAT = 'pr-sat'
export const WEB = 'pr-web'
export const TABLERO = 'pr-tablero'

export const projects: Project[] = [
  {
    id: PORTAL,
    slug: 'portal-clientes-documentos-fiscales',
    name: 'Portal de clientes para documentos fiscales',
    summary:
      'Espacio seguro donde los clientes del despacho entregan y descargan sus documentos fiscales sin usar correo.',
    description_md: `Portal web para que cada cliente de OP&A suba sus comprobantes, constancias y declaraciones, y descargue los documentos que el despacho le entrega.

**Objetivos**
- Reemplazar el intercambio de archivos por correo y mensajería.
- Dar a cada cliente visibilidad de qué documentos faltan por entregar.
- Dejar historial de qué se entregó y cuándo.`,
    status: 'en_progreso',
    health: 'en_riesgo',
    priority: 'alta',
    progress_override: null,
    start_date: d(-75),
    target_date: d(24),
    is_published: true,
    archived_at: null,
    created_at: t(-80),
    updated_at: t(-1),
  },
  {
    id: CONCILIA,
    slug: 'automatizacion-conciliaciones-bancarias',
    name: 'Automatización de conciliaciones bancarias',
    summary:
      'Conciliación automática de estados de cuenta contra la contabilidad, con reporte de diferencias.',
    description_md: `Herramienta que lee los estados de cuenta de los bancos de los clientes, los cruza con los movimientos contables y señala solo las diferencias que requieren revisión humana.

**Alcance actual:** BBVA, Banorte, Santander y HSBC.`,
    status: 'en_revision',
    health: 'en_tiempo',
    priority: 'alta',
    progress_override: null,
    start_date: d(-60),
    target_date: d(30),
    is_published: true,
    archived_at: null,
    created_at: t(-65),
    updated_at: t(0),
  },
  {
    id: SAT,
    slug: 'control-obligaciones-sat',
    name: 'Sistema interno de control de obligaciones SAT',
    summary:
      'Calendario y tablero para dar seguimiento a las obligaciones fiscales de cada cliente y evitar vencimientos.',
    description_md: `Sistema interno para que el equipo vea, por cliente y por régimen, qué obligaciones vencen, cuáles están cumplidas y cuáles están en riesgo.

**Incluye:** calendario de obligaciones, alertas por correo, tablero de cumplimiento y bitácora de auditoría.`,
    status: 'en_progreso',
    health: 'retrasado',
    priority: 'media',
    progress_override: null,
    start_date: d(-120),
    target_date: d(45),
    is_published: true,
    archived_at: null,
    created_at: t(-125),
    updated_at: t(-2),
  },
  {
    id: WEB,
    slug: 'sitio-web-corporativo',
    name: 'Sitio web corporativo',
    summary:
      'Renovación del sitio de OP&A: nueva arquitectura de contenidos, diseño moderno y mejor posicionamiento.',
    description_md: `Rediseño de opasesores.com conservando la identidad de marca (dorado y azul marino), con contenido más claro por servicio y formulario de contacto directo.`,
    status: 'planeacion',
    health: 'en_tiempo',
    priority: 'baja',
    progress_override: null,
    start_date: d(-10),
    target_date: d(70),
    is_published: true,
    archived_at: null,
    created_at: t(-12),
    updated_at: t(-3),
  },
  {
    id: TABLERO,
    slug: 'tablero-indicadores-clientes',
    name: 'Tablero de indicadores para clientes',
    summary: 'Borrador: tablero con indicadores financieros mensuales para clientes del despacho.',
    description_md: `Idea en etapa de definición. Aún no se comparte con OP&A.`,
    status: 'planeacion',
    health: 'en_tiempo',
    priority: 'baja',
    progress_override: null,
    start_date: d(10),
    target_date: d(90),
    is_published: false,
    archived_at: null,
    created_at: t(-2),
    updated_at: t(-1),
  },
]

type M = Omit<Milestone, 'id' | 'position' | 'completed_at'> & { done?: number }
function build(projectId: string, prefix: string, items: M[]): Milestone[] {
  return items.map(({ done, ...m }, i) => ({
    ...m,
    id: `${prefix}-${i + 1}`,
    project_id: projectId,
    position: i + 1,
    completed_at: m.status === 'completado' ? t(done ?? -1) : null,
  }))
}

export const milestones: Milestone[] = [
  ...build(PORTAL, 'ms-portal', [
    {
      project_id: PORTAL,
      name: 'Levantamiento y diseño de experiencia',
      description: 'Entrevistas con el equipo, flujos y prototipo navegable.',
      weight: 1,
      start_date: d(-75),
      due_date: d(-58),
      status: 'completado',
      done: -59,
    },
    {
      project_id: PORTAL,
      name: 'Autenticación y perfiles de cliente',
      description: 'Acceso seguro por cliente, recuperación de contraseña y roles.',
      weight: 2,
      start_date: d(-57),
      due_date: d(-30),
      status: 'completado',
      done: -28,
    },
    {
      project_id: PORTAL,
      name: 'Carga y organización de documentos fiscales',
      description: 'Subida de archivos, carpetas por cliente y ejercicio, validaciones.',
      weight: 3,
      start_date: d(-29),
      due_date: d(6),
      status: 'en_curso',
    },
    {
      project_id: PORTAL,
      name: 'Buzón de avisos y notificaciones',
      description: 'Avisos al cliente cuando hay documentos nuevos o pendientes.',
      weight: 2,
      start_date: d(7),
      due_date: d(16),
      status: 'pendiente',
    },
    {
      project_id: PORTAL,
      name: 'Piloto con clientes y salida a producción',
      description: 'Prueba con 5 clientes, ajustes y publicación.',
      weight: 2,
      start_date: d(17),
      due_date: d(24),
      status: 'pendiente',
    },
  ]),
  ...build(CONCILIA, 'ms-concilia', [
    {
      project_id: CONCILIA,
      name: 'Análisis de layouts bancarios',
      description: 'Revisión de formatos de estado de cuenta de cada banco.',
      weight: 1,
      start_date: d(-60),
      due_date: d(-45),
      status: 'completado',
      done: -46,
    },
    {
      project_id: CONCILIA,
      name: 'Motor de conciliación automática',
      description: 'Reglas de cruce por monto, fecha y referencia.',
      weight: 3,
      start_date: d(-44),
      due_date: d(-8),
      status: 'completado',
      done: -9,
    },
    {
      project_id: CONCILIA,
      name: 'Reportes de diferencias y excepciones',
      description: 'Reporte para revisión humana de lo que no concilió.',
      weight: 2,
      start_date: d(-7),
      due_date: d(9),
      status: 'en_curso',
    },
    {
      project_id: CONCILIA,
      name: 'Capacitación y arranque con el equipo',
      description: 'Sesión de uso y acompañamiento en el primer cierre mensual.',
      weight: 1,
      start_date: d(10),
      due_date: d(30),
      status: 'pendiente',
    },
  ]),
  ...build(SAT, 'ms-sat', [
    {
      project_id: SAT,
      name: 'Catálogo de obligaciones y calendario',
      description: 'Obligaciones por régimen y fechas límite del ejercicio.',
      weight: 1,
      start_date: d(-120),
      due_date: d(-100),
      status: 'completado',
      done: -101,
    },
    {
      project_id: SAT,
      name: 'Alta de clientes y régimen fiscal',
      description: 'Padrón de clientes con su régimen y obligaciones asignadas.',
      weight: 2,
      start_date: d(-99),
      due_date: d(-60),
      status: 'completado',
      done: -58,
    },
    {
      project_id: SAT,
      name: 'Alertas de vencimiento por correo',
      description: 'Avisos automáticos antes de cada fecha límite.',
      weight: 2,
      start_date: d(-59),
      due_date: d(-6),
      status: 'retrasado',
    },
    {
      project_id: SAT,
      name: 'Tablero de cumplimiento por cliente',
      description: 'Vista del estado de cada obligación por cliente.',
      weight: 3,
      start_date: d(-5),
      due_date: d(20),
      status: 'pendiente',
    },
    {
      project_id: SAT,
      name: 'Carga manual de acuses',
      description: 'Registro de acuses de presentación con su evidencia.',
      weight: 2,
      start_date: d(21),
      due_date: d(33),
      status: 'pendiente',
    },
    {
      project_id: SAT,
      name: 'Bitácora de auditoría y cierre',
      description: 'Historial de cambios y documentación final.',
      weight: 1,
      start_date: d(34),
      due_date: d(45),
      status: 'pendiente',
    },
  ]),
  ...build(WEB, 'ms-web', [
    {
      project_id: WEB,
      name: 'Arquitectura de información y contenidos',
      description: 'Mapa del sitio, textos por servicio y fotografías.',
      weight: 2,
      start_date: d(-10),
      due_date: d(12),
      status: 'en_curso',
    },
    {
      project_id: WEB,
      name: 'Diseño visual y desarrollo',
      description: 'Diseño de páginas, desarrollo y formulario de contacto.',
      weight: 4,
      start_date: d(13),
      due_date: d(50),
      status: 'pendiente',
    },
    {
      project_id: WEB,
      name: 'Pruebas y publicación',
      description: 'Revisión en dispositivos, SEO básico y salida al aire.',
      weight: 1,
      start_date: d(51),
      due_date: d(70),
      status: 'pendiente',
    },
  ]),
  ...build(TABLERO, 'ms-tablero', [
    {
      project_id: TABLERO,
      name: 'Definición de indicadores',
      description: 'Qué indicadores ve cada cliente.',
      weight: 1,
      start_date: d(10),
      due_date: d(30),
      status: 'pendiente',
    },
    {
      project_id: TABLERO,
      name: 'Prototipo y validación',
      description: 'Prototipo con datos de ejemplo.',
      weight: 2,
      start_date: d(31),
      due_date: d(90),
      status: 'pendiente',
    },
  ]),
]
