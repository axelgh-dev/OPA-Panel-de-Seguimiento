import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { getDemo } from '@/data'
import { renderAs } from '@/test/utils'
import { DashboardPage } from './DashboardPage'

beforeEach(() => getDemo().resetDb())

describe('DashboardPage', () => {
  it('OPA: KPIs y 4 proyectos publicados', async () => {
    renderAs('u-admin', <DashboardPage />)

    expect(screen.getByRole('heading', { name: 'Hola, Admin OPA' })).toBeInTheDocument()
    // Mientras carga hay esqueletos; luego aparecen las tarjetas.
    expect(await screen.findByRole('heading', { name: /Portal de clientes/ })).toBeInTheDocument()

    const porAprobar = screen.getByText('Por aprobar').closest('div')!
    expect(await within(porAprobar).findByText('4')).toBeInTheDocument()

    expect(screen.getAllByRole('article')).toHaveLength(4)
    // El borrador no se ve para OPA.
    expect(screen.queryByText(/Tablero de indicadores/)).not.toBeInTheDocument()
  })

  it('dev: ve también el proyecto en borrador', async () => {
    renderAs('u-axel', <DashboardPage />)
    await waitFor(() => expect(screen.getAllByRole('article')).toHaveLength(5))
    expect(screen.getByText(/Tablero de indicadores/)).toBeInTheDocument()
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
