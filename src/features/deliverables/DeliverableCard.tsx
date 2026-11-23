import { CircleCheck, ExternalLink, FileText, Lock } from 'lucide-react'
import { useState } from 'react'
import type { DeliverableWithReviews, ReviewDecision } from '@/data'
import { DateLabel } from '@/components/shared/DateLabel'
import { DeliverableStatusChip, ReviewDecisionChip } from '@/components/shared/chips'
import { RoleGate } from '@/components/shared/RoleGate'
import { Button } from '@/components/ui/button'
import { CommentsToggle } from '@/features/comments/CommentsToggle'
import { useSession } from '@/lib/session'
import { cn } from '@/lib/utils'
import { ReviewDialog } from './ReviewDialog'
import { useSubmitDeliverable } from './hooks'

export function DeliverableCard({
  deliverable: d,
  milestoneName,
}: {
  deliverable: DeliverableWithReviews
  milestoneName?: string
}) {
  const { user } = useSession()
  const [decision, setDecision] = useState<ReviewDecision | null>(null)
  const submit = useSubmitDeliverable()

  return (
    <article className="rounded-xl border bg-card p-5 shadow-card">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h3 className="font-serif text-lg font-semibold leading-snug text-primary">
            {d.title}{' '}
            <span className="font-sans text-sm font-normal tabular-nums text-muted-foreground">
              v{d.version}
            </span>
          </h3>
          {milestoneName && <p className="text-sm text-muted-foreground">Hito: {milestoneName}</p>}
        </div>
        <div className="flex items-center gap-2">
          {d.status === 'borrador' && (
            <span className="text-xs text-muted-foreground">Solo lo ves tú</span>
          )}
          <DeliverableStatusChip value={d.status} />
        </div>
      </header>

      <p className="mt-3 text-foreground">{d.description}</p>

      <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
        {d.submitted_at && (
          <div className="flex gap-1.5">
            <dt>Enviado</dt>
            <dd className="text-foreground">
              <DateLabel value={d.submitted_at} />
            </dd>
          </div>
        )}
        {d.decided_at && (
          <div className="flex gap-1.5">
            <dt>Decisión</dt>
            <dd className="text-foreground">
              <DateLabel value={d.decided_at} />
            </dd>
          </div>
        )}
        <div className="flex gap-1.5">
          <dt>Responsable</dt>
          <dd className="text-foreground">{d.creator.full_name}</dd>
        </div>
      </dl>

      {(d.link_url || d.storage_path) && (
        <div className="mt-3">
          {d.link_url ? (
            <a
              href={d.link_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-primary hover:underline"
            >
              <ExternalLink aria-hidden className="h-4 w-4" strokeWidth={1.5} />
              Abrir entregable
            </a>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
              <FileText aria-hidden className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
              {d.storage_path?.split('/').pop()}
            </span>
          )}
        </div>
      )}

      {d.reviews.length > 0 && (
        <section
          aria-label="Historial de revisiones"
          className="mt-4 space-y-3 rounded-lg bg-muted/60 p-4"
        >
          <h4 className="text-sm font-medium">Historial de revisiones</h4>
          <ul className="space-y-3">
            {d.reviews.map((r) => (
              <li key={r.id} className="space-y-1">
                <p className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="font-medium">{r.reviewer.full_name}</span>
                  <ReviewDecisionChip value={r.decision} />
                  <DateLabel
                    value={r.created_at}
                    mode="relative"
                    className="text-muted-foreground"
                  />
                </p>
                {r.comment && <p className="text-foreground">{r.comment}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Acciones según la matriz §3.1 */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <RoleGate action="deliverable.review" entity={{ deliverableStatus: d.status }}>
          <Button size="sm" onClick={() => setDecision('aprobado')}>
            <CircleCheck aria-hidden className="mr-1.5 h-4 w-4" strokeWidth={1.5} />
            Aprobar
          </Button>
          <Button size="sm" variant="outline" onClick={() => setDecision('cambios_solicitados')}>
            Pedir cambios
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="border-danger/40 text-danger-ink hover:bg-danger-soft"
            onClick={() => setDecision('rechazado')}
          >
            Rechazar
          </Button>
        </RoleGate>

        {user.role === 'dev' && d.status === 'en_revision' && (
          <p className="text-sm text-muted-foreground">
            Esperando la decisión del despacho. No puedes aprobar tus propios entregables.
          </p>
        )}

        <RoleGate action="deliverable.submit" entity={{ deliverableStatus: d.status }}>
          {(d.status === 'borrador' ||
            d.status === 'rechazado' ||
            d.status === 'cambios_solicitados') && (
            <Button size="sm" onClick={() => submit.mutate(d.id)} disabled={submit.isPending}>
              {submit.isPending ? 'Enviando…' : 'Enviar a revisión'}
            </Button>
          )}
        </RoleGate>

        {d.status === 'aprobado' && (
          <p className={cn('inline-flex items-center gap-1.5 text-sm text-muted-foreground')}>
            <Lock aria-hidden className="h-3.5 w-3.5" strokeWidth={1.5} />
            Aprobado: no se edita. Un cambio se entrega como nueva versión.
          </p>
        )}
        {submit.isError && (
          <p role="alert" className="text-sm text-danger-ink">
            {submit.error.message}
          </p>
        )}
      </div>

      <div className="mt-4 border-t pt-4">
        <CommentsToggle projectId={d.project_id} targetType="deliverable" targetId={d.id} />
      </div>

      <ReviewDialog
        deliverable={d}
        decision={decision}
        onOpenChange={(o) => !o && setDecision(null)}
      />
    </article>
  )
}
