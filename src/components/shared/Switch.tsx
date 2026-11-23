import { cn } from '@/lib/utils'

/** Interruptor accesible (role="switch") para opciones sí/no. */
export function Switch({
  checked,
  onCheckedChange,
  id,
  'aria-describedby': describedBy,
  disabled,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  id?: string
  'aria-describedby'?: string
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-describedby={describedBy}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'border-primary bg-primary' : 'border-input bg-muted',
      )}
    >
      <span
        aria-hidden
        className={cn(
          'inline-block h-4 w-4 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-6' : 'translate-x-1',
        )}
      />
    </button>
  )
}
