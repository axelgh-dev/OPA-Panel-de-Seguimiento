import { formatDate, formatDateTime, formatDaysFromNow, formatRelative } from './format'

// Referencia fija: domingo 22 de noviembre de 2026, 12:00 (hora local).
const NOW = new Date(2026, 10, 22, 12, 0, 0)

describe('formatDate (locale es)', () => {
  it('usa día, mes abreviado en español y año', () => {
    expect(formatDate('2026-11-23')).toBe('23 nov 2026')
    expect(formatDate('2026-01-05')).toBe('5 ene 2026')
    expect(formatDate('2026-12-31')).toBe('31 dic 2026')
  })

  it('acepta objetos Date e ISO con hora', () => {
    expect(formatDate(new Date(2026, 7, 9))).toBe('9 ago 2026')
    expect(formatDate(new Date(2026, 10, 23, 18, 30).toISOString())).toBe('23 nov 2026')
  })

  it('formatDateTime agrega la hora en 24 h', () => {
    expect(formatDateTime(new Date(2026, 10, 23, 14, 5))).toBe('23 nov 2026, 14:05')
  })
})

describe('formatDaysFromNow (fechas sin hora)', () => {
  it.each([
    ['2026-11-22', 'hoy'],
    ['2026-11-23', 'mañana'],
    ['2026-11-27', 'en 5 días'],
    ['2026-11-21', 'ayer'],
    ['2026-11-16', 'hace 6 días'],
  ])('%s → %s', (date, expected) => {
    expect(formatDaysFromNow(date, NOW)).toBe(expected)
  })
})

describe('formatRelative (con hora)', () => {
  const ago = (ms: number) => new Date(NOW.getTime() - ms)
  const MIN = 60_000
  const H = 3_600_000

  it('muestra minutos, horas y días hacia atrás', () => {
    expect(formatRelative(ago(30_000), NOW)).toBe('hace un momento')
    expect(formatRelative(ago(15 * MIN), NOW)).toBe('hace 15 min')
    expect(formatRelative(ago(2 * H), NOW)).toBe('hace 2 h')
    expect(formatRelative(new Date(2026, 10, 21, 10), NOW)).toBe('ayer')
    expect(formatRelative(new Date(2026, 10, 17, 10), NOW)).toBe('hace 5 días')
  })

  it('pasado el mes vuelve a la fecha completa', () => {
    expect(formatRelative(new Date(2026, 8, 1, 10), NOW)).toBe('1 sep 2026')
  })

  it('soporta fechas futuras', () => {
    expect(formatRelative(new Date(2026, 10, 27, 12), NOW)).toBe('en 5 días')
    expect(formatRelative(new Date(NOW.getTime() + 20 * MIN), NOW)).toBe('en 20 min')
  })
})
