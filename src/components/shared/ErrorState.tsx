import { TriangleAlert } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** Los errores explican qué pasó y cómo seguir; no se disculpan. */
export function ErrorState({
  title = 'No pudimos cargar esta información',
  description = 'Revisa tu conexión e inténtalo de nuevo.',
  onRetry,
  className,
}: {
  title?: string
  description?: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center gap-2 rounded-xl border border-danger/30 bg-danger-soft px-6 py-10 text-center',
        className,
      )}
    >
      <TriangleAlert aria-hidden className="h-6 w-6 text-danger" strokeWidth={1.5} />
      <p className="font-medium text-danger-ink">{title}</p>
      <p className="max-w-sm text-danger-ink/90">{description}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-2 bg-card" onClick={onRetry}>
          Reintentar
        </Button>
      )}
    </div>
  )
}
