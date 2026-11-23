import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { ChangeRequestWithMeta } from '@/data'
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
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MetaSelectItems } from '@/components/shared/MetaSelectItems'
import { Textarea } from '@/components/ui/textarea'
import { CHANGE_REQ_STATUS } from '@/lib/labels'
import { useSetChangeRequestStatus } from './hooks'

const schema = z.object({
  status: z.enum(['nueva', 'en_analisis', 'aceptada', 'rechazada', 'en_progreso', 'completada']),
  impact_note: z.string().trim().max(500, 'Máximo 500 caracteres.'),
})
type Values = z.infer<typeof schema>

/** Solo dev: cambia el estatus de una solicitud y registra la estimación de impacto. */
export function ChangeRequestStatusDialog({
  request,
  open,
  onOpenChange,
}: {
  request: ChangeRequestWithMeta
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const set = useSetChangeRequestStatus()
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { status: request.status, impact_note: request.impact_note ?? '' },
  })
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) =>
              set.mutate(
                { id: request.id, status: v.status, impact_note: v.impact_note },
                { onSuccess: () => onOpenChange(false) },
              ),
            )}
            className="space-y-4"
            noValidate
          >
            <DialogHeader>
              <DialogTitle className="font-serif text-xl text-primary">
                Responder solicitud
              </DialogTitle>
              <DialogDescription>{request.title}</DialogDescription>
            </DialogHeader>
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estatus</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <MetaSelectItems map={CHANGE_REQ_STATUS} />
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="impact_note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Impacto estimado</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Ej. +3 días y sin costo adicional" {...field} />
                  </FormControl>
                  <FormDescription>
                    Texto libre. El despacho lo verá junto a la solicitud.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {set.isError && (
              <p role="alert" className="text-sm text-danger-ink">
                {set.error.message}
              </p>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={set.isPending}>
                {set.isPending ? 'Guardando…' : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
