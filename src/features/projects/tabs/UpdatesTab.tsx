import { UpdateList } from '@/features/updates/UpdateList'

export function UpdatesTab({ projectId }: { projectId: string }) {
  return (
    <div className="max-w-3xl">
      <UpdateList projectId={projectId} />
    </div>
  )
}
