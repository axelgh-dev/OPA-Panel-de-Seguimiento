import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { DeliverableWithReviews, ReviewDecision } from '@/data'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { useReviewDeliverable } from './hooks'

const COPY: Record<
  ReviewDecision,
  { title: string; confirm: string; hint: string; variant: 'default' | 'destructive' | 'outline' }
> = {
  aprobado: {
    title: 'Aprobar entregable',
    confirm: 'Aprobar',
    hint: 'Opcional. Queda registrado con tu nombre y la versión aprobada.',
    variant: 'default',
  },
  cambios_solicitados: {
    title: 'Pedir cambios',
    confirm: 'Pedir cambios',
    hint: 'Explica qué debe ajustar Axel. Verá tu comentario junto al entregable.',
    variant: 'default',
  },
  rechazado: {
    title: 'Rechazar entregable',
    confirm: 'Rechazar',
    hint: 'Explica por qué no cumple lo esperado.',
    variant: 'destructive',
  },
}

export function ReviewDialog({
  deliverable,
  decision,
  onOpenChange,
}: {
  deliverable: DeliverableWithReviews
  decision: ReviewDecision | null
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={decision !== null} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {decision && (
          <ReviewForm
            key={decision}
            deliverable={deliverable}
            decision={decision}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function ReviewForm({
  deliverable,
  decision,
  onDone,
}: {
  deliverable: DeliverableWithReviews
  decision: ReviewDecision
  onDone: () => void
}) {
  const copy = COPY[decision]
  const review = useReviewDeliverable()
  // El comentario es obligatorio al rechazar o pedir cambios (§4.2).
  const schema = z.object({
    comment:
      decision === 'aprobado'
        ? z.string().trim().max(1000, 'Máximo 1,000 caracteres.')
        : z
            .string()
            .trim()
            .min(5, 'Agrega un comentario (mínimo 5 caracteres) para que Axel sepa qué corregir.')
            .max(1000, 'Máximo 1,000 caracteres.'),
  })
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { comment: '' },
  })

  function onSubmit(values: z.infer<typeof schema>) {
    review.mutate(
      { deliverable_id: deliverable.id, decision, comment: values.comment },
      { onSuccess: onDone },
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-primary">{copy.title}</DialogTitle>
          <DialogDescription>
            {deliverable.title} · versión {deliverable.version}
          </DialogDescription>
        </DialogHeader>

        <FormField
          control={form.control}
          name="comment"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {decision === 'aprobado' ? 'Comentario (opcional)' : 'Comentario'}
              </FormLabel>
              <FormControl>
                <Textarea rows={4} autoFocus {...field} />
              </FormControl>
              <FormDescription>{copy.hint}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {review.isError && (
          <p role="alert" className="text-sm text-danger-ink">
            {review.error.message}
          </p>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onDone}>
            Cancelar
          </Button>
          <Button type="submit" variant={copy.variant} disabled={review.isPending}>
            {review.isPending ? 'Guardando…' : copy.confirm}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}
