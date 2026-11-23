import { GitPullRequestArrow } from 'lucide-react'
import type { ChangeReqStatus } from '@/data'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { ChangeRequestCard } from './ChangeRequestCard'
import { useChangeRequests } from './hooks'

export function ChangeRequestList({
  projectId,
  showProject,
  status = 'todas',
}: {
  projectId?: string
  showProject?: boolean
  status?: ChangeReqStatus | 'todas'
}) {
  const q = useChangeRequests(projectId)
  if (q.isError) return <ErrorState onRetry={() => void q.refetch()} />
  if (q.isLoading) {
    return (
      <div className="space-y-4" aria-hidden>
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-36 w-full rounded-xl" />
        ))}
      </div>
    )
  }
  const items = (q.data ?? []).filter((r) => status === 'todas' || r.status === status)
  if (items.length === 0) {
    return (
      <EmptyState
        icon={GitPullRequestArrow}
        title={
          status === 'todas'
            ? 'Aún no hay solicitudes de cambio'
            : 'No hay solicitudes con ese estatus'
        }
        description="Cuando el despacho pida un cambio de alcance, aparecerá aquí con su estimación de impacto."
      />
    )
  }
  return (
    <div className="space-y-4">
      {items.map((r) => (
        <ChangeRequestCard key={r.id} request={r} showProject={showProject} />
      ))}
    </div>
  )
}
