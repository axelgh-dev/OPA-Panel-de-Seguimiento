import { Check, TriangleAlert } from 'lucide-react'
import type { Milestone, MilestoneStatus } from '@/data'
import { MilestoneStatusChip } from '@/components/shared/chips'
import { formatDate } from '@/lib/format'
import { cn } from '@/lib/utils'

/** Los 4 estados se distinguen por forma, no solo por color. */
function Node({ status }: { status: MilestoneStatus }) {
  const base = 'relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full'
  switch (status) {
    case 'completado':
      return (
        <span className={cn(base, 'bg-success text-white')}>
          <Check aria-hidden className="h-4 w-4" strokeWidth={2.5} />
        </span>
      )
    case 'en_curso':
      return (
        <span className={cn(base, 'border-2 border-info bg-card')}>
          <span className="h-2.5 w-2.5 rounded-full bg-info" />
        </span>
      )
    case 'retrasado':
      return (
        <span className={cn(base, 'bg-danger text-white')}>
          <TriangleAlert aria-hidden className="h-4 w-4" strokeWidth={2} />
        </span>
      )
    default:
      return (
        <span className={cn(base, 'border-2 border-dashed border-muted-foreground/40 bg-card')} />
      )
  }
}

/** Horizontal desde `md`; vertical en móvil. */
export function MilestoneTimeline({ milestones }: { milestones: Milestone[] }) {
  return (
    <ol className="grid gap-7 md:auto-cols-fr md:grid-flow-col md:gap-0">
      {milestones.map((m, i) => {
        const last = i === milestones.length - 1
        return (
          <li key={m.id} className="relative flex gap-4 md:flex-col md:gap-3 md:pr-4">
            {!last && (
              <span
                aria-hidden
                className={cn(
                  'absolute -bottom-7 left-[15px] top-8 w-0.5 md:bottom-auto md:left-8 md:right-0 md:top-[15px] md:h-0.5 md:w-auto',
                  m.status === 'completado' ? 'bg-gold-500' : 'bg-border',
                )}
              />
            )}
            <Node status={m.status} />
            <div className="min-w-0 space-y-1.5 pb-1">
              <p className="text-sm font-medium leading-snug text-foreground">{m.name}</p>
              <p className="text-xs tabular-nums text-muted-foreground">
                {formatDate(m.start_date)} a {formatDate(m.due_date)}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <MilestoneStatusChip value={m.status} />
                <span className="text-xs text-muted-foreground">Peso {m.weight}</span>
              </div>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
