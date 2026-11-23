/**
 * API pública de datos. Es lo ÚNICO que la UI puede importar (AGENT.md, regla 1).
 *
 * Fase 1: adaptador en memoria sobre `./mock`. Fase 2: se reemplaza por Supabase
 * manteniendo estas firmas. Por eso:
 *  - El "usuario autenticado" es implícito (como `auth.uid()`): se fija con `setSession`.
 *  - La visibilidad por rol se aplica aquí (como RLS), no solo en la UI.
 *  - Las mutaciones validan rol y estado (como las RPC) y lanzan `DomainError`.
 */
import { isAfter, isBefore, addDays, startOfDay } from 'date-fns'
import { can } from '@/lib/permissions'
import { computeProgress } from '@/lib/progress'
import { getDb, resetDb as resetMockDb } from './mock/db'
import type {
  ActivityAction,
  ActivityEvent,
  ActivityWithActor,
  AddCommentInput,
  ChangeRequest,
  ChangeRequestWithMeta,
  CommentTarget,
  CommentWithAuthor,
  CreateChangeRequestInput,
  DashboardKpis,
  DeliverableWithReviews,
  Milestone,
  PriorityLevel,
  Profile,
  Project,
  ProjectFilters,
  ProjectOverview,
  ReviewDeliverableInput,
  SetChangeRequestStatusInput,
  Task,
  TaskStatus,
  UpdateWithMeta,
} from './types'

export * from './types'

// ---------- Infraestructura del adaptador mock ----------

export class DomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DomainError'
  }
}

let latencyMs = 200
/** Cambia la latencia simulada (las pruebas usan 0). */
export function setMockLatency(ms: number): void {
  latencyMs = ms
}

/** Espera la latencia simulada y devuelve una copia (la UI nunca toca el almacén). */
async function respond<T>(compute: () => T): Promise<T> {
  if (latencyMs > 0) await new Promise((r) => setTimeout(r, latencyMs))
  return structuredClone(compute())
}

// SUPUESTO: Admin OPA es el usuario por defecto de la maqueta.
export const DEFAULT_SESSION_USER_ID = 'u-admin'
let sessionUserId = DEFAULT_SESSION_USER_ID

export function setSession(userId: string): void {
  if (!getDb().profiles.some((p) => p.id === userId))
    throw new Error(`Usuario desconocido: ${userId}`)
  sessionUserId = userId
}

/** Solo fase 1: lista síncrona para el selector "Ver como". En fase 2 desaparece. */
export function listDemoUsers(): Profile[] {
  return structuredClone(getDb().profiles)
}

export function resetDb(): void {
  resetMockDb()
}

function viewer(): Profile {
  const me = getDb().profiles.find((p) => p.id === sessionUserId)
  if (!me) throw new DomainError('No hay una sesión activa.')
  return me
}

// ---------- Utilidades internas ----------

function visibleProjects(): Project[] {
  const me = viewer()
  // Igual que `can_see_project`: dev ve todo; OPA solo proyectos publicados y no archivados.
  if (can(me.role, 'project.view_draft')) return getDb().projects
  return getDb().projects.filter((p) => p.is_published && p.archived_at === null)
}

function visibleProjectIds(): Set<string> {
  return new Set(visibleProjects().map((p) => p.id))
}

function seenAt(userId: string, projectId: string): string {
  const db = getDb()
  return db.readAt[userId]?.[projectId] ?? db.defaultReadAt[userId] ?? '1970-01-01T00:00:00.000Z'
}

function profileById(id: string): Profile {
  const p = getDb().profiles.find((x) => x.id === id)
  if (!p) throw new Error(`Perfil inexistente: ${id}`)
  return p
}

function logActivity(
  project_id: string,
  action: ActivityAction,
  entity_type: ActivityEvent['entity_type'],
  entity_id: string,
  entity_label: string,
  meta: ActivityEvent['meta'] = {},
): void {
  getDb().activity.push({
    id: `ev-${crypto.randomUUID()}`,
    project_id,
    actor_id: sessionUserId,
    action,
    entity_type,
    entity_id,
    entity_label,
    meta,
    created_at: new Date().toISOString(),
  })
}

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

const PRIORITY_ORDER: Record<PriorityLevel, number> = { alta: 0, media: 1, baja: 2 }

