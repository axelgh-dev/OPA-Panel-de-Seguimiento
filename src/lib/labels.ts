import type {
  ChangeReqStatus,
  DeliverableStatus,
  MilestoneStatus,
  PriorityLevel,
  ProjectHealth,
  ProjectStatus,
  ProjectTab,
  ReviewDecision,
  TaskStatus,
  UpdateType,
  UserRole,
} from '@/data'

export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'gold'

interface Meta {
  label: string
  tone: Tone
}

export const PROJECT_STATUS: Record<ProjectStatus, Meta> = {
  planeacion: { label: 'En planeación', tone: 'gold' },
  en_progreso: { label: 'En progreso', tone: 'info' },
  en_pausa: { label: 'En pausa', tone: 'neutral' },
  en_revision: { label: 'En revisión', tone: 'warning' },
  completado: { label: 'Completado', tone: 'success' },
  cancelado: { label: 'Cancelado', tone: 'neutral' },
}

export const HEALTH: Record<ProjectHealth, Meta> = {
  en_tiempo: { label: 'En tiempo', tone: 'success' },
  en_riesgo: { label: 'En riesgo', tone: 'warning' },
  retrasado: { label: 'Retrasado', tone: 'danger' },
}

export const PRIORITY: Record<PriorityLevel, { label: string }> = {
  alta: { label: 'Alta' },
  media: { label: 'Media' },
  baja: { label: 'Baja' },
}

export const MILESTONE_STATUS: Record<MilestoneStatus, Meta> = {
  pendiente: { label: 'Pendiente', tone: 'neutral' },
  en_curso: { label: 'En curso', tone: 'info' },
  completado: { label: 'Completado', tone: 'success' },
  retrasado: { label: 'Retrasado', tone: 'danger' },
}

export const TASK_STATUS: Record<TaskStatus, Meta> = {
  pendiente: { label: 'Pendiente', tone: 'neutral' },
  en_progreso: { label: 'En progreso', tone: 'info' },
  bloqueada: { label: 'Bloqueada', tone: 'danger' },
  hecha: { label: 'Hecha', tone: 'success' },
}

export const DELIVERABLE_STATUS: Record<DeliverableStatus, Meta> = {
  borrador: { label: 'Borrador', tone: 'neutral' },
  en_revision: { label: 'En revisión', tone: 'warning' },
  aprobado: { label: 'Aprobado', tone: 'success' },
  rechazado: { label: 'Rechazado', tone: 'danger' },
  cambios_solicitados: { label: 'Cambios solicitados', tone: 'gold' },
}

export const REVIEW_DECISION: Record<ReviewDecision, Meta> = {
  aprobado: { label: 'Aprobó', tone: 'success' },
  rechazado: { label: 'Rechazó', tone: 'danger' },
  cambios_solicitados: { label: 'Pidió cambios', tone: 'gold' },
}

export const CHANGE_REQ_STATUS: Record<ChangeReqStatus, Meta> = {
  nueva: { label: 'Nueva', tone: 'gold' },
  en_analisis: { label: 'En análisis', tone: 'warning' },
  aceptada: { label: 'Aceptada', tone: 'success' },
  rechazada: { label: 'Rechazada', tone: 'danger' },
  en_progreso: { label: 'En progreso', tone: 'info' },
  completada: { label: 'Completada', tone: 'success' },
}

export const UPDATE_TYPE: Record<UpdateType, Meta> = {
  avance: { label: 'Avance', tone: 'info' },
  entrega: { label: 'Entrega', tone: 'success' },
  bloqueo: { label: 'Bloqueo', tone: 'danger' },
  nota: { label: 'Nota', tone: 'neutral' },
  reunion: { label: 'Reunión', tone: 'gold' },
}

export const ROLE_LABEL: Record<UserRole, string> = {
  dev: 'Desarrollador',
  opa: 'Despacho OPA',
}

export const TAB_LABEL: Record<ProjectTab, string> = {
  resumen: 'Resumen',
  tareas: 'Tareas',
  entregables: 'Entregables',
  bitacora: 'Bitácora',
  solicitudes: 'Solicitudes',
  actividad: 'Comentarios',
}

export const PROJECT_TABS: ProjectTab[] = [
  'resumen',
  'tareas',
  'entregables',
  'bitacora',
  'solicitudes',
  'actividad',
]
