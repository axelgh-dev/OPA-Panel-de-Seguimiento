import { BookOpen } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { UpdateCard, UpdateListSkeleton } from './UpdateCard'
import { useUpdates } from './hooks'

export function UpdateList({
  projectId,
  showProject,
}: {
  projectId?: string
  showProject?: boolean
}) {
  const q = useUpdates(projectId)
  if (q.isError) return <ErrorState onRetry={() => void q.refetch()} />
  if (q.isLoading) return <UpdateListSkeleton />
  if (!q.data || q.data.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title="Aún no hay entradas en la bitácora"
        description="Axel publicará aquí cada avance, entrega o bloqueo del proyecto."
      />
    )
  }
  return (
    <div className="space-y-4">
      {q.data.map((u) => (
        <UpdateCard key={u.id} update={u} showProject={showProject} />
      ))}
    </div>
  )
}
