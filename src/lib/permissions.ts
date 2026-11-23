import type { Comment, DeliverableStatus, UserRole } from '@/data/types'

/**
 * Matriz de permisos de docs/REQUERIMIENTOS.md §3.1.
 * Única fuente de verdad en la UI; en fase 2 la misma regla vive en RLS/RPC.
 */
export type Action =
  | 'project.view_draft'
  | 'project.edit'
  | 'task.view_internal'
  | 'task.edit'
  | 'update.publish'
  | 'deliverable.submit'
  | 'deliverable.review'
  | 'comment.create'
  | 'comment.edit_own'
  | 'change_request.create'
  | 'change_request.set_status'
  | 'priority.set'
  | 'user.manage'
  | 'activity.view'

const MATRIX: Record<Action, readonly UserRole[]> = {
  'project.view_draft': ['dev'],
  'project.edit': ['dev'],
  'task.view_internal': ['dev'],
  'task.edit': ['dev'],
  'update.publish': ['dev'],
  'deliverable.submit': ['dev'],
  // El desarrollador no aprueba sus propios entregables (§3.1, nota 1).
  'deliverable.review': ['opa'],
  'comment.create': ['dev', 'opa'],
  'comment.edit_own': ['dev', 'opa'],
  'change_request.create': ['opa'],
  'change_request.set_status': ['dev'],
  'priority.set': ['dev', 'opa'],
  'user.manage': ['dev'],
  'activity.view': ['dev', 'opa'],
}

export interface PermissionEntity {
  /** Estatus del entregable sobre el que se actúa. */
  deliverableStatus?: DeliverableStatus
}

export function can(role: UserRole, action: Action, entity?: PermissionEntity): boolean {
  if (!MATRIX[action].includes(role)) return false
  // Solo se revisa un entregable que está en revisión.
  if (action === 'deliverable.review' && entity?.deliverableStatus !== undefined) {
    return entity.deliverableStatus === 'en_revision'
  }
  // Un entregable aprobado es inmutable: no se vuelve a enviar (§4.4).
  if (action === 'deliverable.submit' && entity?.deliverableStatus === 'aprobado') {
    return false
  }
  return true
}

/** Ventana para editar o borrar un comentario propio (§3.1). */
export const COMMENT_EDIT_WINDOW_MS = 15 * 60 * 1000

export function isWithinCommentWindow(createdAt: string, now: Date = new Date()): boolean {
  return now.getTime() - new Date(createdAt).getTime() <= COMMENT_EDIT_WINDOW_MS
}

/** Solo el autor puede editar o borrar su comentario, y solo durante los primeros 15 minutos. */
export function canModifyComment(
  role: UserRole,
  userId: string,
  comment: Pick<Comment, 'author_id' | 'created_at' | 'deleted_at'>,
  now: Date = new Date(),
): boolean {
  return (
    can(role, 'comment.edit_own') &&
    comment.author_id === userId &&
    comment.deleted_at === null &&
    isWithinCommentWindow(comment.created_at, now)
  )
}
