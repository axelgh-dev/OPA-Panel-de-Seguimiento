import { FolderSearch } from 'lucide-react'
import { useState } from 'react'
import type { ProjectFilters as Filters } from '@/data'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/format'
import { useSession } from '@/lib/session'
import { AttentionBlock } from './AttentionBlock'
import { KpiBand } from './KpiBand'
import { ProjectCard, ProjectCardSkeleton } from './ProjectCard'
import { ProjectFilters } from './ProjectFilters'
import { useDashboardSummary, useProjects } from './hooks'

const DEFAULT_FILTERS: Filters = {
  status: 'todos',
  priority: 'todas',
  search: '',
  sort: 'prioridad',
}

export function DashboardPage() {
  const { user } = useSession()
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const summary = useDashboardSummary()
  const projects = useProjects(filters)

  const isFiltering =
    filters.status !== 'todos' ||
    filters.priority !== 'todas' ||
    (filters.search ?? '').trim() !== ''

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Hola, ${user.full_name}`}
        description={capitalize(formatLongDate(new Date()))}
      />

      <KpiBand kpis={summary.data?.kpis} />

      <AttentionBlock
        items={summary.data?.attention}
        isLoading={summary.isLoading}
        isError={summary.isError}
        onRetry={() => void summary.refetch()}
      />

      <section aria-labelledby="proyectos" className="space-y-4">
        <h2 id="proyectos" className="text-xl">
          Proyectos
        </h2>
        <ProjectFilters value={filters} onChange={setFilters} />

        {projects.isError ? (
          <ErrorState onRetry={() => void projects.refetch()} />
        ) : projects.isLoading ? (
          <div className="grid gap-4 xl:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <ProjectCardSkeleton key={i} />
            ))}
          </div>
        ) : projects.data && projects.data.length > 0 ? (
          <div className="grid gap-4 xl:grid-cols-2" aria-live="polite">
            {projects.data.map((p) => (
              <ProjectCard key={p.id} project={p} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={FolderSearch}
            title={
              isFiltering
                ? 'Ningún proyecto coincide con los filtros'
                : 'Aún no hay proyectos publicados'
            }
            description={
              isFiltering
                ? 'Prueba con otra búsqueda o quita algún filtro.'
                : 'Cuando Axel publique uno, aparecerá aquí.'
            }
            action={
              isFiltering ? (
                <Button variant="outline" onClick={() => setFilters(DEFAULT_FILTERS)}>
                  Quitar filtros
                </Button>
              ) : undefined
            }
          />
        )}
      </section>
    </div>
  )
}

function formatLongDate(d: Date): string {
  // "domingo 22 nov 2026": mismo formato corto del resto de la app, con el día de la semana.
  const weekday = new Intl.DateTimeFormat('es-MX', { weekday: 'long' }).format(d)
  return `${weekday}, ${formatDate(d)}`
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
