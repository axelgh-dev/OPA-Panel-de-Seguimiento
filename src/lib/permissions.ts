import type { DeliverableStatus, UserRole } from '@/data/types'

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