function buildOverview(p: Project): ProjectOverview {
  const db = getDb()
  const me = viewer()
  const ms = db.milestones
    .filter((m) => m.project_id === p.id)
    .sort((a, b) => a.position - b.position)
  const open = ms.filter((m) => m.status !== 'completado')
  const current_milestone =
    open.find((m) => m.status === 'retrasado' || m.status === 'en_curso') ?? open[0] ?? null
  const next_milestone = [...open].sort((a, b) => a.due_date.localeCompare(b.due_date))[0] ?? null

  const visibleDeliverables = db.deliverables.filter(
    (d) => d.project_id === p.id && (me.role === 'dev' || d.status !== 'borrador'),
  )
  const seen = seenAt(me.id, p.id)
  const projectComments = db.comments.filter((c) => c.project_id === p.id && c.deleted_at === null)

  const stamps = [
    p.updated_at,
    ...db.activity.filter((e) => e.project_id === p.id).map((e) => e.created_at),
    ...projectComments.map((c) => c.created_at),
    ...db.updates.filter((u) => u.project_id === p.id).map((u) => u.published_at),
    ...db.changeRequests.filter((c) => c.project_id === p.id).map((c) => c.updated_at),
  ]

  return {
    ...p,
    segments: ms.map(({ id, name, weight, status }) => ({ id, name, weight, status })),
    progress: computeProgress(ms, p.progress_override),
    current_milestone,
    next_milestone,
    alerts: {
      pending_deliverables: visibleDeliverables.filter((d) => d.status === 'en_revision').length,
      open_change_requests: db.changeRequests.filter(
        (c) => c.project_id === p.id && c.status !== 'rechazada' && c.status !== 'completada',
      ).length,
      unread_comments: projectComments.filter((c) => c.author_id !== me.id && c.created_at > seen)
        .length,
    },
    last_activity_at: stamps.reduce((a, b) => (a > b ? a : b)),
  }
}

// ---------- Lecturas ----------

export function getProfiles(): Promise<Profile[]> {
  return respond(() => getDb().profiles)
}

export function getProjects(filters: ProjectFilters = {}): Promise<ProjectOverview[]> {
  return respond(() => {
    const { status = 'todos', priority = 'todas', search = '', sort = 'prioridad' } = filters
    const q = normalize(search.trim())
    const list = visibleProjects()
      .filter((p) => status === 'todos' || p.status === status)
      .filter((p) => priority === 'todas' || p.priority === priority)
      .filter((p) => q === '' || normalize(`${p.name} ${p.summary}`).includes(q))
      .map(buildOverview)

    const dueOf = (p: ProjectOverview) => p.next_milestone?.due_date ?? '9999-12-31'
    list.sort((a, b) => {
      if (sort === 'proxima_entrega') return dueOf(a).localeCompare(dueOf(b))
      if (sort === 'ultimo_movimiento') return b.last_activity_at.localeCompare(a.last_activity_at)
      return (
        PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || dueOf(a).localeCompare(dueOf(b))
      )
    })
    return list
  })
}

/** Devuelve null si no existe o el usuario no puede verlo (igual que RLS). */
export function getProject(slug: string): Promise<ProjectOverview | null> {
  return respond(() => {
    const p = visibleProjects().find((x) => x.slug === slug)
    return p ? buildOverview(p) : null
  })
}

export function getMilestones(projectId: string): Promise<Milestone[]> {
  return respond(() =>
    visibleProjectIds().has(projectId)
      ? getDb()
          .milestones.filter((m) => m.project_id === projectId)
          .sort((a, b) => a.position - b.position)
      : [],
  )
}

export function getTasks(projectId: string): Promise<Task[]> {
  return respond(() => {
    if (!visibleProjectIds().has(projectId)) return []
    const canSeeInternal = can(viewer().role, 'task.view_internal')
    return getDb()
      .tasks.filter((t) => t.project_id === projectId && (canSeeInternal || !t.is_internal))
      .sort((a, b) => a.position - b.position)
  })
}

export function getDeliverables(projectId: string): Promise<DeliverableWithReviews[]> {
  return respond(() => {
    if (!visibleProjectIds().has(projectId)) return []
    const db = getDb()
    const isDev = viewer().role === 'dev'
    return db.deliverables
      .filter((d) => d.project_id === projectId && (isDev || d.status !== 'borrador'))
      .map((d) => ({
        ...d,
        creator: profileById(d.created_by),
        reviews: db.reviews
          .filter((r) => r.deliverable_id === d.id)
          .sort((a, b) => b.created_at.localeCompare(a.created_at))
          .map((r) => ({ ...r, reviewer: profileById(r.reviewer_id) })),
      }))
      .sort((a, b) =>
        (b.submitted_at ?? b.decided_at ?? '').localeCompare(a.submitted_at ?? a.decided_at ?? ''),
      )
  })
}

