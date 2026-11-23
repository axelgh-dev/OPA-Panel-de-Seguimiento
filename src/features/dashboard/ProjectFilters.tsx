import { Search } from 'lucide-react'
import type { PriorityLevel, ProjectFilters as Filters, ProjectSort, ProjectStatus } from '@/data'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PRIORITY, PROJECT_STATUS } from '@/lib/labels'

const SORTS: { value: ProjectSort; label: string }[] = [
  { value: 'prioridad', label: 'Prioridad' },
  { value: 'proxima_entrega', label: 'Próxima entrega' },
  { value: 'ultimo_movimiento', label: 'Último movimiento' },
]

export function ProjectFilters({
  value,
  onChange,
}: {
  value: Filters
  onChange: (next: Filters) => void
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <div className="relative sm:w-64">
        <Search
          aria-hidden
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          strokeWidth={1.5}
        />
        <Input
          type="search"
          aria-label="Buscar proyecto por nombre"
          placeholder="Buscar por nombre"
          className="bg-card pl-9"
          value={value.search ?? ''}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:flex">
        <Select
          value={value.status ?? 'todos'}
          onValueChange={(v) => onChange({ ...value, status: v as ProjectStatus | 'todos' })}
        >
          <SelectTrigger aria-label="Filtrar por estatus" className="bg-card sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estatus</SelectItem>
            {Object.entries(PROJECT_STATUS).map(([k, m]) => (
              <SelectItem key={k} value={k}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={value.priority ?? 'todas'}
          onValueChange={(v) => onChange({ ...value, priority: v as PriorityLevel | 'todas' })}
        >
          <SelectTrigger aria-label="Filtrar por prioridad" className="bg-card sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Toda prioridad</SelectItem>
            {Object.entries(PRIORITY).map(([k, m]) => (
              <SelectItem key={k} value={k}>
                Prioridad {m.label.toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2 sm:ml-auto">
        <span className="text-sm text-muted-foreground">Ordenar por</span>
        <Select
          value={value.sort ?? 'prioridad'}
          onValueChange={(v) => onChange({ ...value, sort: v as ProjectSort })}
        >
          <SelectTrigger aria-label="Ordenar proyectos" className="w-full bg-card sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="end">
            {SORTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
