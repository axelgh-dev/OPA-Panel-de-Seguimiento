import { formatDate, formatDateTime, formatDaysFromNow, formatRelative } from '@/lib/format'

/**
 * Fecha accesible: `<time>` con la fecha completa en el tooltip.
 * - date: `23 nov 2026`  - days: `en 5 días` (fechas sin hora)  - relative: `hace 2 h` (con hora)
 */
export function DateLabel({
  value,
  mode = 'date',
  className,
}: {
  value: string
  mode?: 'date' | 'days' | 'relative'
  className?: string
}) {
  const text =
    mode === 'days'
      ? formatDaysFromNow(value)
      : mode === 'relative'
        ? formatRelative(value)
        : formatDate(value)
  return (
    <time
      dateTime={value}
      title={value.length > 10 ? formatDateTime(value) : formatDate(value)}
      className={className}
    >
      {text}
    </time>
  )
}
