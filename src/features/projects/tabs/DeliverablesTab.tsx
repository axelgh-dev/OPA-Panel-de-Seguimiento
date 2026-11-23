import { PackageOpen } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import { DeliverableCard } from '@/features/deliverables/DeliverableCard'
import { useDeliverables } from '@/features/deliverables/hooks'
import { useMilestones } from '../hooks'

export function DeliverablesTab({ projectId }: { projectId: string }) {
  const q = useDeliverables(projectId)
  const milestones = useMilestones(projectId)
  if (q.isError) return <ErrorState onRetry={() => void q.refetch()} />
  if (q.isLoading) {
    return (
      <div className="space-y-4" aria-hidden>
        {[0, 1].map((i) => (
          <Skeleton key={i} className="h-48 w-full rounded-xl" />
        ))}
      </div>
    )
  }
  if ((q.data ?? []).length === 0) {
    return (
      <EmptyState
        icon={PackageOpen}
        title="Aún no hay entregables en este proyecto"
        description="Cuando Axel envíe uno a revisión, podrás aprobarlo desde aquí."
      />
    )
  }
  const nameOf = (id: string | null) => milestones.data?.find((m) => m.id === id)?.name
  return (
    <div className="max-w-3xl space-y-4">
      {q.data!.map((d) => (
        <DeliverableCard key={d.id} deliverable={d} milestoneName={nameOf(d.milestone_id)} />
      ))}
    </div>
  )
}
