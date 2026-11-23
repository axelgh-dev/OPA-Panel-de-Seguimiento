import {
  DomainError,
  addComment,
  createChangeRequest,
  getDashboardKpis,
  getDeliverables,
  getProject,
  getProjects,
  getTasks,
  resetDb,
  reviewDeliverable,
  setChangeRequestStatus,
  setSession,
} from '.'

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
