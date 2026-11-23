import { zodResolver } from '@hookform/resolvers/zod'
import { Paperclip } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { filesEnabled, type Deliverable, type Milestone } from '@/data'
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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { errorMessage } from './fields'
import { useCreateDeliverable, useUpdateDeliverable, useUploadDeliverableFile } from './hooks'

const NO_MILESTONE = 'none'
const MAX_MB = 20

const schema = z.object({
  title: z.string().trim().min(3, 'Escribe el nombre del entregable.').max(160),
  description: z.string().trim().max(1000, 'Máximo 1,000 caracteres.'),
  milestone_id: z.string(),
  version: z
    .string()
    .regex(/^\d{1,3}$/, 'Escribe un número entero, por ejemplo 1.')
    .refine((v) => Number(v) >= 1, 'La versión empieza en 1.'),
  link_url: z
    .string()
    .trim()
    .refine((v) => v === '' || /^https?:\/\/\S+$/i.test(v), 'El enlace debe empezar con https://'),
})
type Values = z.infer<typeof schema>

/** Alta y edición de un entregable (solo dev). Un entregable aprobado ya no se edita. */
export function DeliverableDialog({
  open,
  onOpenChange,
  projectId,
  milestones,
  deliverable,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  milestones: Milestone[]
  deliverable?: Deliverable
}) {
  const create = useCreateDeliverable()
  const update = useUpdateDeliverable()
  const upload = useUploadDeliverableFile()
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  // Si el archivo falla después de guardar, el reintento edita el entregable ya creado.
  const [savedId, setSavedId] = useState<string | null>(null)

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: deliverable?.title ?? '',
      description: deliverable?.description ?? '',
      milestone_id: deliverable?.milestone_id ?? NO_MILESTONE,
      version: String(deliverable?.version ?? 1),
      link_url: deliverable?.link_url ?? '',
    },
  })
  const pending = create.isPending || update.isPending || upload.isPending
  const error = errorMessage(create.error ?? update.error ?? upload.error)

  function pickFile(f: File | null) {
    if (f && f.size > MAX_MB * 1024 * 1024) {
      setFile(null)
      setFileError(
        `El archivo pesa más de ${MAX_MB} MB. Súbelo a Drive o similar y pega el enlace.`,
      )
      return
    }
    setFileError(null)
    setFile(f)
  }

  async function onSubmit(v: Values) {
    const fields = {
      milestone_id: v.milestone_id === NO_MILESTONE ? null : v.milestone_id,
      title: v.title.trim(),
      description: v.description.trim(),
      version: Number(v.version),
      link_url: v.link_url.trim() === '' ? null : v.link_url.trim(),
    }
    const existingId = deliverable?.id ?? savedId
    let id = existingId
    if (existingId) {
      await update.mutateAsync({ id: existingId, patch: fields })
    } else {
      id = (await create.mutateAsync({ project_id: projectId, ...fields })).id
      setSavedId(id)
    }
    if (file && id) await upload.mutateAsync({ id, file })
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          create.reset()
          update.reset()
          upload.reset()
        }
        onOpenChange(next)
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => void onSubmit(v).catch(() => undefined))}
            className="space-y-4"
            noValidate
          >
            <DialogHeader>
              <DialogTitle className="font-serif text-xl text-primary">
                {deliverable ? 'Editar entregable' : 'Nuevo entregable'}
              </DialogTitle>
              <DialogDescription>
                Se guarda como borrador: el despacho no lo ve hasta que lo envíes a revisión.
              </DialogDescription>
            </DialogHeader>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Prototipo del portal" {...field} />
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
                  <FormLabel>Qué se entrega</FormLabel>
                  <FormControl>
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-[1fr_7rem]">
              <FormField
                control={form.control}
                name="milestone_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hito</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={NO_MILESTONE}>Sin hito</SelectItem>
                        {milestones.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="version"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Versión</FormLabel>
                    <FormControl>
                      <Input inputMode="numeric" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="link_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Enlace (opcional)</FormLabel>
                  <FormControl>
                    <Input type="url" placeholder="https://drive.google.com/…" {...field} />
                  </FormControl>
                  <FormDescription>Drive, Figma, un ambiente de pruebas, etc.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {filesEnabled && (
              <div className="space-y-2">
                <label htmlFor="deliverable-file" className="text-sm font-medium">
                  Archivo (opcional, hasta {MAX_MB} MB)
                </label>
                <div className="flex items-center gap-3 rounded-md border border-dashed px-3 py-2.5">
                  <Paperclip
                    aria-hidden
                    className="h-4 w-4 text-muted-foreground"
                    strokeWidth={1.5}
                  />
                  <input
                    id="deliverable-file"
                    type="file"
                    onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
                    className="min-w-0 flex-1 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1 file:text-sm"
                  />
                </div>
                {deliverable?.storage_path && !file && (
                  <p className="text-xs text-muted-foreground">
                    Archivo actual: {deliverable.storage_path.split('/').pop()}. Si eliges otro, lo
                    reemplaza.
                  </p>
                )}
                {fileError && (
                  <p role="alert" className="text-sm text-danger-ink">
                    {fileError}
                  </p>
                )}
              </div>
            )}
            {error && (
              <p role="alert" className="text-sm text-danger-ink">
                {savedId && !deliverable
                  ? `El entregable se guardó, pero el archivo no se pudo subir. ${error}`
                  : error}
              </p>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={pending}>
                {pending
                  ? 'Guardando…'
                  : deliverable || savedId
                    ? 'Guardar entregable'
                    : 'Crear borrador'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
