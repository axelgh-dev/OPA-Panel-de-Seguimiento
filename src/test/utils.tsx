import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { AppProviders } from '@/app/providers'

/** Renderiza con router en memoria, TanStack Query y el usuario indicado ("Ver como"). */
export function renderAs(userId: string, ui: ReactElement, route = '/') {
  return render(
    <AppProviders initialUserId={userId}>
      <MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>
    </AppProviders>,
  )
}