export function getUpdates(opts: { projectId?: string } = {}): Promise<UpdateWithMeta[]> {
  return respond(() => {
    const db = getDb()
    const me = viewer()
    const ids = visibleProjectIds()
    return db.updates
      .filter((u) => ids.has(u.project_id) && (!opts.projectId || u.project_id === opts.projectId))
      .map((u) => {
        const project = db.projects.find((p) => p.id === u.project_id)!
        return {
          ...u,
          author: profileById(u.author_id),
          project_name: project.name,
          project_slug: project.slug,
          comment_count: db.comments.filter(
            (c) => c.target_type === 'update' && c.target_id === u.id && c.deleted_at === null,
          ).length,
          is_new: u.author_id !== me.id && u.published_at > seenAt(me.id, u.project_id),
        }
      })
      .sort((a, b) => b.published_at.localeCompare(a.published_at))
  })
}

export function getChangeRequests(
  opts: { projectId?: string } = {},
): Promise<ChangeRequestWithMeta[]> {
  return respond(() => {
    const db = getDb()
    const ids = visibleProjectIds()
    return db.changeRequests
      .filter((c) => ids.has(c.project_id) && (!opts.projectId || c.project_id === opts.projectId))
      .map((c) => {
        const project = db.projects.find((p) => p.id === c.project_id)!
        return {
          ...c,
          requester: profileById(c.requested_by),
          project_name: project.name,
          project_slug: project.slug,
          comment_count: db.comments.filter(
            (x) =>
              x.target_type === 'change_request' && x.target_id === c.id && x.deleted_at === null,
          ).length,
        }
      })
      .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
  })
}

export function getComments(
  target_type: CommentTarget,
  target_id: string,
): Promise<CommentWithAuthor[]> {
  return respond(() => {
    const ids = visibleProjectIds()
    return getDb()
      .comments.filter(
        (c) =>
          ids.has(c.project_id) &&
          c.target_type === target_type &&
          c.target_id === target_id &&
          c.deleted_at === null,
      )
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .map((c) => ({ ...c, author: profileById(c.author_id) }))
  })
}

