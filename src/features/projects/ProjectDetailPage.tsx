import { ArrowLeft, SearchX } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import type { PriorityLevel, ProjectOverview, ProjectTab } from '@/data'
import { PageHeader } from '@/components/layout/PageHeader'
import { DateLabel } from '@/components/shared/DateLabel'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { HealthChip, PriorityLabel, ProjectStatusChip } from '@/components/shared/chips'
import { RoleGate } from '@/components/shared/RoleGate'
import { SegmentedProgress } from '@/components/shared/SegmentedProgress'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MetaSelectItems } from '@/components/shared/MetaSelectItems'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PRIORITY, PROJECT_TABS, TAB_LABEL } from '@/lib/labels'
import { cn } from '@/lib/utils'
import { useProject, useSetProjectPriority } from './hooks'
import { ActivityTab } from './tabs/ActivityTab'
import { ChangeRequestsTab } from './tabs/ChangeRequestsTab'
import { DeliverablesTab } from './tabs/DeliverablesTab'
import { OverviewTab } from './tabs/OverviewTab'
import { TasksTab } from './tabs/TasksTab'
import { UpdatesTab } from './tabs/UpdatesTab'

function isTab(v: string | null): v is ProjectTab {
  return PROJECT_TABS.includes(v as ProjectTab)
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm">{children}</dd>
    </div>
  )
}

function PriorityControl({ project }: { project: ProjectOverview }) {
  const set = useSetProjectPriority()
  return (
    <RoleGate action="priority.set" fallback={<PriorityLabel value={project.priority} />}>
      <Select
        value={project.priority}
        onValueChange={(v) => set.mutate({ projectId: project.id, priority: v as PriorityLevel })}
      >
        <SelectTrigger
          aria-label="Prioridad del proyecto"
          className="-ml-1 h-7 w-28 border-transparent bg-transparent px-1 text-sm shadow-none hover:border-input"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <MetaSelectItems map={PRIORITY} />
        </SelectContent>
      </Select>
    </RoleGate>
  )
}

function Badge({ n, label }: { n: number; label: string }) {
  if (n === 0) return null
  return (
    <span className="ml-2 rounded-full bg-gold-100 px-1.5 py-0.5 text-[11px] font-medium tabular-nums leading-none text-foreground">
      {n}
      <span className="sr-only"> {label}</span>
    </span>
  )
}

export function ProjectDetailPage() {
  const { slug = '' } = useParams()
  const [params, setParams] = useSearchParams()
  const query = useProject(slug)
  const tab: ProjectTab = isTab(params.get('tab')) ? (params.get('tab') as ProjectTab) : 'resumen'
  const setTab = (next: string) =>
    setParams(next === 'resumen' ? {} : { tab: next }, { replace: true })

  if (query.isError) return <ErrorState onRetry={() => void query.refetch()} />
  if (query.isLoading) return <DetailSkeleton />
  const p = query.data
  if (!p) {
    return (
      <EmptyState
        icon={SearchX}
        title="No encontramos este proyecto"
        description="Puede que el enlace sea incorrecto o que aún no esté publicado para tu usuario."
        action={
          <Button asChild>
            <Link to="/">Volver al inicio</Link>
          </Button>
        }
      />
    )
  }

  return (
    <div>
      <Link
        to="/"
        className="mb-4 inline-flex items-center gap-1.5 rounded text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="h-4 w-4" strokeWidth={1.5} />
        Todos los proyectos
      </Link>

      <PageHeader title={p.name} description={p.summary} />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <ProjectStatusChip value={p.status} />
        <HealthChip value={p.health} />
        {!p.is_published && (
          <span className="text-xs text-muted-foreground">Borrador: solo lo ves tú</span>
        )}
      </div>

      <section
        aria-label="Datos del proyecto"
        className="mb-8 rounded-xl border bg-card p-5 shadow-card"
      >
        <div className="flex items-center gap-4">
          <span className="font-serif text-4xl font-semibold tabular-nums text-primary">
            {p.progress}%
          </span>
          <div className="flex-1 space-y-1.5">
            <SegmentedProgress segments={p.segments} progress={p.progress} />
            <p className="text-xs text-muted-foreground">
              Cada segmento es un hito; su ancho es su peso en el avance.
            </p>
          </div>
        </div>
        <dl className={cn('mt-5 grid grid-cols-2 gap-x-6 gap-y-4 border-t pt-4 sm:grid-cols-4')}>
          <Fact label="Inicio">
            <DateLabel value={p.start_date} />
          </Fact>
          <Fact label="Entrega objetivo">
            <DateLabel value={p.target_date} />{' '}
            <span className="text-xs text-muted-foreground">
              (<DateLabel value={p.target_date} mode="days" />)
            </span>
          </Fact>
          <Fact label="Fase actual">{p.current_milestone?.name ?? 'Sin hitos pendientes'}</Fact>
          <Fact label="Prioridad">
            <PriorityControl project={p} />
          </Fact>
        </dl>
      </section>

      <Tabs value={tab} onValueChange={setTab}>
        <div className="relative -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList className="h-auto w-max min-w-full justify-start gap-1 rounded-none border-b bg-transparent p-0">
            {PROJECT_TABS.map((t) => (
              <TabsTrigger
                key={t}
                value={t}
                className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm text-muted-foreground shadow-none data-[state=active]:border-gold-500 data-[state=active]:bg-transparent data-[state=active]:font-medium data-[state=active]:text-primary data-[state=active]:shadow-none"
              >
                {TAB_LABEL[t]}
                {t === 'entregables' && (
                  <Badge n={p.alerts.pending_deliverables} label="por aprobar" />
                )}
                {t === 'solicitudes' && (
                  <Badge n={p.alerts.open_change_requests} label="abiertas" />
                )}
                {t === 'actividad' && <Badge n={p.alerts.unread_comments} label="sin leer" />}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="pt-6">
          <TabsContent value="resumen" className="mt-0">
            <OverviewTab project={p} onGoTo={setTab} />
          </TabsContent>
          <TabsContent value="tareas" className="mt-0">
            <TasksTab projectId={p.id} />
          </TabsContent>
          <TabsContent value="entregables" className="mt-0">
            <DeliverablesTab projectId={p.id} />
          </TabsContent>
          <TabsContent value="bitacora" className="mt-0">
            <UpdatesTab projectId={p.id} />
          </TabsContent>
          <TabsContent value="solicitudes" className="mt-0">
            <ChangeRequestsTab projectId={p.id} />
          </TabsContent>
          <TabsContent value="actividad" className="mt-0">
            <ActivityTab projectId={p.id} />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

function DetailSkeleton() {
  return (
    <div className="space-y-6" aria-hidden>
      <Skeleton className="h-4 w-36" />
      <Skeleton className="h-10 w-2/3" />
      <Skeleton className="h-5 w-full max-w-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  )
}
