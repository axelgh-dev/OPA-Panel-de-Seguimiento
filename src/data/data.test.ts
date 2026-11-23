import { getDb } from './mock/db'
import {
  DomainError,
  createMilestone,
  createProject,
  createUpdate,
  deleteDeliverable,
  getMilestones,
  getProfiles,
  reorderMilestones,
  updateDeliverable,
  updateProfile,
  updateProject,
  addComment,
  createChangeRequest,
  deleteComment,
  editComment,
  getComments,
  getDashboardKpis,
  getDeliverables,
  getProject,
  getProjects,
  getTasks,
  getDemo,
  reviewDeliverable,
  setChangeRequestStatus,
} from '.'

const { resetDb, setSession } = getDemo()

import { PORTAL } from './mock/projects'

const PORTAL_ID = PORTAL
const ADMIN = 'u-admin'
const AXEL = 'u-axel'

beforeEach(() => {
  resetDb()
  setSession(ADMIN)
})

describe('visibilidad por rol (equivalente a RLS)', () => {
  it('OPA no ve proyectos en borrador; dev sí', async () => {
    expect((await getProjects()).map((p) => p.slug)).not.toContain('tablero-indicadores-clientes')
    expect(await getProject('tablero-indicadores-clientes')).toBeNull()
    setSession(AXEL)
    expect((await getProjects()).length).toBe(5)
    expect(await getProject('tablero-indicadores-clientes')).not.toBeNull()
  })

  it('OPA no ve tareas internas ni entregables en borrador; dev sí', async () => {
    const tareasOpa = await getTasks('pr-portal')
    expect(tareasOpa.some((t) => t.is_internal)).toBe(false)
    const entregablesOpa = await getDeliverables('pr-portal')
    expect(entregablesOpa.some((d) => d.status === 'borrador')).toBe(false)

    setSession(AXEL)
    expect((await getTasks('pr-portal')).some((t) => t.is_internal)).toBe(true)
    expect((await getDeliverables('pr-portal')).some((d) => d.status === 'borrador')).toBe(true)
  })
})

describe('proyectos', () => {
  it('calcula el avance por peso de hitos', async () => {
    const portal = await getProject('portal-clientes-documentos-fiscales')
    expect(portal?.progress).toBe(30)
    const concilia = await getProject('automatizacion-conciliaciones-bancarias')
    expect(concilia?.progress).toBe(57)
  })

  it('filtra por estatus, prioridad y búsqueda sin acentos', async () => {
    expect((await getProjects({ status: 'en_revision' })).map((p) => p.id)).toEqual(['pr-concilia'])
    expect((await getProjects({ priority: 'alta' })).length).toBe(2)
    expect((await getProjects({ search: 'conciliacion' })).map((p) => p.id)).toEqual([
      'pr-concilia',
    ])
  })

  it('ordena por prioridad por defecto', async () => {
    const prioridades = (await getProjects()).map((p) => p.priority)
    expect(prioridades).toEqual(
      [...prioridades].sort((a, b) => 'alta media baja'.indexOf(a) - 'alta media baja'.indexOf(b)),
    )
  })
})

describe('aprobación de entregables', () => {
  it('OPA aprueba y queda registrada la revisión', async () => {
    await reviewDeliverable({ deliverable_id: 'dl-portal-3', decision: 'aprobado', comment: '' })
    const dl = (await getDeliverables('pr-portal')).find((d) => d.id === 'dl-portal-3')!
    expect(dl.status).toBe('aprobado')
    expect(dl.reviews[0]).toMatchObject({ decision: 'aprobado', reviewer_id: ADMIN })
  })

  it('rechazar o pedir cambios exige comentario', async () => {
    await expect(
      reviewDeliverable({ deliverable_id: 'dl-portal-3', decision: 'rechazado', comment: '  ' }),
    ).rejects.toBeInstanceOf(DomainError)
    await expect(
      reviewDeliverable({
        deliverable_id: 'dl-portal-3',
        decision: 'cambios_solicitados',
        comment: 'Falta el tamaño de archivo',
      }),
    ).resolves.toBeUndefined()
  })

  it('el dev no puede aprobar', async () => {
    setSession(AXEL)
    await expect(
      reviewDeliverable({ deliverable_id: 'dl-portal-3', decision: 'aprobado', comment: '' }),
    ).rejects.toThrow(/rol/)
  })

  it('no se revisa un entregable que no está en revisión', async () => {
    await expect(
      reviewDeliverable({
        deliverable_id: 'dl-portal-1',
        decision: 'rechazado',
        comment: 'Cambio de opinión',
      }),
    ).rejects.toThrow(/en revisión/)
  })
})

