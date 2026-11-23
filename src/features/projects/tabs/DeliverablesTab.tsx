import { PackageOpen, Plus } from 'lucide-react'
import { useState } from 'react'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { RoleGate } from '@/components/shared/RoleGate'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { DeliverableDialog } from '@/features/manage/DeliverableDialog'
import { DeliverableCard } from '@/features/deliverables/DeliverableCard'
import { useDeliverables } from '@/features/deliverables/hooks'
import { useMilestones } from '../hooks'

export function DeliverablesTab({ projectId }: { projectId: string }) {
  const q = useDeliverables(projectId)
  const [creating, setCreating] = useState(false)
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
  const nameOf = (id: string | null) => milestones.data?.find((m) => m.id === id)?.name
  const newButton = (
    <RoleGate action="project.edit">
      <Button onClick={() => setCreating(true)}>
        <Plus aria-hidden className="mr-1.5 h-4 w-4" strokeWidth={1.5} />
        Nuevo entregable
      </Button>
      {creating && (
        <DeliverableDialog
          open
          onOpenChange={setCreating}
          projectId={projectId}
          milestones={milestones.data ?? []}
        />
      )}
    </RoleGate>
  )
  if ((q.data ?? []).length === 0) {
    return (
      <EmptyState
        icon={PackageOpen}
        title="Aún no hay entregables en este proyecto"
        description="Cuando Axel envíe uno a revisión, podrás aprobarlo desde aquí."
        action={newButton}
      />
    )
  }
  return (
    <div className="max-w-3xl space-y-4">
      <div className="flex justify-end">{newButton}</div>
      {q.data!.map((d) => (
        <DeliverableCard
          key={d.id}
          deliverable={d}
          milestoneName={nameOf(d.milestone_id)}
          milestones={milestones.data ?? []}
        />
      ))}
    </div>
  )
}
