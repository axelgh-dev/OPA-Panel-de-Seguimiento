import { computeProgress } from './progress'

describe('computeProgress', () => {
  it('pondera por el peso de los hitos completados', () => {
    expect(
      computeProgress([
        { weight: 1, status: 'completado' },
        { weight: 2, status: 'completado' },
        { weight: 3, status: 'en_curso' },
        { weight: 2, status: 'pendiente' },
        { weight: 2, status: 'pendiente' },
      ]),
    ).toBe(30)
  })

  it('un hito pesado cambia más el avance que varios ligeros', () => {
    const pesado = [
      { weight: 5, status: 'completado' as const },
      { weight: 1, status: 'pendiente' as const },
      { weight: 1, status: 'pendiente' as const },
    ]
    const ligeros = [
      { weight: 1, status: 'completado' as const },
      { weight: 1, status: 'completado' as const },
      { weight: 5, status: 'pendiente' as const },
    ]
    expect(computeProgress(pesado)).toBe(71)
    expect(computeProgress(ligeros)).toBe(29)
  })

  it('los hitos retrasados y en curso no suman', () => {
    expect(
      computeProgress([
        { weight: 1, status: 'retrasado' },
        { weight: 1, status: 'en_curso' },
      ]),
    ).toBe(0)
  })

  it('devuelve 0 sin hitos o con peso total cero', () => {
    expect(computeProgress([])).toBe(0)
    expect(computeProgress([{ weight: 0, status: 'completado' }])).toBe(0)
  })

  it('usa el override cuando existe, acotado a 0–100', () => {
    const ms = [{ weight: 1, status: 'pendiente' as const }]
    expect(computeProgress(ms, 45)).toBe(45)
    expect(computeProgress(ms, 140)).toBe(100)
    expect(computeProgress(ms, -5)).toBe(0)
    expect(computeProgress(ms, 0)).toBe(0)
  })

  it('redondea al entero más cercano', () => {
    expect(
      computeProgress([
        { weight: 1, status: 'completado' },
        { weight: 2, status: 'pendiente' },
      ]),
    ).toBe(33)
  })
})
