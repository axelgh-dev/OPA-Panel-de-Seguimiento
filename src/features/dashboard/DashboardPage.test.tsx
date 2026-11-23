import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { resetDb } from '@/data'
import { renderAs } from '@/test/utils'
import { DashboardPage } from './DashboardPage'

beforeEach(() => resetDb())

describe('DashboardPage', () => {
  it('OPA: KPIs, atención por aprobar y 4 proyectos publicados', async () => {
    renderAs('u-admin', <DashboardPage />)

    expect(screen.getByRole('heading', { name: 'Hola, Admin OPA' })).toBeInTheDocument()
    // Mientras carga hay esqueletos; luego aparecen las tarjetas.
    expect(await screen.findByRole('heading', { name: /Portal de clientes/ })).toBeInTheDocument()

    const kpis = screen.getByText('Por aprobar').closest('div')!
    expect(within(kpis).getByText('4')).toBeInTheDocument()

    const atencion = screen.getByRole('region', { name: 'Requiere tu atención' })
    await within(atencion).findByText('Pantalla de carga de documentos')
    expect(within(atencion).getAllByText(/esperando tu aprobación/).length).toBe(4)

    expect(screen.getAllByRole('article')).toHaveLength(4)
    // El borrador no se ve para OPA.
    expect(screen.queryByText(/Tablero de indicadores/)).not.toBeInTheDocument()
  })

  it('dev: ve el borrador y su propio bloque de atención', async () => {
    renderAs('u-axel', <DashboardPage />)
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(5))
    expect(screen.getByText(/Tablero de indicadores/)).toBeInTheDocument()
    const atencion = screen.getByRole('region', { name: 'Requiere tu atención' })
    const nuevas = await within(atencion).findAllByText(/Solicitud de cambio nueva/)
    expect(nuevas).toHaveLength(2)
    expect(within(atencion).queryByText(/esperando tu aprobación/)).not.toBeInTheDocument()
  })

  it('el filtro de búsqueda reduce las tarjetas y muestra el estado vacío', async () => {
    const user = userEvent.setup()
    renderAs('u-admin', <DashboardPage />)
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(4))

    await user.type(screen.getByLabelText('Buscar proyecto por nombre'), 'conciliaciones')
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(1))

    await user.clear(screen.getByLabelText('Buscar proyecto por nombre'))
    await user.type(screen.getByLabelText('Buscar proyecto por nombre'), 'zzz')
    expect(await screen.findByText('Ningún proyecto coincide con los filtros')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Quitar filtros' }))
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(4))
  })
})
