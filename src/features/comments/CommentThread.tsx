import { zodResolver } from '@hookform/resolvers/zod'
import { MessageSquare } from 'lucide-react'
import { Fragment, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { CommentTarget, CommentWithAuthor } from '@/data'
import { DateLabel } from '@/components/shared/DateLabel'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { RoleGate } from '@/components/shared/RoleGate'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useAddComment, useComments } from './hooks'

const schema = z.object({
  body: z
    .string()
    .trim()
    .min(1, 'Escribe un comentario antes de enviarlo.')
    .max(2000, 'Máximo 2,000 caracteres.'),
})

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

function CommentItem({
  comment,
  onReply,
  isReply,
}: {
  comment: CommentWithAuthor
  onReply?: () => void
  isReply?: boolean
}) {
  return (
    <div className="flex gap-3">
      <UserAvatar user={comment.author} size={isReply ? 'sm' : 'md'} />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm">
          <span className="font-medium">{comment.author.full_name}</span>
          <span className="text-muted-foreground"> · {comment.author.job_title} · </span>
          <DateLabel value={comment.created_at} mode="relative" className="text-muted-foreground" />
        </p>
        <CommentBody text={comment.body} />
        {onReply && (
          <button
            type="button"
            onClick={onReply}
            className="rounded text-xs font-medium text-primary hover:underline"
          >
            Responder
          </button>
        )}
      </div>
    </div>
  )
}

export function CommentThread({
  projectId,
  targetType,
  targetId,
  placeholder = 'Escribe un comentario. Usa @Axel para mencionarlo.',
}: {
  projectId: string
  targetType: CommentTarget
  targetId: string
  placeholder?: string
}) {
  const query = useComments(targetType, targetId)
  const add = useAddComment()
  const [replyTo, setReplyTo] = useState<CommentWithAuthor | null>(null)
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { body: '' },
  })

  const roots = (query.data ?? []).filter((c) => c.parent_id === null)
  const repliesOf = (id: string) => (query.data ?? []).filter((c) => c.parent_id === id)

  function onSubmit(values: z.infer<typeof schema>) {
    add.mutate(
      {
        project_id: projectId,
        target_type: targetType,
        target_id: targetId,
        body: values.body,
        // Un solo nivel de respuesta (§4.4): responder a una respuesta cuelga del comentario raíz.
        parent_id: replyTo ? (replyTo.parent_id ?? replyTo.id) : null,
      },
      {
        onSuccess: () => {
          form.reset({ body: '' })
          setReplyTo(null)
        },
      },
    )
  }

  return (
    <div className="space-y-5">
      {query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : query.isLoading ? (
        <div className="space-y-4">
          {[0, 1].map((i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <Skeleton className="h-12 flex-1" />
            </div>
          ))}
        </div>
      ) : roots.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="Aún no hay comentarios"
          description="Sé el primero en escribir."
          className="py-8"
        />
      ) : (
        <ul className="space-y-5">
          {roots.map((c) => (
            <li key={c.id} className="space-y-4">
              <CommentItem comment={c} onReply={() => setReplyTo(c)} />
              {repliesOf(c.id).length > 0 && (
                <ul className="ml-4 space-y-4 border-l-2 border-gold-100 pl-5 sm:ml-11">
                  {repliesOf(c.id).map((r) => (
                    <li key={r.id}>
                      <CommentItem comment={r} isReply onReply={() => setReplyTo(r)} />
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}

      <RoleGate action="comment.create">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2" noValidate>
            {replyTo && (
              <p className="flex items-center justify-between rounded-md bg-muted px-3 py-1.5 text-xs text-muted-foreground">
                Respondiendo a {replyTo.author.full_name}
                <button
                  type="button"
                  onClick={() => setReplyTo(null)}
                  className="rounded font-medium text-primary hover:underline"
                >
                  Cancelar
                </button>
              </p>
            )}
            <FormField
              control={form.control}
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      aria-label="Comentario"
                      rows={3}
                      placeholder={placeholder}
                      className="bg-card"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {add.isError && (
              <p role="alert" className="text-sm text-danger-ink">
                {add.error.message}
              </p>
            )}
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={add.isPending}>
                {add.isPending ? 'Enviando…' : 'Comentar'}
              </Button>
            </div>
          </form>
        </Form>
      </RoleGate>
    </div>
  )
}
