import { Plus } from 'lucide-react'
import { useState } from 'react'
import { RoleGate } from '@/components/shared/RoleGate'
import { Button } from '@/components/ui/button'
import { ChangeRequestDialog } from '@/features/change-requests/ChangeRequestForm'
import { ChangeRequestList } from '@/features/change-requests/ChangeRequestList'

export function ChangeRequestsTab({ projectId }: { projectId: string }) {
  const [creating, setCreating] = useState(false)
  return (
    <div className="max-w-3xl space-y-4">
      <RoleGate action="change_request.create">
        <div className="flex justify-end">
          <Button onClick={() => setCreating(true)}>
            <Plus aria-hidden className="mr-1.5 h-4 w-4" strokeWidth={1.5} />
            Nueva solicitud
          </Button>
        </div>
        <ChangeRequestDialog
          open={creating}
          onOpenChange={setCreating}
          fixedProjectId={projectId}
        />
      </RoleGate>
      <ChangeRequestList projectId={projectId} />
    </div>
  )
}
