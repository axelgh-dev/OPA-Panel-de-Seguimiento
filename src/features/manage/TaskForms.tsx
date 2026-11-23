import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import type { Milestone, Task } from '@/data'
import { MetaSelectItems } from '@/components/shared/MetaSelectItems'
import { Switch } from '@/components/shared/Switch'
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
import { TASK_STATUS } from '@/lib/labels'
import { errorMessage, optionalDateField } from './fields'
import { useCreateTask, useUpdateTask } from './hooks'

const NO_MILESTONE = 'none'

const schema = z.object({
  title: z.string().trim().min(2, 'Escribe qué hay que hacer.').max(200, 'Máximo 200 caracteres.'),
  milestone_id: z.string(),
  status: z.enum(['pendiente', 'en_progreso', 'bloqueada', 'hecha']),
  due_date: optionalDateField,
  is_internal: z.boolean(),
})
type Values = z.infer<typeof schema>

function MilestoneSelect({
  value,
  onChange,
  milestones,
  className,
}: {
  value: string
  onChange: (v: string) => void
  milestones: Milestone[]
  className?: string
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger aria-label="Hito de la tarea" className={className}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NO_MILESTONE}>Sin hito</SelectItem>
        {milestones.map((m) => (
          <SelectItem key={m.id} value={m.id}>
            {m.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

/** Alta rápida: escribe, elige hito (opcional) y Enter. Una tarea interna no la ve el despacho. */
export function QuickAddTask({
  projectId,
  milestones,
}: {
  projectId: string
  milestones: Milestone[]
}) {
  const create = useCreateTask()
  const [title, setTitle] = useState('')
  const [milestoneId, setMilestoneId] = useState(NO_MILESTONE)
  const [internal, setInternal] = useState(false)
  const [invalid, setInvalid] = useState(false)

  function submit(e: React.FormEvent) {
    e.preventDefault()
    if (title.trim().length < 2) {
      setInvalid(true)
      return
    }
    setInvalid(false)
    create.mutate(
      {
        project_id: projectId,
        milestone_id: milestoneId === NO_MILESTONE ? null : milestoneId,
        title: title.trim(),
        status: 'pendiente',
        due_date: null,
        is_internal: internal,
      },
      { onSuccess: () => setTitle('') },
    )
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border bg-card p-4 shadow-card"
      aria-label="Agregar tarea"
      noValidate
    >
      <div className="flex flex-wrap items-center gap-3">
        <Input
          aria-label="Nueva tarea"
          aria-invalid={invalid}
          placeholder="Agregar una tarea…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="min-w-[14rem] flex-1"
        />
        <MilestoneSelect
          value={milestoneId}
          onChange={setMilestoneId}
          milestones={milestones}
          className="h-10 w-52 bg-card"
        />
        <label className="flex items-center gap-2 text-sm">
          <Switch
            checked={internal}
            onCheckedChange={setInternal}
            aria-describedby="internal-hint"
          />
          Interna
        </label>
        <Button type="submit" disabled={create.isPending}>
          <Plus aria-hidden className="mr-1.5 h-4 w-4" strokeWidth={1.5} />
          {create.isPending ? 'Agregando…' : 'Agregar tarea'}
        </Button>
      </div>
      <p id="internal-hint" className="mt-2 text-xs text-muted-foreground">
        Una tarea interna solo la ves tú; el despacho no la ve.
      </p>
      {invalid && (
        <p role="alert" className="mt-2 text-sm text-danger-ink">
          Escribe qué hay que hacer (mínimo 2 letras).
        </p>
      )}
      {create.isError && (
        <p role="alert" className="mt-2 text-sm text-danger-ink">
          {errorMessage(create.error)}
        </p>
      )}
    </form>
  )
}

export function TaskEditDialog({
  task,
  milestones,
  open,
  onOpenChange,
}: {
  task: Task
  milestones: Milestone[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const update = useUpdateTask()
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: task.title,
      milestone_id: task.milestone_id ?? NO_MILESTONE,
      status: task.status,
      due_date: task.due_date ?? '',
      is_internal: task.is_internal,
    },
  })

  async function onSubmit(v: Values) {
    await update.mutateAsync({
      id: task.id,
      patch: {
        title: v.title.trim(),
        milestone_id: v.milestone_id === NO_MILESTONE ? null : v.milestone_id,
        status: v.status,
        due_date: v.due_date === '' ? null : v.due_date,
        is_internal: v.is_internal,
      },
    })
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) update.reset()
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
              <DialogTitle className="font-serif text-xl text-primary">Editar tarea</DialogTitle>
              <DialogDescription>Los cambios se ven de inmediato.</DialogDescription>
            </DialogHeader>
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tarea</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="milestone_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hito</FormLabel>
                    <MilestoneSelect
                      value={field.value}
                      onChange={field.onChange}
                      milestones={milestones}
                    />
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
                        <MetaSelectItems map={TASK_STATUS} />
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem className="sm:max-w-[14rem]">
                  <FormLabel>Fecha límite (opcional)</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_internal"
              render={({ field }) => (
                <FormItem className="flex items-center gap-3 space-y-0">
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormLabel>Interna: el despacho no la ve</FormLabel>
                </FormItem>
              )}
            />
            {update.isError && (
              <p role="alert" className="text-sm text-danger-ink">
                {errorMessage(update.error)}
              </p>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={update.isPending}>
                {update.isPending ? 'Guardando…' : 'Guardar tarea'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
