import type { ReactNode } from 'react'
import { can, type Action, type PermissionEntity } from '@/lib/permissions'
import { useSession } from '@/lib/session'

/** Muestra a sus hijos solo si el rol actual tiene el permiso (matriz §3.1). */
export function RoleGate({
  action,
  entity,
  children,
  fallback = null,
}: {
  action: Action
  entity?: PermissionEntity
  children: ReactNode
  fallback?: ReactNode
}) {
  const { user } = useSession()
  return <>{can(user.role, action, entity) ? children : fallback}</>
}
