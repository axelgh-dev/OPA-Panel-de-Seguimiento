import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { Milestone, MilestoneInput } from '@/data'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { DateLabel } from '@/components/shared/DateLabel'
import { MetaSelectItems } from '@/components/shared/MetaSelectItems'
import { SegmentedProgress } from '@/components/shared/SegmentedProgress'
import { MilestoneStatusChip } from '@/components/shared/chips'
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
import { Select, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { MILESTONE_STATUS } from '@/lib/labels'
import { computeProgress } from '@/lib/progress'
import { dateField, errorMessage } from './fields'
import {
  useCreateMilestone,
  useDeleteMilestone,
  useReorderMilestones,
  useUpdateMilestone,
} from './hooks'

const schema = z
  .object({
    name: z.string().trim().min(2, 'Escribe el nombre del hito.').max(120),
    description: z.string().trim().max(500, 'Máximo 500 caracteres.'),
    weight: z
      .string()
      .regex(/^\d{1,2}$/, 'Escribe un número entero entre 1 y 20.')
      .refine((v) => Number(v) >= 1 && Number(v) <= 20, 'El peso va de 1 a 20.'),
    start_date: dateField,
    due_date: dateField,
    status: z.enum(['pendiente', 'en_curso', 'completado', 'retrasado']),
  })
  .refine((v) => v.due_date >= v.start_date, {
    path: ['due_date'],
    message: 'La fecha límite no puede ser antes del inicio.',
  })
type Values = z.infer<typeof schema>

function MilestoneDialog({
  open,
  onOpenChange,
  projectId,
  milestone,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  milestone?: Milestone
}) {
  const create = useCreateMilestone()
  const update = useUpdateMilestone()
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    values: milestone
      ? {
          name: milestone.name,
          description: milestone.description,
          weight: String(milestone.weight),
          start_date: milestone.start_date,
          due_date: milestone.due_date,
          status: milestone.status,
        }
      : {
          name: '',
          description: '',
          weight: '1',
          start_date: '',
          due_date: '',
          status: 'pendiente',
        },
  })
  const pending = create.isPending || update.isPending
  const error = errorMessage(create.error ?? update.error)

  async function onSubmit(v: Values) {
    const fields = {
      name: v.name.trim(),
      description: v.description.trim(),
      weight: Number(v.weight),
      start_date: v.start_date,
      due_date: v.due_date,
      status: v.status,
    }
    if (milestone) await update.mutateAsync({ id: milestone.id, patch: fields })
    else await create.mutateAsync({ project_id: projectId, ...fields } satisfies MilestoneInput)
    form.reset()
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          create.reset()
          update.reset()
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
                {milestone ? 'Editar hito' : 'Agregar hito'}
              </DialogTitle>
              <DialogDescription>
                Un hito es una fase con entrega. Su peso decide cuánto suma al avance del proyecto.
              </DialogDescription>
            </DialogHeader>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Carga y organización de documentos" {...field} />
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
                  <FormLabel>Descripción (opcional)</FormLabel>
                  <FormControl>
                    <Textarea rows={2} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Inicio</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha límite</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peso</FormLabel>
                    <FormControl>
                      <Input inputMode="numeric" {...field} />
                    </FormControl>
                    <FormDescription>
                      De 1 a 20. Un hito de peso 3 vale el triple que uno de 1.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                        <MetaSelectItems map={MILESTONE_STATUS} />
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
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
                {pending ? 'Guardando…' : milestone ? 'Guardar hito' : 'Agregar hito'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Editor de hitos (solo dev). La barra de arriba es la misma que verá el despacho y se recalcula
 * con cada cambio de peso, estatus u orden; cada fila muestra su porción del avance total.
 */
export function MilestoneEditor({
  projectId,
  milestones,
  progressOverride,
}: {
  projectId: string
  milestones: Milestone[]
  progressOverride: number | null
}) {
  const [editing, setEditing] = useState<Milestone | null>(null)
  const [adding, setAdding] = useState(false)
  const [removing, setRemoving] = useState<Milestone | null>(null)
  const reorder = useReorderMilestones()
  const remove = useDeleteMilestone()

  const ordered = [...milestones].sort((a, b) => a.position - b.position)
  const totalWeight = ordered.reduce((n, m) => n + m.weight, 0)
  const progress = computeProgress(ordered, progressOverride)

  function move(index: number, delta: -1 | 1) {
    const ids = ordered.map((m) => m.id)
    const target = index + delta
    if (target < 0 || target >= ids.length) return
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    reorder.mutate({ projectId, orderedIds: ids })
  }

  return (
    <section aria-labelledby="hitos-editor" className="rounded-xl border bg-card p-5 shadow-card">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 id="hitos-editor" className="text-lg">
            Hitos del proyecto
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Así se calcula el avance que ve el despacho. Cambia pesos, estatus u orden y la barra se
            ajusta.
          </p>
        </div>
        <Button size="sm" onClick={() => setAdding(true)}>
          <Plus aria-hidden className="mr-1.5 h-4 w-4" strokeWidth={1.5} />
          Agregar hito
        </Button>
      </div>

      <div className="mt-5 flex items-center gap-4">
        <span className="font-serif text-3xl font-semibold tabular-nums text-primary">
          {progress}%
        </span>
        <SegmentedProgress segments={ordered} progress={progress} className="flex-1" />
      </div>
      {progressOverride !== null && (
        <p className="mt-2 text-xs text-warning-ink">
          Este proyecto usa un avance manual de {progressOverride}%: los hitos no lo modifican.
          Puedes quitarlo en “Editar proyecto”.
        </p>
      )}

      {ordered.length === 0 ? (
        <p className="mt-5 rounded-lg border border-dashed px-4 py-6 text-center text-sm text-muted-foreground">
          Aún no hay hitos. Agrega el primero para que el proyecto tenga línea de tiempo y avance.
        </p>
      ) : (
        <ol className="mt-5 divide-y">
          {ordered.map((m, i) => {
            const share = totalWeight ? Math.round((m.weight / totalWeight) * 100) : 0
            return (
              <li key={m.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
                <div className="flex flex-col">
                  <button
                    type="button"
                    aria-label={`Subir el hito ${m.name}`}
                    disabled={i === 0 || reorder.isPending}
                    onClick={() => move(i, -1)}
                    className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ArrowUp aria-hidden className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Bajar el hito ${m.name}`}
                    disabled={i === ordered.length - 1 || reorder.isPending}
                    onClick={() => move(i, 1)}
                    className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ArrowDown aria-hidden className="h-4 w-4" strokeWidth={1.5} />
                  </button>
                </div>
                <div className="min-w-0 flex-1 basis-56">
                  <p className="font-medium">{m.name}</p>
                  <p className="text-xs text-muted-foreground">
                    <DateLabel value={m.start_date} /> a <DateLabel value={m.due_date} />
                  </p>
                </div>
                <div className="w-36" title={`Peso ${m.weight} de ${totalWeight}`}>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                    <div
                      className="h-full rounded-full bg-gold-500"
                      style={{ width: `${share}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs tabular-nums text-muted-foreground">
                    Peso {m.weight}: {share}% del avance
                  </p>
                </div>
                <MilestoneStatusChip value={m.status} />
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Editar el hito ${m.name}`}
                    onClick={() => setEditing(m)}
                  >
                    <Pencil aria-hidden className="h-4 w-4" strokeWidth={1.5} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Eliminar el hito ${m.name}`}
                    onClick={() => setRemoving(m)}
                  >
                    <Trash2 aria-hidden className="h-4 w-4 text-danger-ink" strokeWidth={1.5} />
                  </Button>
                </div>
              </li>
            )
          })}
        </ol>
      )}
      {reorder.isError && (
        <p role="alert" className="mt-3 text-sm text-danger-ink">
          {errorMessage(reorder.error)}
        </p>
      )}

      <MilestoneDialog open={adding} onOpenChange={setAdding} projectId={projectId} />
      <MilestoneDialog
        key={editing?.id ?? 'none'}
        open={editing !== null}
        onOpenChange={(o) => !o && setEditing(null)}
        projectId={projectId}
        milestone={editing ?? undefined}
      />
      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={`Eliminar “${removing?.name ?? ''}”`}
        description="Sus tareas y entregables se conservan, pero quedan sin hito asignado. El avance se recalcula."
        confirmLabel="Eliminar hito"
        onConfirm={() => remove.mutateAsync(removing!.id)}
      />
    </section>
  )
}
