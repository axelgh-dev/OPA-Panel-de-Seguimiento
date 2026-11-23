import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useProjects } from '@/features/dashboard/hooks'
import { UpdateList } from './UpdateList'

export function GlobalUpdatesPage() {
  const [projectId, setProjectId] = useState('todos')
  const projects = useProjects({ sort: 'prioridad' })
  return (
    <div>
      <PageHeader
        title="Bitácora"
        description="Lo que Axel va publicando en todos los proyectos, de lo más reciente a lo más antiguo."
        actions={
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger aria-label="Filtrar por proyecto" className="w-full bg-card sm:w-72">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="todos">Todos los proyectos</SelectItem>
              {projects.data?.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />
      <div className="max-w-3xl">
        <UpdateList projectId={projectId === 'todos' ? undefined : projectId} showProject />
      </div>
    </div>
  )
}
