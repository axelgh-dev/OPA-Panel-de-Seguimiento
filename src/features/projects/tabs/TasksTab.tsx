import { ListChecks, Lock, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { Milestone, Task, TaskStatus } from '@/data'
import { DateLabel } from '@/components/shared/DateLabel'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { RoleGate } from '@/components/shared/RoleGate'
import { TaskStatusChip } from '@/components/shared/chips'
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MetaSelectItems } from '@/components/shared/MetaSelectItems'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { QuickAddTask, TaskEditDialog } from '@/features/manage/TaskForms'
import { useDeleteTask } from '@/features/manage/hooks'
import { TASK_STATUS } from '@/lib/labels'
import { useSession } from '@/lib/session'
import { useMilestones, useTasks, useUpdateTaskStatus } from '../hooks'

function TaskRow({ task, milestones }: { task: Task; milestones: Milestone[] }) {
  const update = useUpdateTaskStatus()
  const remove = useDeleteTask()
  const [editing, setEditing] = useState(false)
  const [removing, setRemoving] = useState(false)
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
      <div className="min-w-0 flex-1 basis-60">
        <p
          className={
            task.status === 'hecha'
              ? 'text-muted-foreground line-through decoration-muted-foreground/50'
              : 'font-medium'
          }
        >
          {task.title}
        </p>
        <p className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
          {task.due_date && (
            <span>
              Vence <DateLabel value={task.due_date} /> (
              <DateLabel value={task.due_date} mode="days" />)
            </span>
          )}
          {task.is_internal && (
            <span className="inline-flex items-center gap-1 text-gold-600">
              <Lock aria-hidden className="h-3 w-3" strokeWidth={1.5} /> Interna: el despacho no la
              ve
            </span>
          )}
        </p>
      </div>
      <RoleGate action="task.edit" fallback={<TaskStatusChip value={task.status} />}>
        <Select
          value={task.status}
          onValueChange={(v) => update.mutate({ taskId: task.id, status: v as TaskStatus })}
        >
          <SelectTrigger
            aria-label={`Estatus de la tarea: ${task.title}`}
            className="h-8 w-40 bg-card text-xs"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            <MetaSelectItems map={TASK_STATUS} className="text-xs" />
          </SelectContent>
        </Select>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Editar la tarea ${task.title}`}
            onClick={() => setEditing(true)}
          >
            <Pencil aria-hidden className="h-4 w-4" strokeWidth={1.5} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Eliminar la tarea ${task.title}`}
            onClick={() => setRemoving(true)}
          >
            <Trash2 aria-hidden className="h-4 w-4 text-danger-ink" strokeWidth={1.5} />
          </Button>
        </div>
        {editing && (
          <TaskEditDialog task={task} milestones={milestones} open onOpenChange={setEditing} />
        )}
        <ConfirmDialog
          open={removing}
          onOpenChange={setRemoving}
          title="Eliminar tarea"
          description={`Se borrará “${task.title}”. Esta acción no se puede deshacer.`}
          confirmLabel="Eliminar tarea"
          onConfirm={() => remove.mutateAsync(task.id)}
        />
      </RoleGate>
    </li>
  )
}

export function TasksTab({ projectId }: { projectId: string }) {
  const { user } = useSession()
  const tasks = useTasks(projectId)
  const milestones = useMilestones(projectId)

  if (tasks.isError || milestones.isError) {
    return <ErrorState onRetry={() => void (tasks.refetch(), milestones.refetch())} />
  }
  if (tasks.isLoading || milestones.isLoading) {
    return (
      <div className="space-y-4" aria-hidden>
        {[0, 1].map((i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl" />
        ))}
      </div>
    )
  }
  if ((tasks.data ?? []).length === 0) {
    return (
      <div className="space-y-5">
        <RoleGate action="task.edit">
          <QuickAddTask projectId={projectId} milestones={milestones.data ?? []} />
        </RoleGate>
        <EmptyState
          icon={ListChecks}
          title="Aún no hay tareas en este proyecto"
          description={
            user.role === 'dev'
              ? 'Agrega la primera arriba; puedes asignarla a un hito.'
              : 'Axel las irá agregando conforme avance cada hito.'
          }
        />
      </div>
    )
  }

  const groups: { key: string; milestone: Milestone | null; tasks: Task[] }[] = [
    ...(milestones.data ?? []).map((m) => ({
      key: m.id,
      milestone: m,
      tasks: (tasks.data ?? []).filter((t) => t.milestone_id === m.id),
    })),
    {
      key: 'sin-hito',
      milestone: null,
      tasks: (tasks.data ?? []).filter((t) => t.milestone_id === null),
    },
  ].filter((g) => g.tasks.length > 0)

  return (
    <div className="space-y-5">
      <RoleGate action="task.edit">
        <QuickAddTask projectId={projectId} milestones={milestones.data ?? []} />
      </RoleGate>
      {user.role === 'opa' && (
        <p className="text-sm text-muted-foreground">
          Vista de solo lectura. Axel actualiza el estatus de las tareas.
        </p>
      )}
      {groups.map((g) => {
        const done = g.tasks.filter((t) => t.status === 'hecha').length
        return (
          <section key={g.key} className="rounded-xl border bg-card px-5 pt-4 shadow-card">
            <h2 className="flex flex-wrap items-baseline justify-between gap-2 text-base">
              {g.milestone?.name ?? 'Sin hito asignado'}
              <span className="font-sans text-sm font-normal tabular-nums text-muted-foreground">
                {done} de {g.tasks.length} hechas
              </span>
            </h2>
            <ul className="mt-1 divide-y">
              {g.tasks.map((t) => (
                <TaskRow key={t.id} task={t} milestones={milestones.data ?? []} />
              ))}
            </ul>
          </section>
        )
      })}
    </div>
  )
}
