import { addDays, format } from 'date-fns'

/** Fecha 'YYYY-MM-DD' desplazada `n` días desde hoy (negativo = pasado). */
export function d(n: number): string {
  return format(addDays(new Date(), n), 'yyyy-MM-dd')
}

/** ISO con hora, desplazado `n` días desde hoy, a la hora local indicada. */
export function t(n: number, hour = 10, minute = 0): string {
  const x = addDays(new Date(), n)
  x.setHours(hour, minute, 0, 0)
  // Un evento "de hoy" o pasado nunca debe quedar en el futuro (p. ej. si se abre temprano).
  if (n <= 0 && x.getTime() > Date.now()) return hoursAgo(1)
  return x.toISOString()
}

/** ISO con hora, hace `h` horas. */
export function hoursAgo(h: number): string {
  return new Date(Date.now() - h * 3_600_000).toISOString()
}
