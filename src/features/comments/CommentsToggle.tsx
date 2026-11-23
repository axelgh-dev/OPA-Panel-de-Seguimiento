import { ChevronDown, MessageSquare } from 'lucide-react'
import { useId, useState } from 'react'
import type { CommentTarget } from '@/data'
import { cn } from '@/lib/utils'
import { CommentThread } from './CommentThread'

/** Botón "Comentarios (n)" que despliega el hilo (solo se consulta al abrirlo). */
export function CommentsToggle({
  projectId,
  targetType,
  targetId,
  count,
}: {
  projectId: string
  targetType: CommentTarget
  targetId: string
  count?: number
}) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded text-sm font-medium text-primary hover:underline"
      >
        <MessageSquare aria-hidden className="h-4 w-4" strokeWidth={1.5} />
        {count === undefined ? 'Comentarios' : count === 0 ? 'Comentar' : `Comentarios (${count})`}
        <ChevronDown
          aria-hidden
          className={cn('h-4 w-4 transition-transform', open && 'rotate-180')}
          strokeWidth={1.5}
        />
      </button>
      {open && (
        <div id={panelId} className="mt-4 border-t pt-4">
          <CommentThread projectId={projectId} targetType={targetType} targetId={targetId} />
        </div>
      )}
    </div>
  )
}
