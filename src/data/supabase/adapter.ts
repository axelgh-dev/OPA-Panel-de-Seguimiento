/**
 * Adaptador real sobre Supabase (`VITE_DATA_MODE=supabase`). Misma API que el mock.
 * La seguridad vive en la base de datos (RLS, triggers y RPC); aquí solo se consulta y se traducen errores.
 */
import { addDays, format, startOfDay } from 'date-fns'
import type { DataAdapter } from '../adapter'
import { DomainError } from '../errors'
import { filterAndSortProjects, milestoneFocus } from '../shared'
import type {
  ActivityAction,
  ActivityEvent,
  ActivityWithActor,
  ChangeRequest,
  ChangeRequestWithMeta,
  CommentWithAuthor,
  DashboardKpis,
  DeliverableWithReviews,
  Deliverable,
  DeliverableInput,
  Milestone,
  MilestoneInput,
  Profile,
  ProfileUpdate,
  ProjectInput,
  ProjectUpdate,
  TaskInput,
  UpdateInput,
  Project,
  ProjectOverview,
  Task,
  UpdateWithMeta,
} from '../types'
import { supabase } from './client'
import { unwrap } from './errors'

/** Columnas de `profiles` que expone el dominio (sin `notify_prefs`). */
const PROFILE_COLS = 'id, full_name, email, role, job_title, avatar_url, is_active, created_at'

/** Límite de archivos de entregables (el bucket también lo exige). */
const MAX_FILE_BYTES = 20 * 1024 * 1024

/** Autor de eventos generados sin sesión (p. ej. desde el SQL Editor). */
const SYSTEM_PROFILE: Profile = {
  id: '00000000-0000-0000-0000-000000000000',
  full_name: 'Sistema',
  email: '',
  role: 'dev',
  job_title: 'Sistema',
  avatar_url: null,
  is_active: true,
  created_at: '1970-01-01T00:00:00Z',
}

async function myId(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  const id = data.session?.user.id
  if (!id) throw new DomainError('Tu sesión expiró. Vuelve a iniciar sesión.')
  return id
}

/** Un UPDATE que RLS filtra no da error: devuelve 0 filas. Lo convertimos en un mensaje claro. */
function expectRows<T>(rows: T[] | null, message: string): T[] {
  if (!rows || rows.length === 0) throw new DomainError(message)
  return rows
}

// ---------- Proyectos ----------

type OverviewRow = Project & {
  progress: number | null
  pending_deliverables: number | null
  open_change_requests: number | null
  unread_comments: number | null
  last_activity_at: string | null
}

function toOverview(row: OverviewRow, milestones: Milestone[]): ProjectOverview {
  const {
    progress,
    pending_deliverables,
    open_change_requests,
    unread_comments,
    last_activity_at,
    ...project
  } = row
  const ms = milestones
    .filter((m) => m.project_id === row.id)
    .sort((a, b) => a.position - b.position)
  return {
    ...project,
    segments: ms.map(({ id, name, weight, status }) => ({ id, name, weight, status })),
    progress: progress ?? 0,
    ...milestoneFocus(ms),
    alerts: {
      pending_deliverables: pending_deliverables ?? 0,
      open_change_requests: open_change_requests ?? 0,
      unread_comments: unread_comments ?? 0,
    },
    last_activity_at: last_activity_at ?? project.updated_at,
  }
}

/** Todos los proyectos visibles con sus hitos (2 consultas, sin importar cuántos proyectos haya). */
async function loadOverviews(): Promise<{ overviews: ProjectOverview[]; milestones: Milestone[] }> {
  const [rows, milestones] = await Promise.all([
    unwrap(supabase.from('project_overview').select('*')),
    unwrap(supabase.from('milestones').select('*').order('position')),
  ])
  const ms = milestones as Milestone[]
  return { overviews: (rows as OverviewRow[]).map((r) => toOverview(r, ms)), milestones: ms }
}

/**
 * Fecha de "visto por última vez" por proyecto del usuario actual (para "nuevo" y sin leer).
 * Sin marca de lectura, vale la fecha de alta del usuario: al primer login no ve todo como nuevo.
 */
