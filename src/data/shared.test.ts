import { toDomainError } from './supabase/errors'
import { filterAndSortProjects, milestoneFocus, normalize } from './shared'
import type { Milestone, ProjectOverview } from './types'

const ms = (over: Partial<Milestone>): Milestone => ({
  id: 'm',
  project_id: 'p',
  name: 'Hito',
  description: '',
  position: 0,
  weight: 1,
  start_date: '2026-01-01',
  due_date: '2026-02-01',
  status: 'pendiente',
  completed_at: null,
  ...over,
})

const project = (over: Partial<ProjectOverview>): ProjectOverview =>
  ({
    name: 'Proyecto',
    summary: '',
    status: 'en_progreso',
    priority: 'media',
    next_milestone: null,
    last_activity_at: '2026-01-01T00:00:00Z',
    ...over,
  }) as ProjectOverview

describe('normalize', () => {
  it('quita acentos y mayúsculas', () => {
    expect(normalize('Conciliación BANCARIA')).toBe('conciliacion bancaria')
  })
})

describe('milestoneFocus', () => {
  it('el hito actual es el retrasado o en curso; el próximo, el de fecha más cercana sin completar', () => {
    const list = [
      ms({ id: 'a', status: 'completado', due_date: '2026-01-10' }),
      ms({ id: 'b', status: 'en_curso', due_date: '2026-03-01' }),
      ms({ id: 'c', status: 'pendiente', due_date: '2026-02-01' }),
    ]
    const { current_milestone, next_milestone } = milestoneFocus(list)
    expect(current_milestone?.id).toBe('b')
    expect(next_milestone?.id).toBe('c')
  })

  it('sin hitos abiertos devuelve null', () => {
    expect(milestoneFocus([ms({ status: 'completado' })])).toEqual({
      current_milestone: null,
      next_milestone: null,
    })
  })
})

describe('filterAndSortProjects', () => {
  const list = [
    project({ name: 'Baja', priority: 'baja' }),
    project({ name: 'Alta', priority: 'alta' }),
    project({ name: 'Cancelado', status: 'cancelado', priority: 'alta' }),
  ]

  it('ordena por prioridad y filtra por estatus', () => {
    expect(filterAndSortProjects(list, {}).map((p) => p.name)).toEqual([
      'Alta',
      'Cancelado',
      'Baja',
    ])
    expect(filterAndSortProjects(list, { status: 'cancelado' }).map((p) => p.name)).toEqual([
      'Cancelado',
    ])
  })

  it('busca sin importar acentos', () => {
    expect(
      filterAndSortProjects([project({ name: 'Conciliación' })], { search: 'conciliacion' }),
    ).toHaveLength(1)
  })
})

describe('toDomainError', () => {
  it('muestra tal cual los mensajes de nuestras reglas (P0001)', () => {
    expect(
      toDomainError({ code: 'P0001', message: 'Un entregable aprobado no se puede modificar.' })
        .message,
    ).toBe('Un entregable aprobado no se puede modificar.')
  })

  it('no filtra mensajes técnicos al usuario', () => {
    expect(
      toDomainError({ code: '42501', message: 'new row violates row-level security policy' })
        .message,
    ).toBe('No tienes permiso para realizar esta acción.')
    expect(toDomainError({ code: 'XX000', message: 'boom' }).message).toBe(
      'Ocurrió un error inesperado. Intenta de nuevo.',
    )
  })

  it('reconoce fallas de red', () => {
    expect(toDomainError({ message: 'TypeError: Failed to fetch' }).message).toMatch(/conectar/)
  })
})
