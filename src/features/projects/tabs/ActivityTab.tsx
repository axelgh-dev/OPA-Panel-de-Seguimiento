import { History } from 'lucide-react'
import { useEffect } from 'react'
import type { ActivityAction, ActivityWithActor } from '@/data'
import { DateLabel } from '@/components/shared/DateLabel'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { Skeleton } from '@/components/ui/skeleton'
import { CommentThread } from '@/features/comments/CommentThread'
import { useActivity, useMarkProjectRead } from '../hooks'

const VERB: Record<ActivityAction, string> = {
  entregable_enviado: 'envió a revisión',
  entregable_aprobado: 'aprobó',
  entregable_rechazado: 'rechazó',
  entregable_cambios_solicitados: 'pidió cambios en',
  bitacora_publicada: 'publicó en la bitácora',
  solicitud_creada: 'creó la solicitud',
  solicitud_estatus: 'actualizó la solicitud',
  comentario_creado: 'comentó en',
  hito_completado: 'completó el hito',
  prioridad_cambiada: 'cambió la prioridad de',
}

function EventRow({ e }: { e: ActivityWithActor }) {
  return (
    <li className="flex items-start gap-3 py-3">
      <UserAvatar user={e.actor} size="sm" className="mt-0.5" />
      <p className="min-w-0 flex-1 text-sm">
        <span className="font-medium">{e.actor.full_name}</span> {VERB[e.action]}{' '}
        <span className="font-medium">{e.entity_label}</span>
      </p>
      <DateLabel
        value={e.created_at}
        mode="relative"
        className="shrink-0 text-xs text-muted-foreground"
      />
    </li>
  )
}

export function ActivityTab({ projectId }: { projectId: string }) {
  const activity = useActivity(projectId)
  const { mutate: markRead } = useMarkProjectRead()

  // Al abrir esta pestaña se da por leído lo que había (equivale a escribir en read_receipts).
  useEffect(() => {
    markRead(projectId)
  }, [markRead, projectId])

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <section className="rounded-xl border bg-card p-5 shadow-card">
        <h2 className="mb-4 text-lg">Comentarios del proyecto</h2>
        <CommentThread projectId={projectId} targetType="project" targetId={projectId} />
      </section>

      <section className="rounded-xl border bg-card p-5 shadow-card">
        <h2 className="mb-2 text-lg">Historial de actividad</h2>
        {activity.isError ? (
          <ErrorState onRetry={() => void activity.refetch()} />
        ) : activity.isLoading ? (
          <div className="space-y-3" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : (activity.data ?? []).length === 0 ? (
          <EmptyState icon={History} title="Aún no hay actividad" className="border-0 py-8" />
        ) : (
          <ul className="divide-y">
            {activity.data!.map((e) => (
              <EventRow key={e.id} e={e} />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
