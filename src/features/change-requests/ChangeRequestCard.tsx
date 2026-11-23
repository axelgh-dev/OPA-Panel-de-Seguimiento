import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { ChangeRequestWithMeta } from '@/data'
import { DateLabel } from '@/components/shared/DateLabel'
import { ChangeReqStatusChip, PriorityLabel } from '@/components/shared/chips'
import { RoleGate } from '@/components/shared/RoleGate'
import { Button } from '@/components/ui/button'
import { CommentsToggle } from '@/features/comments/CommentsToggle'
import { ChangeRequestStatusDialog } from './ChangeRequestStatusDialog'

export function ChangeRequestCard({
  request: r,
  showProject = false,
}: {
  request: ChangeRequestWithMeta
  showProject?: boolean
}) {
  const [responding, setResponding] = useState(false)
  return (
    <article className="rounded-xl border bg-card p-5 shadow-card">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          {showProject && (
            <Link
              to={`/proyectos/${r.project_slug}?tab=solicitudes`}
              className="text-sm text-primary hover:underline"
            >
              {r.project_name}
            </Link>
          )}
          <h3 className="font-serif text-lg font-semibold leading-snug text-primary">{r.title}</h3>
          <p className="text-sm text-muted-foreground">
            Solicitó {r.requester.full_name} · <DateLabel value={r.created_at} mode="relative" />
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PriorityLabel value={r.priority} />
          <ChangeReqStatusChip value={r.status} />
        </div>
      </header>

      <p className="mt-3 text-foreground">{r.description}</p>

      {r.impact_note && (
        <div className="mt-3 rounded-lg border-l-2 border-gold-500 bg-gold-100/60 px-4 py-2.5">
          <p className="text-sm font-medium">Respuesta de Axel</p>
          <p className="text-foreground">{r.impact_note}</p>
        </div>
      )}

      <RoleGate action="change_request.set_status">
        <div className="mt-4">
          <Button size="sm" variant="outline" onClick={() => setResponding(true)}>
            Responder o cambiar estatus
          </Button>
        </div>
        <ChangeRequestStatusDialog request={r} open={responding} onOpenChange={setResponding} />
      </RoleGate>

      <div className="mt-4 border-t pt-4">
        <CommentsToggle
          projectId={r.project_id}
          targetType="change_request"
          targetId={r.id}
          count={r.comment_count}
        />
      </div>
    </article>
  )
}
