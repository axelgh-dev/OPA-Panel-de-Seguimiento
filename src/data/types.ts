/**
 * Tipos de dominio. Espejo del modelo de datos de docs/REQUERIMIENTOS.md §7.
 * Fechas: `*_date` es 'YYYY-MM-DD'; `*_at` es ISO 8601 con hora.
 * En fase 2 estos tipos se reemplazan/alinean con los generados por `supabase gen types`.
 */

// ---------- Enums (§7.1) ----------
export type UserRole = 'dev' | 'opa'
export type ProjectStatus =
  'planeacion' | 'en_progreso' | 'en_pausa' | 'en_revision' | 'completado' | 'cancelado'
export type ProjectHealth = 'en_tiempo' | 'en_riesgo' | 'retrasado'
export type PriorityLevel = 'alta' | 'media' | 'baja'
export type MilestoneStatus = 'pendiente' | 'en_curso' | 'completado' | 'retrasado'
export type TaskStatus = 'pendiente' | 'en_progreso' | 'bloqueada' | 'hecha'
export type DeliverableStatus =
  'borrador' | 'en_revision' | 'aprobado' | 'rechazado' | 'cambios_solicitados'
export type ReviewDecision = 'aprobado' | 'rechazado' | 'cambios_solicitados'
export type UpdateType = 'avance' | 'entrega' | 'bloqueo' | 'nota' | 'reunion'
export type ChangeReqStatus =
  'nueva' | 'en_analisis' | 'aceptada' | 'rechazada' | 'en_progreso' | 'completada'
export type CommentTarget = 'project' | 'deliverable' | 'update' | 'change_request'

// ---------- Tablas (§7.2) ----------
export interface Profile {
  id: string
  full_name: string
  email: string
  role: UserRole
  job_title: string
  avatar_url: string | null
  is_active: boolean
  created_at: string
}

export interface Project {
  id: string
  slug: string
  name: string
  summary: string
  description_md: string
  status: ProjectStatus
  health: ProjectHealth
  priority: PriorityLevel
  /** Si no es null, sustituye al % calculado por peso de hitos. */
  progress_override: number | null
  start_date: string
  target_date: string
  is_published: boolean
  archived_at: string | null
  created_at: string
  updated_at: string
}

export interface Milestone {
  id: string
  project_id: string
  name: string
  description: string
  position: number
  weight: number
  start_date: string
  due_date: string
  status: MilestoneStatus
  completed_at: string | null
}

export interface Task {
  id: string
  project_id: string
  milestone_id: string | null
  title: string
  status: TaskStatus
  due_date: string | null
  /** Tarea interna: oculta para usuarios `opa`. */
  is_internal: boolean
  position: number
  updated_at: string
}

export interface Deliverable {
  id: string
  project_id: string
  milestone_id: string | null
  title: string
  description: string
  version: number
  status: DeliverableStatus
  link_url: string | null
  storage_path: string | null
  submitted_at: string | null
  decided_at: string | null
  created_by: string
}

export interface DeliverableReview {
  id: string
  deliverable_id: string
  reviewer_id: string
  decision: ReviewDecision
  comment: string
  created_at: string
}

export interface ProjectUpdate {
  id: string
  project_id: string
  author_id: string
  type: UpdateType
  title: string
  body_md: string
  published_at: string
  created_at: string
}

export interface ChangeRequest {
  id: string
  project_id: string
  requested_by: string
  title: string
  description: string
  priority: PriorityLevel
  status: ChangeReqStatus
  impact_note: string | null
  resolved_at: string | null
  created_at: string
  updated_at: string
}

export interface Comment {
  id: string
  project_id: string
  target_type: CommentTarget
  target_id: string
  parent_id: string | null
  author_id: string
  body: string
  created_at: string
  edited_at: string | null
  deleted_at: string | null
}

export interface ActivityEvent {
  id: string
  project_id: string
  actor_id: string
  /** Acción en lenguaje de negocio, p. ej. 'entregable_aprobado'. */
  action: ActivityAction
  entity_type: 'project' | 'deliverable' | 'update' | 'change_request' | 'comment' | 'milestone'
  entity_id: string
  /** Texto legible ya resuelto (título del elemento). */
  entity_label: string
  meta: Record<string, string | number | null>
  created_at: string
}

export interface ActivityWithActor extends ActivityEvent {
  actor: Profile
  project_name: string
}

export type ActivityAction =
  | 'entregable_enviado'
  | 'entregable_aprobado'
  | 'entregable_rechazado'
  | 'entregable_cambios_solicitados'
  | 'bitacora_publicada'
  | 'solicitud_creada'
  | 'solicitud_estatus'
  | 'comentario_creado'
  | 'hito_completado'
  | 'prioridad_cambiada'

// ---------- Vistas de lectura ----------
interface ProjectAlerts {
  pending_deliverables: number
  open_change_requests: number
  unread_comments: number
}

/** Hito reducido para dibujar la barra de avance segmentada por peso. */
export type MilestoneSegment = Pick<Milestone, 'id' | 'name' | 'weight' | 'status'>

/** Equivale a la vista `project_overview` (§7.2). */
export interface ProjectOverview extends Project {
  segments: MilestoneSegment[]
  /** 0–100, calculado por peso de hitos o `progress_override`. */
  progress: number
  current_milestone: Milestone | null
  next_milestone: Milestone | null
  alerts: ProjectAlerts
  last_activity_at: string
}

export interface DeliverableWithReviews extends Deliverable {
  reviews: (DeliverableReview & { reviewer: Profile })[]
  creator: Profile
}

export interface CommentWithAuthor extends Comment {
  author: Profile
}

export interface UpdateWithMeta extends ProjectUpdate {
  author: Profile
  project_name: string
  project_slug: string
  comment_count: number
  is_new: boolean
}

export interface ChangeRequestWithMeta extends ChangeRequest {
  requester: Profile
  project_name: string
  project_slug: string
  comment_count: number
}

// ---------- Dashboard ----------
export interface DashboardKpis {
  active_projects: number
  upcoming_deliveries: number
  pending_approvals: number
  open_change_requests: number
}

export type ProjectTab =
  'resumen' | 'tareas' | 'entregables' | 'bitacora' | 'solicitudes' | 'actividad'

// ---------- Filtros y entradas de mutación ----------
export type ProjectSort = 'prioridad' | 'proxima_entrega' | 'ultimo_movimiento'

export interface ProjectFilters {
  status?: ProjectStatus | 'todos'
  priority?: PriorityLevel | 'todas'
  search?: string
  sort?: ProjectSort
}

export interface ReviewDeliverableInput {
  deliverable_id: string
  decision: ReviewDecision
  comment: string
}

export interface AddCommentInput {
  project_id: string
  target_type: CommentTarget
  target_id: string
  body: string
  parent_id?: string | null
}

export interface EditCommentInput {
  id: string
  body: string
}

export interface CreateChangeRequestInput {
  project_id: string
  title: string
  description: string
  priority: PriorityLevel
}

export interface SetChangeRequestStatusInput {
  id: string
  status: ChangeReqStatus
  impact_note?: string | null
}
