import { cn } from './utils'

describe('cn', () => {
  it('combina clases y resuelve conflictos de Tailwind', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
  })

  it('ignora valores falsos', () => {
    const activo = false
    expect(cn('a', activo && 'b', undefined, 'c')).toBe('a c')
  })
})