async function readAtByProject(): Promise<{ readAt: Map<string, string>; fallback: string }> {
  const [rows, me] = await Promise.all([
    unwrap(
      supabase.from('read_receipts').select('target_id, read_at').eq('target_type', 'project'),
    ),
    myId(),
  ])
  const profile = (await unwrap(
    supabase.from('profiles').select('created_at').eq('id', me).maybeSingle(),
  )) as { created_at: string } | null
  return {
    readAt: new Map(rows.map((r) => [r.target_id, r.read_at])),
    fallback: profile?.created_at ?? '',
  }
}

async function countComments(
  targetType: 'update' | 'change_request',
  ids: string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>()
  if (ids.length === 0) return counts
  const rows = await unwrap(
    supabase
      .from('comments')
      .select('target_id')
      .eq('target_type', targetType)
      .is('deleted_at', null)
      .in('target_id', ids),
  )
  for (const r of rows) counts.set(r.target_id, (counts.get(r.target_id) ?? 0) + 1)
  return counts
}

export const adapter: DataAdapter = {
  async getProfiles() {
    return (await unwrap(
      supabase.from('profiles').select(PROFILE_COLS).order('full_name'),
    )) as Profile[]
  },

  async getProjects(filters = {}) {
    const { overviews } = await loadOverviews()
    return filterAndSortProjects(overviews, filters)
  },

  async getProject(slug) {
    const row = (await unwrap(
      supabase.from('project_overview').select('*').eq('slug', slug).maybeSingle(),
    )) as OverviewRow | null
    if (!row) return null
    const milestones = await unwrap(
      supabase.from('milestones').select('*').eq('project_id', row.id).order('position'),
    )
    return toOverview(row, milestones as Milestone[])
  },

  async getMilestones(projectId) {
    return (await unwrap(
      supabase.from('milestones').select('*').eq('project_id', projectId).order('position'),
    )) as Milestone[]
  },

  async getTasks(projectId) {
    // RLS ya oculta las tareas internas a OPA.
    return (await unwrap(
      supabase.from('tasks').select('*').eq('project_id', projectId).order('position'),
    )) as Task[]
  },

  async getDeliverables(projectId) {
    const rows = await unwrap(
      supabase
        .from('deliverables')
        .select(
          `*, creator:profiles!deliverables_created_by_fkey(${PROFILE_COLS}),
           reviews:deliverable_reviews(*, reviewer:profiles!deliverable_reviews_reviewer_id_fkey(${PROFILE_COLS}))`,
        )
        .eq('project_id', projectId),
    )
    return (rows as unknown as DeliverableWithReviews[])
      .map((d) => ({
        ...d,
        reviews: [...d.reviews].sort((a, b) => b.created_at.localeCompare(a.created_at)),
      }))
      .sort((a, b) =>
        (b.submitted_at ?? b.decided_at ?? '').localeCompare(a.submitted_at ?? a.decided_at ?? ''),
      )
  },

  async getUpdates(opts = {}) {
    let query = supabase
      .from('project_updates')
      .select(
        `*, author:profiles!project_updates_author_id_fkey(${PROFILE_COLS}), project:projects!inner(name, slug)`,
      )
      .order('published_at', { ascending: false })
    if (opts.projectId) query = query.eq('project_id', opts.projectId)
    const [rows, me, { readAt, fallback }] = await Promise.all([
      unwrap(query),
      myId(),
      readAtByProject(),
    ])
    const counts = await countComments(
      'update',
      rows.map((r) => r.id),
    )
    return rows.map((r): UpdateWithMeta => {
      const { project, ...update } = r as unknown as UpdateWithMeta & {
        project: { name: string; slug: string }
      }
      return {
        ...update,
        project_name: project.name,
        project_slug: project.slug,
        comment_count: counts.get(r.id) ?? 0,
        is_new: r.author_id !== me && r.published_at > (readAt.get(r.project_id) ?? fallback),
      }
    })
  },

  async getChangeRequests(opts = {}) {
    let query = supabase
      .from('change_requests')
      .select(
        `*, requester:profiles!change_requests_requested_by_fkey(${PROFILE_COLS}), project:projects!inner(name, slug)`,
      )
      .order('created_at', { ascending: false })
    if (opts.projectId) query = query.eq('project_id', opts.projectId)
    const rows = await unwrap(query)
    const counts = await countComments(
      'change_request',
      rows.map((r) => r.id),
    )
    return rows.map((r): ChangeRequestWithMeta => {
      const { project, ...cr } = r as unknown as ChangeRequestWithMeta & {
        project: { name: string; slug: string }
      }
      return {
        ...cr,
        project_name: project.name,
        project_slug: project.slug,
        comment_count: counts.get(r.id) ?? 0,
      }
    })
  },

  async getComments(target_type, target_id) {
    const rows = (await unwrap(
      supabase
        .from('comments')
        .select(`*, author:profiles!comments_author_id_fkey(${PROFILE_COLS})`)
        .eq('target_type', target_type)
        .eq('target_id', target_id)
        .order('created_at'),
    )) as unknown as CommentWithAuthor[]
    // Un comentario borrado que tiene respuestas se conserva (sin texto) para no dejarlas huérfanas.
    const hasReplies = new Set(rows.filter((c) => c.deleted_at === null).map((c) => c.parent_id))
    return rows
      .filter((c) => c.deleted_at === null || hasReplies.has(c.id))
      .map((c) => ({ ...c, body: c.deleted_at === null ? c.body : '' }))
  },

  async getActivity(projectId) {
    const rows = await unwrap(
      supabase
        .from('activity_log')
        .select(
          `*, actor:profiles!activity_log_actor_id_fkey(${PROFILE_COLS}), project:projects(name)`,
        )
        .eq('project_id', projectId)
        .order('created_at', { ascending: false }),
    )
    return rows.map((r): ActivityWithActor => {
      const { label, ...meta } = (r.meta ?? {}) as Record<string, string | number | null>
      return {
        id: r.id,
        project_id: r.project_id,
        actor_id: r.actor_id ?? SYSTEM_PROFILE.id,
        action: r.action as ActivityAction,
        entity_type: r.entity_type as ActivityEvent['entity_type'],
        entity_id: r.entity_id ?? '',
        entity_label: typeof label === 'string' ? label : '',
        meta,
        created_at: r.created_at,
        actor: (r.actor as unknown as Profile | null) ?? SYSTEM_PROFILE,
        project_name: (r.project as { name: string } | null)?.name ?? '',
      }
    })
  },

  async getDashboardKpis(): Promise<DashboardKpis> {
    const { overviews, milestones } = await loadOverviews()
    const ids = new Set(overviews.map((p) => p.id))
    const today = format(startOfDay(new Date()), 'yyyy-MM-dd')
    const horizon = format(addDays(startOfDay(new Date()), 14), 'yyyy-MM-dd')
    return {
      active_projects: overviews.filter((p) =>
        ['planeacion', 'en_progreso', 'en_revision'].includes(p.status),
      ).length,
      upcoming_deliveries: milestones.filter(
        (m) =>
          ids.has(m.project_id) &&
          m.status !== 'completado' &&
          m.due_date >= today &&
          m.due_date <= horizon,
      ).length,
      pending_approvals: overviews.reduce((n, p) => n + p.alerts.pending_deliverables, 0),
      open_change_requests: overviews.reduce((n, p) => n + p.alerts.open_change_requests, 0),
    }
  },

  // ---------- Mutaciones ----------

  async reviewDeliverable(input) {
    await unwrap(
      supabase.rpc('review_deliverable', {
        p_deliverable_id: input.deliverable_id,
        p_decision: input.decision,
        p_comment: input.comment,
      }),
    )
  },

  async submitDeliverable(deliverableId) {
    await unwrap(supabase.rpc('submit_deliverable', { p_deliverable_id: deliverableId }))
  },

  async addComment(input) {
    const body = input.body.trim()
    if (body.length === 0) throw new DomainError('Escribe un comentario.')
    await unwrap(
      supabase.from('comments').insert({
        project_id: input.project_id,
        target_type: input.target_type,
        target_id: input.target_id,
        parent_id: input.parent_id ?? null,
        body,
        author_id: await myId(),
      }),
    )
  },

  async editComment(input) {
    const body = input.body.trim()
    if (body.length === 0) throw new DomainError('Escribe un comentario.')
    const rows = await unwrap(
      supabase.from('comments').update({ body }).eq('id', input.id).select('id'),
    )
    expectRows(rows, 'Solo puedes modificar tus propios comentarios.')
  },

  /** Borrado lógico (`deleted_at`), igual que en el mock. */
  async deleteComment(id) {
    const rows = await unwrap(
      supabase
        .from('comments')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id)
        .select('id'),
    )
    expectRows(rows, 'Solo puedes modificar tus propios comentarios.')
  },

  async createChangeRequest(input): Promise<ChangeRequest> {
    return (await unwrap(
      supabase
        .from('change_requests')
        .insert({
          project_id: input.project_id,
          requested_by: await myId(),
          title: input.title.trim(),
          description: input.description.trim(),
          priority: input.priority,
        })
        .select()
        .single(),
    )) as ChangeRequest
  },

  async setChangeRequestStatus(input) {
    await unwrap(
      supabase.rpc('set_change_request_status', {
        p_id: input.id,
        p_status: input.status,
        p_impact_note: input.impact_note ?? undefined,
        p_update_note: input.impact_note !== undefined,
      }),
    )
  },

  async setProjectPriority(projectId, priority) {
    await unwrap(
      supabase.rpc('set_project_priority', { p_project_id: projectId, p_priority: priority }),
    )
  },

  async updateTaskStatus(taskId, status) {
    const rows = await unwrap(
      supabase.from('tasks').update({ status }).eq('id', taskId).select('id'),
    )
    expectRows(rows, 'Solo el desarrollador puede editar tareas.')
  },

  // ---------- Captura (solo dev: RLS rechaza a cualquier otro rol) ----------

  async createProject(input: ProjectInput) {
    return (await unwrap(supabase.from('projects').insert(input).select().single())) as Project
  },

  async updateProject(id: string, patch: Partial<ProjectInput>) {
    const rows = await unwrap(supabase.from('projects').update(patch).eq('id', id).select('id'))
    expectRows(rows, 'No se pudo guardar: el proyecto no existe o no tienes permiso.')
  },

  async deleteProject(id: string) {
    const rows = await unwrap(supabase.from('projects').delete().eq('id', id).select('id'))
    expectRows(rows, 'No se pudo eliminar: el proyecto no existe o no tienes permiso.')
  },

  async createMilestone(input: MilestoneInput) {
    const last = await unwrap(
      supabase
        .from('milestones')
        .select('position')
        .eq('project_id', input.project_id)
        .order('position', { ascending: false })
        .limit(1),
    )
    return (await unwrap(
      supabase
        .from('milestones')
        .insert({ ...input, position: (last[0]?.position ?? -1) + 1 })
        .select()
        .single(),
    )) as Milestone
  },

  async updateMilestone(id: string, patch: Partial<Omit<MilestoneInput, 'project_id'>>) {
    const rows = await unwrap(supabase.from('milestones').update(patch).eq('id', id).select('id'))
    expectRows(rows, 'No se pudo guardar: el hito no existe o no tienes permiso.')
  },

  async deleteMilestone(id: string) {
    const rows = await unwrap(supabase.from('milestones').delete().eq('id', id).select('id'))
    expectRows(rows, 'No se pudo eliminar: el hito no existe o no tienes permiso.')
  },

  async reorderMilestones(projectId: string, orderedIds: string[]) {
    await Promise.all(
      orderedIds.map((id, position) =>
        unwrap(
          supabase.from('milestones').update({ position }).eq('id', id).eq('project_id', projectId),
        ),
      ),
    )
  },

  async createTask(input: TaskInput) {
    const last = await unwrap(
      supabase
        .from('tasks')
        .select('position')
        .eq('project_id', input.project_id)
        .order('position', { ascending: false })
        .limit(1),
    )
    return (await unwrap(
      supabase
        .from('tasks')
        .insert({ ...input, position: (last[0]?.position ?? -1) + 1 })
        .select()
        .single(),
    )) as Task
  },

  async updateTask(id: string, patch: Partial<Omit<TaskInput, 'project_id'>>) {
    const rows = await unwrap(supabase.from('tasks').update(patch).eq('id', id).select('id'))
    expectRows(rows, 'No se pudo guardar: la tarea no existe o no tienes permiso.')
  },

  async deleteTask(id: string) {
    const rows = await unwrap(supabase.from('tasks').delete().eq('id', id).select('id'))
    expectRows(rows, 'No se pudo eliminar: la tarea no existe o no tienes permiso.')
  },

  async createDeliverable(input: DeliverableInput) {
    return (await unwrap(
      supabase
        .from('deliverables')
        .insert({ ...input, created_by: await myId() })
        .select()
        .single(),
    )) as Deliverable
  },

  async updateDeliverable(id: string, patch: Partial<Omit<DeliverableInput, 'project_id'>>) {
    const rows = await unwrap(supabase.from('deliverables').update(patch).eq('id', id).select('id'))
    expectRows(rows, 'No se pudo guardar: el entregable no existe o ya está aprobado.')
  },

  async deleteDeliverable(id: string) {
    const rows = await unwrap(
      supabase.from('deliverables').delete().eq('id', id).select('id, storage_path'),
    )
    const [removed] = expectRows(rows, 'Solo se pueden eliminar entregables en borrador.')
    // El archivo huérfano se limpia sin bloquear la operación.
    if (removed.storage_path)
      void supabase.storage.from('deliverables').remove([removed.storage_path])
  },

  async uploadDeliverableFile(deliverableId: string, file: File) {
    if (file.size > MAX_FILE_BYTES) {
      throw new DomainError(
        'El archivo pesa más de 20 MB. Súbelo a Drive o similar y pega el enlace.',
      )
    }
    const current = (await unwrap(
      supabase
        .from('deliverables')
        .select('project_id, storage_path, status')
        .eq('id', deliverableId)
        .maybeSingle(),
    )) as { project_id: string; storage_path: string | null; status: string } | null
    if (!current) throw new DomainError('El entregable no existe.')
    if (current.status === 'aprobado') {
      throw new DomainError('Un entregable aprobado no se puede modificar.')
    }
    const safeName = file.name.replace(/[^\w.-]+/g, '_').slice(-120)
    const path = `${current.project_id}/${deliverableId}/${safeName}`
    const { error } = await supabase.storage
      .from('deliverables')
      .upload(path, file, { upsert: true, contentType: file.type || undefined })
    if (error) throw new DomainError('No pudimos subir el archivo. Intenta de nuevo.')
    await unwrap(
      supabase.from('deliverables').update({ storage_path: path }).eq('id', deliverableId),
    )
    if (current.storage_path && current.storage_path !== path) {
      void supabase.storage.from('deliverables').remove([current.storage_path])
    }
  },

  async getDeliverableFileUrl(storagePath: string) {
    const { data, error } = await supabase.storage
      .from('deliverables')
      .createSignedUrl(storagePath, 600)
    if (error) throw new DomainError('No pudimos abrir el archivo. Intenta de nuevo.')
    return data.signedUrl
  },

  async createUpdate(input: UpdateInput) {
    return (await unwrap(
      supabase
        .from('project_updates')
        .insert({ ...input, author_id: await myId() })
        .select()
        .single(),
    )) as ProjectUpdate
  },

  async updateUpdate(id: string, patch: Partial<Omit<UpdateInput, 'project_id'>>) {
    const rows = await unwrap(
      supabase.from('project_updates').update(patch).eq('id', id).select('id'),
    )
    expectRows(rows, 'No se pudo guardar: la entrada no existe o no tienes permiso.')
  },

  async deleteUpdate(id: string) {
    const rows = await unwrap(supabase.from('project_updates').delete().eq('id', id).select('id'))
    expectRows(rows, 'No se pudo eliminar: la entrada no existe o no tienes permiso.')
  },

  async updateProfile(id: string, patch: ProfileUpdate) {
    const rows = await unwrap(supabase.from('profiles').update(patch).eq('id', id).select('id'))
    expectRows(rows, 'No se pudo guardar: el usuario no existe o no tienes permiso.')
  },

  /** Marca el proyecto como visto (`read_receipts`). */
  async markProjectRead(projectId) {
    await unwrap(
      supabase.from('read_receipts').upsert(
        {
          user_id: await myId(),
          target_type: 'project',
          target_id: projectId,
          read_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,target_type,target_id' },
      ),
    )
  },
}
