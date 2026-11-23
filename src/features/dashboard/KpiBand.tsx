import type { DashboardKpis } from '@/data'
import { Skeleton } from '@/components/ui/skeleton'

const ITEMS: { key: keyof DashboardKpis; label: string; hint: string }[] = [
  {
    key: 'active_projects',
    label: 'Proyectos activos',
    hint: 'en planeación, progreso o revisión',
  },
  { key: 'upcoming_deliveries', label: 'Entregas en 14 días', hint: 'hitos con fecha próxima' },
  { key: 'pending_approvals', label: 'Por aprobar', hint: 'entregables en revisión' },
  { key: 'open_change_requests', label: 'Solicitudes abiertas', hint: 'sin resolver ni rechazar' },
]

/** Una sola franja de cifras (como un resumen contable), no cuatro tarjetas sueltas. */
export function KpiBand({ kpis }: { kpis?: DashboardKpis }) {
  return (
    <dl className="grid grid-cols-2 overflow-hidden rounded-xl border bg-card shadow-card lg:grid-cols-4">
      {ITEMS.map((item, i) => (
        <div
          key={item.key}
          className={[
            'px-5 py-4',
            i % 2 === 1 ? 'border-l' : '',
            i >= 2 ? 'border-t lg:border-t-0' : '',
            i > 0 ? 'lg:border-l' : '',
          ].join(' ')}
        >
          <dt className="text-sm text-muted-foreground">{item.label}</dt>
          <dd className="mt-1">
            {kpis ? (
              <span className="font-serif text-3xl font-semibold tabular-nums text-primary">
                {kpis[item.key]}
              </span>
            ) : (
              <Skeleton className="h-9 w-12" />
            )}
          </dd>
          <p className="mt-0.5 text-xs text-muted-foreground">{item.hint}</p>
        </div>
      ))}
    </dl>
  )
}