describe('solicitudes de cambio y comentarios', () => {
  it('OPA crea solicitudes y dev cambia su estatus; no al revés', async () => {
    const cr = await createChangeRequest({
      project_id: 'pr-web',
      title: 'Agregar mapa de ubicación',
      description: 'Mapa con la oficina en Cancún.',
      priority: 'baja',
    })
    expect(cr.status).toBe('nueva')
    await expect(setChangeRequestStatus({ id: cr.id, status: 'aceptada' })).rejects.toBeInstanceOf(
      DomainError,
    )

    setSession(AXEL)
    await setChangeRequestStatus({ id: cr.id, status: 'aceptada', impact_note: '+1 día' })
    await expect(
      createChangeRequest({ project_id: 'pr-web', title: 'x', description: 'y', priority: 'baja' }),
    ).rejects.toBeInstanceOf(DomainError)
  })

  it('no permite comentarios vacíos', async () => {
    await expect(
      addComment({
        project_id: 'pr-web',
        target_type: 'project',
        target_id: 'pr-web',
        body: '   ',
      }),
    ).rejects.toBeInstanceOf(DomainError)
  })
})

describe('KPIs del dashboard', () => {
  it('son coherentes con los datos', async () => {
    const kpis = await getDashboardKpis()
    expect(kpis.active_projects).toBe(4)
    expect(kpis.pending_approvals).toBe(4)
    expect(kpis.upcoming_deliveries).toBe(3)
    expect(kpis.open_change_requests).toBe(6)
  })

  it('dev cuenta también el proyecto en borrador', async () => {
    setSession(AXEL)
    expect((await getDashboardKpis()).active_projects).toBe(5)
  })
})

describe('comentarios propios: editar y borrar', () => {
  const nuevo = async (body = 'Primer comentario') => {
    await addComment({ project_id: 'pr-web', target_type: 'project', target_id: 'pr-web', body })
    const lista = await getComments('project', 'pr-web')
    return lista[lista.length - 1]!
  }
  const envejecer = (id: string, minutos: number) => {
    const c = getDb().comments.find((x) => x.id === id)!
    c.created_at = new Date(Date.now() - minutos * 60_000).toISOString()
  }

  it('el autor edita dentro de 15 minutos y queda marcado como editado', async () => {
    const c = await nuevo()
    await editComment({ id: c.id, body: '  Texto corregido ' })
    const editado = (await getComments('project', 'pr-web')).find((x) => x.id === c.id)!
    expect(editado.body).toBe('Texto corregido')
    expect(editado.edited_at).not.toBeNull()
  })

  it('después de 15 minutos ya no se puede editar ni borrar', async () => {
    const c = await nuevo()
    envejecer(c.id, 16)
    await expect(editComment({ id: c.id, body: 'Tarde' })).rejects.toThrow(/15 minutos/)
    await expect(deleteComment(c.id)).rejects.toThrow(/15 minutos/)
  })

  it('nadie más puede modificar el comentario de otro, ni el dev', async () => {
    const c = await nuevo()
    setSession(AXEL)
    await expect(editComment({ id: c.id, body: 'Intruso' })).rejects.toThrow(/propios/)
    await expect(deleteComment(c.id)).rejects.toThrow(/propios/)
  })

  it('no permite dejar el comentario vacío al editar', async () => {
    const c = await nuevo()
    await expect(editComment({ id: c.id, body: '   ' })).rejects.toBeInstanceOf(DomainError)
  })

  it('borrar lo oculta; si tiene respuestas, queda como "eliminado" sin texto', async () => {
    const raiz = await nuevo('Pregunta')
    setSession(AXEL)
    await addComment({
      project_id: 'pr-web',
      target_type: 'project',
      target_id: 'pr-web',
      body: 'Respuesta',
      parent_id: raiz.id,
    })
    setSession(ADMIN)
    await deleteComment(raiz.id)
    const lista = await getComments('project', 'pr-web')
    const borrado = lista.find((x) => x.id === raiz.id)!
    expect(borrado.deleted_at).not.toBeNull()
    expect(borrado.body).toBe('')
    expect(lista.some((x) => x.body === 'Respuesta')).toBe(true)

    // Sin respuestas, desaparece por completo.
    const suelto = await nuevo('Se va')
    await deleteComment(suelto.id)
    expect((await getComments('project', 'pr-web')).some((x) => x.id === suelto.id)).toBe(false)
  })
})

