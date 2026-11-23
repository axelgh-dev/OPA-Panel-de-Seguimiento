import { Skeleton } from '@/components/ui/skeleton'

/** Se muestra solo mientras se descarga la primera página. */
export function InitialFallback() {
  return (
    <div className="p-8" role="status" aria-label="Cargando">
      <Skeleton className="mb-4 h-9 w-64" />
      <Skeleton className="h-32 w-full max-w-3xl" />
    </div>
  )
}
