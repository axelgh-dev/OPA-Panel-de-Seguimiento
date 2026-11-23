import { Fragment, useState } from 'react'
import type { CommentWithAuthor } from '@/data'
import { DateLabel } from '@/components/shared/DateLabel'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { canModifyComment } from '@/lib/permissions'
import { useSession } from '@/lib/session'
import { useDeleteComment, useEditComment } from './hooks'

/** Texto plano con saltos de línea y menciones simples (@Axel). */
function CommentBody({ text }: { text: string }) {
  const parts = text.split(/(@[\p{L}\p{N}]+)/gu)
  return (
    <p className="whitespace-pre-wrap break-words text-foreground">
      {parts.map((part, i) =>
        part.startsWith('@') ? (
          <span key={i} className="font-medium text-primary">
            {part}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </p>
  )
}

const LINK_BUTTON = 'rounded text-xs font-medium text-primary hover:underline'

export function CommentItem({
  comment,
  onReply,
  isReply,
}: {
  comment: CommentWithAuthor
  onReply?: () => void
  isReply?: boolean
}) {
  const { user } = useSession()
  const [mode, setMode] = useState<'view' | 'edit' | 'confirm-delete'>('view')
  const [draft, setDraft] = useState(comment.body)
  const edit = useEditComment()
  const remove = useDeleteComment()
  const deleted = comment.deleted_at !== null
  // La ventana de 15 min se evalúa al renderizar; la capa de datos la vuelve a validar al guardar.
  const canModify = canModifyComment(user.role, user.id, comment)
  const error = edit.error?.message ?? remove.error?.message

  function save() {
    edit.mutate({ id: comment.id, body: draft }, { onSuccess: () => setMode('view') })
  }

  return (
    <div className="flex gap-3">
      <UserAvatar user={comment.author} size={isReply ? 'sm' : 'md'} />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm">
          <span className="font-medium">{comment.author.full_name}</span>
          <span className="text-muted-foreground">
            {comment.author.job_title ? ` · ${comment.author.job_title} · ` : ' · '}
          </span>
          <DateLabel value={comment.created_at} mode="relative" className="text-muted-foreground" />
          {comment.edited_at && !deleted && (
            <span className="text-muted-foreground"> · editado</span>
          )}
        </p>

        {deleted ? (
          <p className="text-sm italic text-muted-foreground">Comentario eliminado</p>
        ) : mode === 'edit' ? (
          <div className="space-y-2">
            <Textarea
              aria-label="Editar comentario"
              rows={3}
              autoFocus
              className="bg-card"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={save}
                disabled={edit.isPending || draft.trim().length === 0}
              >
                {edit.isPending ? 'Guardando…' : 'Guardar'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setMode('view')
                  setDraft(comment.body)
                  edit.reset()
                }}
              >
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <CommentBody text={comment.body} />
        )}

        {mode === 'confirm-delete' && (
          <div className="flex flex-wrap items-center gap-3 rounded-md bg-danger-soft px-3 py-2 text-sm text-danger-ink">
            ¿Eliminar este comentario?
            <Button
              size="sm"
              variant="destructive"
              onClick={() => remove.mutate(comment.id, { onSuccess: () => setMode('view') })}
              disabled={remove.isPending}
            >
              {remove.isPending ? 'Eliminando…' : 'Eliminar'}
            </Button>
            <Button size="sm" variant="outline" className="bg-card" onClick={() => setMode('view')}>
              Cancelar
            </Button>
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-danger-ink">
            {error}
          </p>
        )}

        {!deleted && mode === 'view' && (
          <p className="flex flex-wrap gap-x-3">
            {onReply && (
              <button type="button" onClick={onReply} className={LINK_BUTTON}>
                Responder
              </button>
            )}
            {canModify && (
              <>
                <button type="button" onClick={() => setMode('edit')} className={LINK_BUTTON}>
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => setMode('confirm-delete')}
                  className={LINK_BUTTON}
                >
                  Eliminar
                </button>
              </>
            )}
          </p>
        )}
      </div>
    </div>
  )
}
