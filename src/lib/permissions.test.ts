import { can, canModifyComment, type Action } from './permissions'

const SOLO_DEV: Action[] = [
  'project.view_draft',
  'project.edit',
  'task.view_internal',
  'task.edit',
  'update.publish',
  'deliverable.submit',
  'change_request.set_status',
  'user.manage',
]
const SOLO_OPA: Action[] = ['deliverable.review', 'change_request.create']
const AMBOS: Action[] = ['comment.create', 'comment.edit_own', 'priority.set', 'activity.view']

describe('can() según la matriz §3.1', () => {
  it.each(SOLO_DEV)('%s: solo dev', (action) => {
    expect(can('dev', action)).toBe(true)
    expect(can('opa', action)).toBe(false)
  })

  it.each(SOLO_OPA)('%s: solo opa', (action) => {
    expect(can('opa', action)).toBe(true)
    expect(can('dev', action)).toBe(false)
  })

  it.each(AMBOS)('%s: dev y opa', (action) => {
    expect(can('dev', action)).toBe(true)
    expect(can('opa', action)).toBe(true)
  })

  it('el dev nunca aprueba sus propios entregables', () => {
    expect(can('dev', 'deliverable.review', { deliverableStatus: 'en_revision' })).toBe(false)
  })

  it('opa solo revisa entregables que están en revisión', () => {
    expect(can('opa', 'deliverable.review', { deliverableStatus: 'en_revision' })).toBe(true)
    expect(can('opa', 'deliverable.review', { deliverableStatus: 'aprobado' })).toBe(false)
    expect(can('opa', 'deliverable.review', { deliverableStatus: 'borrador' })).toBe(false)
  })

  it('un entregable aprobado no se puede volver a enviar', () => {
    expect(can('dev', 'deliverable.submit', { deliverableStatus: 'aprobado' })).toBe(false)
    expect(can('dev', 'deliverable.submit', { deliverableStatus: 'borrador' })).toBe(true)
  })
})

describe('comentarios propios: editar y borrar (§3.1)', () => {
  const NOW = new Date('2026-11-22T12:00:00Z')
  const min = (n: number) => new Date(NOW.getTime() - n * 60_000).toISOString()
  const own = { author_id: 'u-admin', created_at: min(5), deleted_at: null }

  it('el autor puede dentro de la ventana de 15 minutos', () => {
    expect(canModifyComment('opa', 'u-admin', own, NOW)).toBe(true)
    expect(canModifyComment('opa', 'u-admin', { ...own, created_at: min(15) }, NOW)).toBe(true)
  })

  it('no puede después de 15 minutos', () => {
    expect(canModifyComment('opa', 'u-admin', { ...own, created_at: min(16) }, NOW)).toBe(false)
  })

  it('nadie más puede modificar un comentario ajeno, ni siquiera el dev', () => {
    expect(canModifyComment('opa', 'u-ej1', own, NOW)).toBe(false)
    expect(canModifyComment('dev', 'u-axel', own, NOW)).toBe(false)
  })

  it('un comentario ya eliminado no se modifica', () => {
    expect(canModifyComment('opa', 'u-admin', { ...own, deleted_at: min(1) }, NOW)).toBe(false)
  })
})
