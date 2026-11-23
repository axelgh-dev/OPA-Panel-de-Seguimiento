import { FileCheck2, GitPullRequestArrow, MessageSquare } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { ProjectOverview } from '@/data'
import { DateLabel } from '@/components/shared/DateLabel'
import { HealthChip, ProjectStatusChip, PriorityLabel } from '@/components/shared/chips'
import { SegmentedProgress } from '@/components/shared/SegmentedProgress'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const SPINE = {
  en_tiempo: 'bg-success',
  en_riesgo: 'bg-warning',
  retrasado: 'bg-danger',
} as const

function Alert({
  icon: Icon,
  count,
  singular,
  plural,
}: {
  icon: typeof FileCheck2
  count: number
  singular: string
  plural: string
}) {
  if (count === 0) return null
  return (
    <span
      className="inline-flex items-center gap-1 text-xs text-foreground"
      title={`${count} ${count === 1 ? singular : plural}`}
    >
      <Icon aria-hidden className="h-3.5 w-3.5 text-gold-600" strokeWidth={1.5} />
      <span className="tabular-nums">{count}</span>
      <span className="sr-only">{count === 1 ? singular : plural}</span>
    </span>
  )
}

/** El lomo lateral codifica la salud del proyecto; la barra segmentada, el avance por hito. */
export function ProjectCard({ project: p }: { project: ProjectOverview }) {
  return (
    <Link
      to={`/proyectos/${p.slug}`}
      className="group relative block overflow-hidden rounded-xl border bg-card shadow-card transition-shadow hover:shadow-card-hover focus-visible:ring-offset-2"
    >
      <span aria-hidden className={cn('absolute inset-y-0 left-0 w-1', SPINE[p.health])} />
      <article className="flex h-full flex-col gap-4 py-5 pl-6 pr-5">
        <header className="space-y-2">
          <h3 className="font-serif text-lg font-semibold leading-snug text-primary group-hover:underline group-hover:decoration-gold-500 group-hover:underline-offset-4">
            {p.name}
          </h3>
          <div className="flex flex-wrap items-center gap-2">
            <ProjectStatusChip value={p.status} />
            <HealthChip value={p.health} />
            {!p.is_published && (
              <span className="text-xs text-muted-foreground">Borrador, solo lo ves tú</span>
            )}
          </div>
        </header>

        <p className="line-clamp-2 text-muted-foreground">{p.summary}</p>

        <div className="space-y-1.5">
          <div className="flex items-center gap-3">
            <SegmentedProgress segments={p.segments} progress={p.progress} />
            <span className="w-10 shrink-0 text-right text-sm font-medium tabular-nums">
              {p.progress}%
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {p.current_milestone ? (
              <>Fase actual: {p.current_milestone.name}</>
            ) : (
              'Sin hitos pendientes'
            )}
          </p>
        </div>

        <footer className="mt-auto flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-t pt-3">
          <div>
            <p className="text-xs text-muted-foreground">Próxima entrega</p>
            {p.next_milestone ? (
              <p className="text-sm">
                <DateLabel value={p.next_milestone.due_date} />
                <span
                  className={cn(
                    'ml-1.5 text-xs',
                    p.next_milestone.status === 'retrasado'
                      ? 'font-medium text-danger-ink'
                      : 'text-muted-foreground',
                  )}
                >
                  (<DateLabel value={p.next_milestone.due_date} mode="days" />)
                </span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">Sin fecha</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <PriorityLabel value={p.priority} />
            <span className="flex items-center gap-2.5">
              <Alert
                icon={FileCheck2}
                count={p.alerts.pending_deliverables}
                singular="entregable por aprobar"
                plural="entregables por aprobar"
              />
              <Alert
                icon={MessageSquare}
                count={p.alerts.unread_comments}
                singular="comentario sin leer"
                plural="comentarios sin leer"
              />
              <Alert
                icon={GitPullRequestArrow}
                count={p.alerts.open_change_requests}
                singular="solicitud abierta"
                plural="solicitudes abiertas"
              />
            </span>
          </div>
        </footer>
      </article>
    </Link>
  )
}

export function ProjectCardSkeleton() {
  return (
    <div className="space-y-4 rounded-xl border bg-card py-5 pl-6 pr-5 shadow-card" aria-hidden>
      <Skeleton className="h-6 w-3/4" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-5 w-20 rounded-full" />
      </div>
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-2.5 w-full" />
      <Skeleton className="h-8 w-full" />
    </div>
  )
}
