import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useProjects } from '@/features/dashboard/hooks'
import { PRIORITY } from '@/lib/labels'
import { useCreateChangeRequest } from './hooks'

const schema = z.object({
  project_id: z.string().min(1, 'Elige el proyecto.'),
  title: z
    .string()
    .trim()
    .min(5, 'Escribe un título de al menos 5 caracteres.')
    .max(120, 'Máximo 120 caracteres.'),
  description: z
    .string()
    .trim()
    .min(15, 'Describe el cambio con al menos 15 caracteres.')
    .max(2000, 'Máximo 2,000 caracteres.'),
  priority: z.enum(['alta', 'media', 'baja']),
})
type Values = z.infer<typeof schema>

export function ChangeRequestDialog({
  open,
  onOpenChange,
  fixedProjectId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Si se abre desde el detalle de un proyecto, el proyecto ya viene elegido. */
  fixedProjectId?: string
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {open && (
          <ChangeRequestFormBody
            fixedProjectId={fixedProjectId}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

function ChangeRequestFormBody({
  fixedProjectId,
  onDone,
}: {
  fixedProjectId?: string
  onDone: () => void
}) {
  const projects = useProjects({ sort: 'prioridad' })
  const create = useCreateChangeRequest()
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      project_id: fixedProjectId ?? '',
      title: '',
      description: '',
      priority: 'media',
    },
  })

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((v) => create.mutate(v, { onSuccess: onDone }))}
        className="space-y-4"
        noValidate
      >
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-primary">
            Nueva solicitud de cambio
          </DialogTitle>
          <DialogDescription>
            Axel la revisará y te responderá con el impacto estimado.
          </DialogDescription>
        </DialogHeader>

        {!fixedProjectId && (
          <FormField
            control={form.control}
            name="project_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Proyecto</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Elige un proyecto" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {projects.data?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Título</FormLabel>
              <FormControl>
                <Input placeholder="Ej. Agregar filtro por ejercicio fiscal" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Qué necesitan y por qué</FormLabel>
              <FormControl>
                <Textarea rows={4} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="priority"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prioridad</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(PRIORITY).map(([k, m]) => (
                    <SelectItem key={k} value={k}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />

        {create.isError && (
          <p role="alert" className="text-sm text-danger-ink">
            {create.error.message}
          </p>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onDone}>
            Cancelar
          </Button>
          <Button type="submit" disabled={create.isPending}>
            {create.isPending ? 'Enviando…' : 'Enviar solicitud'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}
