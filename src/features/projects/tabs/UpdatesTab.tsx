import { Plus } from 'lucide-react'
import { useState } from 'react'
import { RoleGate } from '@/components/shared/RoleGate'
import { Button } from '@/components/ui/button'
import { UpdateDialog } from '@/features/manage/UpdateDialog'
import { UpdateList } from '@/features/updates/UpdateList'

export function UpdatesTab({ projectId }: { projectId: string }) {
  const [creating, setCreating] = useState(false)
  return (
    <div className="max-w-3xl space-y-4">
      <RoleGate action="update.publish">
        <div className="flex justify-end">
          <Button onClick={() => setCreating(true)}>
            <Plus aria-hidden className="mr-1.5 h-4 w-4" strokeWidth={1.5} />
            Nueva entrada
          </Button>
        </div>
        {creating && <UpdateDialog open onOpenChange={setCreating} projectId={projectId} />}
      </RoleGate>
      <UpdateList projectId={projectId} />
    </div>
  )
}