describe('captura (solo dev)', () => {
  const input = {
    slug: 'proyecto-nuevo',
    name: 'Proyecto nuevo',
    summary: 'Resumen',
    description_md: '',
    status: 'planeacion' as const,
    health: 'en_tiempo' as const,
    priority: 'media' as const,
    progress_override: null,
    start_date: '2026-01-01',
    target_date: '2026-03-01',
    is_published: false,
  }

  it('OPA no puede crear proyectos, hitos ni entradas', async () => {
    await expect(createProject(input)).rejects.toBeInstanceOf(DomainError)
    await expect(
      createUpdate({ project_id: 'x', type: 'nota', title: 'x', body_md: 'x' }),
    ).rejects.toBeInstanceOf(DomainError)
  })

  it('dev crea un proyecto borrador que OPA no ve hasta publicarlo', async () => {
    setSession(AXEL)
    const p = await createProject(input)
    setSession(ADMIN)
    expect((await getProjects()).map((x) => x.slug)).not.toContain('proyecto-nuevo')
    setSession(AXEL)
    await updateProject(p.id, { is_published: true })
    setSession(ADMIN)
    expect((await getProjects()).map((x) => x.slug)).toContain('proyecto-nuevo')
  })

  it('rechaza un identificador repetido', async () => {
    setSession(AXEL)
    await createProject(input)
    await expect(createProject(input)).rejects.toThrow(/identificador/)
  })

  it('los hitos se reordenan y el avance sale del peso de los completados', async () => {
    setSession(AXEL)
    const p = await createProject(input)
    const base = {
      project_id: p.id,
      description: '',
      start_date: '2026-01-01',
      due_date: '2026-02-01',
    }
    const a = await createMilestone({ ...base, name: 'A', weight: 1, status: 'completado' })
    const b = await createMilestone({ ...base, name: 'B', weight: 3, status: 'pendiente' })
    expect((await getMilestones(p.id)).map((m) => m.name)).toEqual(['A', 'B'])
    await reorderMilestones(p.id, [b.id, a.id])
    expect((await getMilestones(p.id)).map((m) => m.name)).toEqual(['B', 'A'])
    expect((await getProject(p.slug))?.progress).toBe(25)
  })

  it('un entregable aprobado no se edita y solo el borrador se elimina', async () => {
    setSession(AXEL)
    const approved = (await getDeliverables(PORTAL_ID)).find((d) => d.status === 'aprobado')!
    await expect(updateDeliverable(approved.id, { title: 'otro' })).rejects.toThrow(/aprobado/)
    await expect(deleteDeliverable(approved.id)).rejects.toThrow(/borrador/)
  })

  it('un dev no puede desactivar su propia cuenta', async () => {
    setSession(AXEL)
    await expect(updateProfile(AXEL, { is_active: false })).rejects.toThrow(/propia cuenta/)
    await updateProfile(ADMIN, { job_title: 'Directora' })
    expect((await getProfiles()).find((p) => p.id === ADMIN)?.job_title).toBe('Directora')
  })
})
