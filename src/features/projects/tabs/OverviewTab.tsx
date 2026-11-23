import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ProjectOverview } from '@/data'
import { DateLabel } from '@/components/shared/DateLabel'
import { ErrorState } from '@/components/shared/ErrorState'
import { Markdown } from '@/components/shared/Markdown'
import { MilestoneStatusChip, UpdateTypeChip } from '@/components/shared/chips'
import { Skeleton } from '@/components/ui/skeleton'
import { useUpdates } from '@/features/updates/hooks'
import { useMilestones } from '../hooks'
import { MilestoneTimeline } from '../MilestoneTimeline'

function Panel({
  title,
  children,
  action,
}: {
  title: string
  children: React.ReactNode
  action?: React.ReactNode
}) {
  return (
    <section className="rounded-xl border bg-card p-5 shadow-card">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="text-lg">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

export function OverviewTab({
  project,
  onGoTo,
}: {
  project: ProjectOverview
  onGoTo: (tab: 'bitacora') => void
}) {
  const milestones = useMilestones(project.id)
  const updates = useUpdates(project.id)
  const upcoming = (milestones.data ?? [])
    .filter((m) => m.status !== 'completado')
    .sort((a, b) => a.due_date.localeCompare(b.due_date))
    .slice(0, 3)

  return (
    <div className="space-y-5">
      <Panel title="Línea de tiempo">
        {milestones.isError ? (
          <ErrorState onRetry={() => void milestones.refetch()} />
        ) : milestones.isLoading ? (
          <Skeleton className="h-28 w-full" />
        ) : (
          <MilestoneTimeline milestones={milestones.data ?? []} />
        )}
      </Panel>

      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Próximos hitos">
          {milestones.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : upcoming.length === 0 ? (
            <p className="text-muted-foreground">Todos los hitos están completados.</p>
          ) : (
            <ul className="divide-y">
              {upcoming.map((m) => (
                <li
                  key={m.id}
                  className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{m.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Entrega <DateLabel value={m.due_date} /> (
                      <DateLabel value={m.due_date} mode="days" />)
                    </p>
                  </div>
                  <MilestoneStatusChip value={m.status} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Últimas entradas de la bitácora"
          action={
            <button
              type="button"
              onClick={() => onGoTo('bitacora')}
              className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded text-sm font-medium text-primary hover:underline"
            >
              Ver todas <ArrowRight aria-hidden className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          }
        >
          {updates.isError ? (
            <ErrorState onRetry={() => void updates.refetch()} />
          ) : updates.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (updates.data ?? []).length === 0 ? (
            <p className="text-muted-foreground">Aún no hay entradas en la bitácora.</p>
          ) : (
            <ul className="divide-y">
              {(updates.data ?? []).slice(0, 3).map((u) => (
                <li key={u.id} className="space-y-1 py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <UpdateTypeChip value={u.type} />
                    <DateLabel
                      value={u.published_at}
                      mode="relative"
                      className="text-xs text-muted-foreground"
                    />
                  </div>
                  <p className="font-medium">{u.title}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Acerca del proyecto">
        <Markdown className="max-w-3xl">{project.description_md}</Markdown>
        <p className="mt-4 text-sm text-muted-foreground">
          Ver{' '}
          <Link to="/bitacora" className="font-medium text-primary hover:underline">
            la bitácora de todos los proyectos
          </Link>
          .
        </p>
      </Panel>
    </div>
  )
}
