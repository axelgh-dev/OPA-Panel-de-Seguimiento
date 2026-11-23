import type { MilestoneSegment } from '@/data'
import { cn } from '@/lib/utils'

const SEGMENT: Record<MilestoneSegment['status'], string> = {
  completado: 'bg-gold-500',
  en_curso: 'bg-gold-500/40 ring-1 ring-inset ring-gold-500',
  retrasado: 'bg-danger/70',
  pendiente: 'bg-[hsl(45_14%_90%)]',
}

/**
 * Barra de avance segmentada: un segmento por hito, de ancho proporcional a su peso.
 * Así el % se ve como lo que es: la suma del peso de los hitos completados.
 */
export function SegmentedProgress({
  segments,
  progress,
  size = 'md',
  className,
}: {
  segments: MilestoneSegment[]
  progress: number
  size?: 'sm' | 'md'
  className?: string
}) {
  const done = segments.filter((s) => s.status === 'completado').length
  const label = `Avance ${progress}%: ${done} de ${segments.length} hitos completados`
  return (
    <div
      role="img"
      aria-label={label}
      className={cn('flex w-full gap-[3px]', size === 'sm' ? 'h-2' : 'h-2.5', className)}
    >
      {segments.map((s) => (
        <span
          key={s.id}
          title={`${s.name} (peso ${s.weight})`}
          style={{ flexGrow: s.weight, flexBasis: 0 }}
          className={cn('rounded-[3px]', SEGMENT[s.status])}
        />
      ))}
    </div>
  )
}
