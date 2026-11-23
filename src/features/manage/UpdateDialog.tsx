import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { ProjectUpdate } from '@/data'
import { MarkdownField } from '@/components/shared/MarkdownField'
import { MetaSelectItems } from '@/components/shared/MetaSelectItems'
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UPDATE_TYPE } from '@/lib/labels'
import { errorMessage } from './fields'
import { useCreateUpdate, useUpdateUpdate } from './hooks'

const schema = z.object({
  type: z.enum(['avance', 'entrega', 'bloqueo', 'nota', 'reunion']),
  title: z.string().trim().min(3, 'Escribe un título (mínimo 3 letras).').max(160),
  body_md: z.string().trim().min(1, 'Escribe el contenido de la entrada.').max(10000),
})
type Values = z.infer<typeof schema>

/** Publica o edita una entrada de la bitácora (solo dev). */
export function UpdateDialog({
  open,
  onOpenChange,
  projectId,
  update,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  update?: Pick<ProjectUpdate, 'id' | 'type' | 'title' | 'body_md'>
}) {
  const create = useCreateUpdate()
  const edit = useUpdateUpdate()
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: update?.type ?? 'avance',
      title: update?.title ?? '',
      body_md: update?.body_md ?? '',
    },
  })
  const pending = create.isPending || edit.isPending
  const error = errorMessage(create.error ?? edit.error)

  async function onSubmit(v: Values) {
    const fields = { type: v.type, title: v.title.trim(), body_md: v.body_md.trim() }
    if (update) await edit.mutateAsync({ id: update.id, patch: fields })
    else await create.mutateAsync({ project_id: projectId, ...fields })
    form.reset()
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          create.reset()
          edit.reset()
        }
        onOpenChange(next)
      }}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => void onSubmit(v).catch(() => undefined))}
            className="space-y-4"
            noValidate
          >
            <DialogHeader>
              <DialogTitle className="font-serif text-xl text-primary">
                {update ? 'Editar entrada' : 'Nueva entrada de bitácora'}
              </DialogTitle>
              <DialogDescription>
                {update
                  ? 'El despacho verá el texto actualizado.'
                  : 'Se publica al guardar: el despacho la ve de inmediato.'}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 sm:grid-cols-[11rem_1fr]">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <MetaSelectItems map={UPDATE_TYPE} />
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. Terminé la carga de documentos" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="body_md"
              render={({ field, fieldState }) => (
                <FormItem>
                  <MarkdownField
                    label="Contenido"
                    value={field.value}
                    onChange={field.onChange}
                    invalid={!!fieldState.error}
                    rows={10}
                    placeholder="Qué se hizo, qué sigue y qué necesitas del despacho."
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            {error && (
              <p role="alert" className="text-sm text-danger-ink">
                {error}
              </p>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? 'Guardando…' : update ? 'Guardar cambios' : 'Publicar entrada'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
