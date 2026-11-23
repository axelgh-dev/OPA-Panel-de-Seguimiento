import {
  differenceInCalendarDays,
  differenceInHours,
  differenceInMinutes,
  format,
  parseISO,
} from 'date-fns'
import { es } from 'date-fns/locale'

/** Acepta 'YYYY-MM-DD' (se interpreta en hora local) o un ISO con hora. */
function toDate(value: string | Date): Date {
  return typeof value === 'string' ? parseISO(value) : value
}

/** `23 nov 2026` */
export function formatDate(value: string | Date): string {
  return format(toDate(value), 'd MMM yyyy', { locale: es }).replace('.', '')
}

/** `23 nov 2026, 14:30` */
export function formatDateTime(value: string | Date): string {
  return format(toDate(value), 'd MMM yyyy, HH:mm', { locale: es }).replace('.', '')
}

function plural(n: number, singular: string, pluralForm: string): string {
  return `${n} ${n === 1 ? singular : pluralForm}`
}

/** Para fechas sin hora: `hoy`, `mañana`, `en 5 días`, `ayer`, `hace 3 días`. */
export function formatDaysFromNow(value: string | Date, now: Date = new Date()): string {
  const days = differenceInCalendarDays(toDate(value), now)
  if (days === 0) return 'hoy'
  if (days === 1) return 'mañana'
  if (days === -1) return 'ayer'
  return days > 0 ? `en ${days} días` : `hace ${-days} días`
}

/** Para marcas con hora: `hace un momento`, `hace 2 h`, `hace 3 días`, `en 5 días`. */
export function formatRelative(value: string | Date, now: Date = new Date()): string {
  const date = toDate(value)
  const minutes = differenceInMinutes(now, date)
  if (minutes < 0) {
    // Futuro: con hora si es el mismo día, si no por días.
    const ahead = -minutes
    if (ahead < 60) return `en ${ahead} min`
    if (differenceInCalendarDays(date, now) === 0) return `en ${Math.floor(ahead / 60)} h`
    return formatDaysFromNow(date, now)
  }
  if (minutes < 1) return 'hace un momento'
  if (minutes < 60) return `hace ${minutes} min`
  const hours = differenceInHours(now, date)
  if (hours < 24) return `hace ${hours} h`
  const days = differenceInCalendarDays(now, date)
  if (days === 1) return 'ayer'
  if (days < 30) return `hace ${days} días`
  return formatDate(date)
}

/** `3 de 5 hitos` */
export function formatCount(n: number, singular: string, pluralForm: string): string {
  return plural(n, singular, pluralForm)
}
