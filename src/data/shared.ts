import type { Milestone, PriorityLevel, ProjectFilters, ProjectOverview } from './types'

/** Lógica pura compartida por los adaptadores mock y Supabase (misma regla en ambos). */

/** Minúsculas y sin acentos, para buscar sin importar tildes. */
export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

export const PRIORITY_ORDER: Record<PriorityLevel, number> = { alta: 0, media: 1, baja: 2 }

/** Hito en curso (o el primero pendiente) y el de fecha límite más próxima, entre los no completados. */
export function milestoneFocus(milestonesByPosition: Milestone[]): {
  current_milestone: Milestone | null
  next_milestone: Milestone | null
} {
  const open = milestonesByPosition.filter((m) => m.status !== 'completado')
  const current_milestone =
    open.find((m) => m.status === 'retrasado' || m.status === 'en_curso') ?? open[0] ?? null
  const next_milestone = [...open].sort((a, b) => a.due_date.localeCompare(b.due_date))[0] ?? null
  return { current_milestone, next_milestone }
}

/** Aplica los filtros del dashboard (estatus, prioridad, búsqueda) y el orden. */
export function filterAndSortProjects(
  list: ProjectOverview[],
  filters: ProjectFilters,
): ProjectOverview[] {
  const { status = 'todos', priority = 'todas', search = '', sort = 'prioridad' } = filters
  const q = normalize(search.trim())
  const out = list
    .filter((p) => status === 'todos' || p.status === status)
    .filter((p) => priority === 'todas' || p.priority === priority)
    .filter((p) => q === '' || normalize(`${p.name} ${p.summary}`).includes(q))
  const dueOf = (p: ProjectOverview) => p.next_milestone?.due_date ?? '9999-12-31'
  out.sort((a, b) => {
    if (sort === 'proxima_entrega') return dueOf(a).localeCompare(dueOf(b))
    if (sort === 'ultimo_movimiento') return b.last_activity_at.localeCompare(a.last_activity_at)
    return (
      PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority] || dueOf(a).localeCompare(dueOf(b))
    )
  })
  return out
}
