import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Lock, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm, useWatch, type UseFormReturn } from 'react-hook-form'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import type { ProjectInput, ProjectOverview } from '@/data'
import { PageHeader } from '@/components/layout/PageHeader'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { MarkdownField } from '@/components/shared/MarkdownField'
import { MetaSelectItems } from '@/components/shared/MetaSelectItems'
import { RoleGate } from '@/components/shared/RoleGate'
import { Switch } from '@/components/shared/Switch'
import { Button } from '@/components/ui/button'
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
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { HEALTH, PRIORITY, PROJECT_STATUS } from '@/lib/labels'
import { slugify } from '@/lib/slug'
import { useProject } from '@/features/projects/hooks'
import { dateField, errorMessage } from './fields'
import { useCreateProject, useDeleteProject, useUpdateProject } from './hooks'

const schema = z
  .object({
    name: z.string().trim().min(3, 'Escribe el nombre del proyecto (mínimo 3 letras).').max(120),
    slug: z
      .string()
      .trim()
      .min(1, 'El identificador no puede quedar vacío.')
      .regex(
        /^[a-z0-9]+(-[a-z0-9]+)*$/,
        'Usa solo minúsculas, números y guiones. Ej. portal-clientes.',
      ),
    summary: z.string().trim().max(240, 'Máximo 240 caracteres.'),
    description_md: z.string().max(10000, 'Máximo 10,000 caracteres.'),
    status: z.enum([
      'planeacion',
      'en_progreso',
      'en_pausa',
      'en_revision',
      'completado',
      'cancelado',
    ]),
    health: z.enum(['en_tiempo', 'en_riesgo', 'retrasado']),
    priority: z.enum(['alta', 'media', 'baja']),
    start_date: dateField,
    target_date: dateField,
    progress_override: z
      .string()
      .refine(
        (v) => v.trim() === '' || (/^\d{1,3}$/.test(v.trim()) && Number(v) <= 100),
        'Escribe un número entero de 0 a 100, o déjalo vacío.',
      ),
    is_published: z.boolean(),
  })
  .refine((v) => v.target_date >= v.start_date, {
    path: ['target_date'],
    message: 'La entrega objetivo no puede ser antes del inicio.',
  })
type Values = z.infer<typeof schema>

function toInput(v: Values): ProjectInput {
  return {
    ...v,
    name: v.name.trim(),
    summary: v.summary.trim(),
    progress_override: v.progress_override.trim() === '' ? null : Number(v.progress_override),
  }
}

function today(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="rounded-xl border bg-card p-5 shadow-card sm:p-6">
      <h2 className="text-lg">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  )
}

function SelectField({
  form,
  name,
  label,
  map,
}: {
  form: UseFormReturn<Values>
  name: 'status' | 'health' | 'priority'
  label: string
  map: Record<string, { label: string }>
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <MetaSelectItems map={map} />
            </SelectContent>
          </Select>
        </FormItem>
      )}
    />
  )
}