export function getActivity(projectId: string): Promise<ActivityWithActor[]> {
  return respond(() => {
    if (!visibleProjectIds().has(projectId) || !can(viewer().role, 'activity.view')) return []
    const db = getDb()
    const project = db.projects.find((p) => p.id === projectId)!
    return db.activity
      .filter((e) => e.project_id === projectId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .map((e) => ({ ...e, actor: profileById(e.actor_id), project_name: project.name }))
  })
}

export function getDashboardKpis(): Promise<DashboardKpis> {
  return respond(() => {
    const db = getDb()
    const projects = visibleProjects()
    const ids = new Set(projects.map((p) => p.id))
    const today = startOfDay(new Date())
    const horizon = addDays(today, 14)

    return {
      active_projects: projects.filter((p) =>
        ['planeacion', 'en_progreso', 'en_revision'].includes(p.status),
      ).length,
      upcoming_deliveries: db.milestones.filter((m) => {
        if (!ids.has(m.project_id) || m.status === 'completado') return false
        const due = new Date(`${m.due_date}T00:00:00`)
        return !isBefore(due, today) && !isAfter(due, horizon)
      }).length,
      pending_approvals: db.deliverables.filter(
        (d) => ids.has(d.project_id) && d.status === 'en_revision',
      ).length,
      open_change_requests: db.changeRequests.filter(
        (c) => ids.has(c.project_id) && c.status !== 'rechazada' && c.status !== 'completada',
      ).length,
    }
  })
}

// ---------- Mutaciones ----------

function requireVisibleProject(projectId: string): Project {
  const p = visibleProjects().find((x) => x.id === projectId)
  if (!p) throw new DomainError('No tienes acceso a este proyecto.')
  return p
}

export function reviewDeliverable(input: ReviewDeliverableInput): Promise<void> {
  return respond(() => {
    const db = getDb()
    const me = viewer()
    const dl = db.deliverables.find((d) => d.id === input.deliverable_id)
    if (!dl) throw new DomainError('El entregable no existe.')
    requireVisibleProject(dl.project_id)
    if (!can(me.role, 'deliverable.review', { deliverableStatus: dl.status })) {
      throw new DomainError(
        dl.status !== 'en_revision'
          ? 'Solo se pueden revisar entregables que están en revisión.'
          : 'Tu rol no puede aprobar ni rechazar entregables.',
      )
    }
    const comment = input.comment.trim()
    if (input.decision !== 'aprobado' && comment.length < 3) {
      throw new DomainError('Agrega un comentario para rechazar o pedir cambios.')
    }
    const now = new Date().toISOString()
    dl.status = input.decision
    dl.decided_at = now
    db.reviews.push({
      id: `rv-${crypto.randomUUID()}`,
      deliverable_id: dl.id,
      reviewer_id: me.id,
      decision: input.decision,
      comment,
      created_at: now,
    })
    const action: ActivityAction =
      input.decision === 'aprobado'
        ? 'entregable_aprobado'
        : input.decision === 'rechazado'
          ? 'entregable_rechazado'
          : 'entregable_cambios_solicitados'
    logActivity(dl.project_id, action, 'deliverable', dl.id, dl.title)
  })
}

/** Dev: envía un borrador (o uno con cambios/rechazado) a revisión. */
export function submitDeliverable(deliverableId: string): Promise<void> {
  return respond(() => {
    const db = getDb()
    const dl = db.deliverables.find((d) => d.id === deliverableId)
    if (!dl) throw new DomainError('El entregable no existe.')
    if (!can(viewer().role, 'deliverable.submit', { deliverableStatus: dl.status })) {
      throw new DomainError('Este entregable no se puede enviar a revisión.')
    }
    if (dl.status === 'en_revision') throw new DomainError('El entregable ya está en revisión.')
    dl.status = 'en_revision'
    dl.submitted_at = new Date().toISOString()
    dl.decided_at = null
    logActivity(dl.project_id, 'entregable_enviado', 'deliverable', dl.id, dl.title)
  })
}

export function addComment(input: AddCommentInput): Promise<void> {
  return respond(() => {
    const me = viewer()
    if (!can(me.role, 'comment.create')) throw new DomainError('No puedes comentar.')
    requireVisibleProject(input.project_id)
    const body = input.body.trim()
    if (body.length === 0) throw new DomainError('Escribe un comentario.')
    getDb().comments.push({
      id: `cm-${crypto.randomUUID()}`,
      project_id: input.project_id,
      target_type: input.target_type,
      target_id: input.target_id,
      parent_id: input.parent_id ?? null,
      author_id: me.id,
      body,
      created_at: new Date().toISOString(),
      edited_at: null,
      deleted_at: null,
    })
    logActivity(
      input.project_id,
      'comentario_creado',
      'comment',
      input.target_id,
      body.slice(0, 80),
    )
  })
}

export function createChangeRequest(input: CreateChangeRequestInput): Promise<ChangeRequest> {
  return respond(() => {
    const me = viewer()
    if (!can(me.role, 'change_request.create')) {
      throw new DomainError('Solo el despacho puede crear solicitudes de cambio.')
    }
    requireVisibleProject(input.project_id)
    const now = new Date().toISOString()
    const cr: ChangeRequest = {
      id: `cr-${crypto.randomUUID()}`,
      project_id: input.project_id,
      requested_by: me.id,
      title: input.title.trim(),
      description: input.description.trim(),
      priority: input.priority,
      status: 'nueva',
      impact_note: null,
      resolved_at: null,
      created_at: now,
      updated_at: now,
    }
    getDb().changeRequests.push(cr)
    logActivity(cr.project_id, 'solicitud_creada', 'change_request', cr.id, cr.title)
    return cr
  })
}

export function setChangeRequestStatus(input: SetChangeRequestStatusInput): Promise<void> {
  return respond(() => {
    if (!can(viewer().role, 'change_request.set_status')) {
      throw new DomainError('Solo el desarrollador puede cambiar el estatus de una solicitud.')
    }
    const cr = getDb().changeRequests.find((c) => c.id === input.id)
    if (!cr) throw new DomainError('La solicitud no existe.')
    const now = new Date().toISOString()
    cr.status = input.status
    if (input.impact_note !== undefined) cr.impact_note = input.impact_note?.trim() || null
    cr.resolved_at = input.status === 'rechazada' || input.status === 'completada' ? now : null
    cr.updated_at = now
    logActivity(cr.project_id, 'solicitud_estatus', 'change_request', cr.id, cr.title, {
      status: input.status,
    })
  })
}

export function setProjectPriority(projectId: string, priority: PriorityLevel): Promise<void> {
  return respond(() => {
    if (!can(viewer().role, 'priority.set'))
      throw new DomainError('No puedes cambiar la prioridad.')
    const p = requireVisibleProject(projectId)
    p.priority = priority
    p.updated_at = new Date().toISOString()
    logActivity(p.id, 'prioridad_cambiada', 'project', p.id, p.name, { priority })
  })
}

export function updateTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
  return respond(() => {
    if (!can(viewer().role, 'task.edit'))
      throw new DomainError('Solo el desarrollador puede editar tareas.')
    const task = getDb().tasks.find((t) => t.id === taskId)
    if (!task) throw new DomainError('La tarea no existe.')
    task.status = status
    task.updated_at = new Date().toISOString()
  })
}

/** Equivale a escribir en `read_receipts`: marca el proyecto como visto. */
export function markProjectRead(projectId: string): Promise<void> {
  return respond(() => {
    const db = getDb()
    const me = viewer()
    ;(db.readAt[me.id] ??= {})[projectId] = new Date().toISOString()
  })
}