function ProjectForm({ project }: { project?: ProjectOverview }) {
  const navigate = useNavigate()
  const create = useCreateProject()
  const update = useUpdateProject()
  const remove = useDeleteProject()
  const [confirmDelete, setConfirmDelete] = useState(false)
  // En un proyecto nuevo el identificador sigue al nombre hasta que se edita a mano.
  const [slugTouched, setSlugTouched] = useState(!!project)

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: project
      ? {
          name: project.name,
          slug: project.slug,
          summary: project.summary,
          description_md: project.description_md,
          status: project.status,
          health: project.health,
          priority: project.priority,
          start_date: project.start_date,
          target_date: project.target_date,
          progress_override:
            project.progress_override === null ? '' : String(project.progress_override),
          is_published: project.is_published,
        }
      : {
          name: '',
          slug: '',
          summary: '',
          description_md: '',
          status: 'planeacion',
          health: 'en_tiempo',
          priority: 'media',
          start_date: today(),
          target_date: '',
          progress_override: '',
          is_published: false,
        },
  })

  const name = useWatch({ control: form.control, name: 'name' })
  const slugValue = useWatch({ control: form.control, name: 'slug' })
  useEffect(() => {
    if (!slugTouched)
      form.setValue('slug', slugify(name), { shouldValidate: form.formState.isSubmitted })
  }, [name, slugTouched, form])

  const saving = create.isPending || update.isPending
  const error = errorMessage(create.error ?? update.error)

  async function onSubmit(values: Values) {
    const input = toInput(values)
    if (project) {
      await update.mutateAsync({ id: project.id, patch: input })
    } else {
      await create.mutateAsync(input)
    }
    navigate(`/proyectos/${input.slug}`)
  }

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((v) => void onSubmit(v).catch(() => undefined))}
          className="max-w-3xl space-y-6"
          noValidate
        >
          <Section title="Datos del proyecto">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ej. Portal de clientes para documentos fiscales"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Identificador en la dirección</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) => {
                        setSlugTouched(true)
                        field.onChange(e)
                      }}
                    />
                  </FormControl>
                  <FormDescription>
                    La dirección será /proyectos/{slugValue || 'identificador'}. Si lo cambias, los
                    enlaces anteriores dejan de funcionar.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="summary"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resumen</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="Una o dos frases para la tarjeta del inicio."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description_md"
              render={({ field, fieldState }) => (
                <FormItem>
                  <MarkdownField
                    label="Descripción"
                    value={field.value}
                    onChange={field.onChange}
                    invalid={!!fieldState.error}
                    rows={9}
                    placeholder="Alcance, objetivos y lo que el despacho debe saber."
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </Section>

          <Section title="Estado y fechas">
            <div className="grid gap-5 sm:grid-cols-3">
              <SelectField form={form} name="status" label="Estatus" map={PROJECT_STATUS} />
              <SelectField form={form} name="health" label="Salud" map={HEALTH} />
              <SelectField form={form} name="priority" label="Prioridad" map={PRIORITY} />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
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
                name="target_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entrega objetivo</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="progress_override"
              render={({ field }) => (
                <FormItem className="sm:max-w-xs">
                  <FormLabel>Avance manual (%)</FormLabel>
                  <FormControl>
                    <Input inputMode="numeric" placeholder="Automático" {...field} />
                  </FormControl>
                  <FormDescription>
                    Déjalo vacío para calcular el avance con el peso de los hitos completados.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Section>

          <Section title="Publicación">
            <FormField
              control={form.control}
              name="is_published"
              render={({ field }) => (
                <FormItem className="flex items-start gap-4 space-y-0">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      aria-describedby="publish-help"
                    />
                  </FormControl>
                  <div className="space-y-1">
                    <FormLabel>{field.value ? 'Publicado' : 'Borrador'}</FormLabel>
                    <p id="publish-help" className="text-sm text-muted-foreground">
                      {field.value
                        ? 'El despacho ya puede ver este proyecto.'
                        : 'Solo tú ves este proyecto. Publícalo cuando esté listo para el despacho.'}
                    </p>
                  </div>
                </FormItem>
              )}
            />
          </Section>

          {error && (
            <p role="alert" className="text-sm text-danger-ink">
              {error}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <Button type="submit" disabled={saving}>
                {saving ? 'Guardando…' : project ? 'Guardar cambios' : 'Crear proyecto'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link to={project ? `/proyectos/${project.slug}` : '/'}>Cancelar</Link>
              </Button>
            </div>
            {project && (
              <Button
                type="button"
                variant="outline"
                className="border-danger/40 text-danger-ink hover:bg-danger-soft"
                onClick={() => setConfirmDelete(true)}
              >
                <Trash2 aria-hidden className="mr-1.5 h-4 w-4" strokeWidth={1.5} />
                Eliminar proyecto
              </Button>
            )}
          </div>
        </form>
      </Form>

      {project && (
        <ConfirmDialog
          open={confirmDelete}
          onOpenChange={setConfirmDelete}
          title={`Eliminar “${project.name}”`}
          description="Se borrarán también sus hitos, tareas, entregables, bitácora, solicitudes y comentarios. Esta acción no se puede deshacer."
          confirmLabel="Eliminar proyecto"
          onConfirm={async () => {
            await remove.mutateAsync(project.id)
            navigate('/')
          }}
        />
      )}
    </>
  )
}

export function ProjectFormPage() {
  const { slug } = useParams()
  const query = useProject(slug ?? '')
  const editing = slug !== undefined

  return (
    <RoleGate
      action="project.edit"
      fallback={
        <EmptyState
          icon={Lock}
          title="Solo Axel captura proyectos"
          description="Tu usuario puede consultar y comentar, pero no editar el contenido."
        />
      }
    >
      <Link
        to={editing ? `/proyectos/${slug}` : '/'}
        className="mb-4 inline-flex items-center gap-1.5 rounded text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft aria-hidden className="h-4 w-4" strokeWidth={1.5} />
        {editing ? 'Volver al proyecto' : 'Todos los proyectos'}
      </Link>
      <PageHeader
        title={editing ? 'Editar proyecto' : 'Nuevo proyecto'}
        description={
          editing
            ? 'Los cambios se ven de inmediato para el despacho si el proyecto está publicado.'
            : 'Empieza como borrador: solo tú lo ves hasta que lo publiques.'
        }
      />
      {!editing ? (
        <ProjectForm />
      ) : query.isError ? (
        <ErrorState onRetry={() => void query.refetch()} />
      ) : query.isLoading ? (
        <Skeleton className="h-96 w-full max-w-3xl rounded-xl" />
      ) : query.data ? (
        <ProjectForm key={query.data.id} project={query.data} />
      ) : (
        <EmptyState title="No encontramos este proyecto" />
      )}
    </RoleGate>
  )
}
