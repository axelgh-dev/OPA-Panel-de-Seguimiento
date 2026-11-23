import { Info, Lock, Pencil } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import type { Profile } from '@/data'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { RoleGate } from '@/components/shared/RoleGate'
import { Chip } from '@/components/shared/Chip'
import { Switch } from '@/components/shared/Switch'
import { UserAvatar } from '@/components/shared/UserAvatar'
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
import { Skeleton } from '@/components/ui/skeleton'
import { errorMessage } from '@/features/manage/fields'
import { useUpdateProfile } from '@/features/manage/hooks'
import { formatDate } from '@/lib/format'
import { ROLE_LABEL } from '@/lib/labels'
import { useSession } from '@/lib/session'
import { useProfiles } from './hooks'

const schema = z.object({
  full_name: z.string().trim().min(2, 'Escribe el nombre.').max(80),
  job_title: z.string().trim().max(80, 'Máximo 80 caracteres.'),
  role: z.enum(['dev', 'opa']),
  is_active: z.boolean(),
})
type Values = z.infer<typeof schema>

function UserDialog({
  user,
  isSelf,
  onClose,
}: {
  user: Profile
  isSelf: boolean
  onClose: () => void
}) {
  const update = useUpdateProfile()
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      full_name: user.full_name,
      job_title: user.job_title,
      role: user.role,
      is_active: user.is_active,
    },
  })

  async function onSubmit(v: Values) {
    await update.mutateAsync({
      id: user.id,
      patch: {
        full_name: v.full_name.trim(),
        job_title: v.job_title.trim(),
        // Tu propia cuenta no se degrada ni se desactiva desde aquí (la base de datos también lo impide).
        ...(isSelf ? {} : { role: v.role, is_active: v.is_active }),
      },
    })
    onClose()
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((v) => void onSubmit(v).catch(() => undefined))}
            className="space-y-4"
            noValidate
          >
            <DialogHeader>
              <DialogTitle className="font-serif text-xl text-primary">Editar usuario</DialogTitle>
              <DialogDescription>{user.email}</DialogDescription>
            </DialogHeader>
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="job_title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cargo (solo informativo)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej. Gerente del despacho" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={isSelf}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="opa">{ROLE_LABEL.opa}</SelectItem>
                      <SelectItem value="dev">{ROLE_LABEL.dev}</SelectItem>
                    </SelectContent>
                  </Select>
                  {isSelf && (
                    <p className="text-xs text-muted-foreground">
                      No puedes cambiar tu propio rol.
                    </p>
                  )}
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex items-start gap-3 space-y-0">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isSelf}
                      aria-describedby="active-help"
                    />
                  </FormControl>
                  <div className="space-y-1">
                    <FormLabel>{field.value ? 'Cuenta activa' : 'Cuenta desactivada'}</FormLabel>
                    <p id="active-help" className="text-xs text-muted-foreground">
                      {isSelf
                        ? 'No puedes desactivar tu propia cuenta.'
                        : 'Una cuenta desactivada ya no puede ver nada, aunque conserve su contraseña.'}
                    </p>
                  </div>
                </FormItem>
              )}
            />
            {update.isError && (
              <p role="alert" className="text-sm text-danger-ink">
                {errorMessage(update.error)}
              </p>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={update.isPending}>
                {update.isPending ? 'Guardando…' : 'Guardar usuario'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function UsersTable() {
  const q = useProfiles()
  const { user: me } = useSession()
  const [editing, setEditing] = useState<Profile | null>(null)
  if (q.isError) return <ErrorState onRetry={() => void q.refetch()} />
  if (q.isLoading) return <Skeleton className="h-56 w-full rounded-xl" />
  return (
    <div className="overflow-x-auto rounded-xl border bg-card shadow-card">
      <table className="w-full min-w-[44rem] text-left text-sm">
        <caption className="sr-only">Usuarios con acceso al panel</caption>
        <thead className="border-b bg-muted/50 text-muted-foreground">
          <tr>
            <th scope="col" className="px-5 py-3 font-medium">
              Usuario
            </th>
            <th scope="col" className="px-5 py-3 font-medium">
              Rol
            </th>
            <th scope="col" className="px-5 py-3 font-medium">
              Cargo
            </th>
            <th scope="col" className="px-5 py-3 font-medium">
              Estado
            </th>
            <th scope="col" className="px-5 py-3 font-medium">
              Alta
            </th>
            <th scope="col" className="px-5 py-3">
              <span className="sr-only">Acciones</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {q.data?.map((u) => (
            <tr key={u.id}>
              <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                  <UserAvatar user={u} />
                  <div className="min-w-0">
                    <p className="font-medium">{u.full_name}</p>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-3">{ROLE_LABEL[u.role]}</td>
              <td className="px-5 py-3 text-muted-foreground">{u.job_title || 'Sin cargo'}</td>
              <td className="px-5 py-3">
                <Chip tone={u.is_active ? 'success' : 'neutral'}>
                  {u.is_active ? 'Activo' : 'Desactivado'}
                </Chip>
              </td>
              <td className="px-5 py-3 tabular-nums text-muted-foreground">
                {formatDate(u.created_at)}
              </td>
              <td className="px-5 py-3 text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Editar a ${u.full_name}`}
                  onClick={() => setEditing(u)}
                >
                  <Pencil aria-hidden className="h-4 w-4" strokeWidth={1.5} />
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {editing && (
        <UserDialog
          key={editing.id}
          user={editing}
          isSelf={editing.id === me.id}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}

export function AdminUsersPage() {
  return (
    <RoleGate
      action="user.manage"
      fallback={
        <EmptyState
          icon={Lock}
          title="Solo Axel administra usuarios"
          description="Tu usuario puede consultar el panel, pero no administrar cuentas."
        />
      }
    >
      <PageHeader
        title="Administración de usuarios"
        description="Quién tiene acceso al panel. Los tres usuarios del despacho tienen los mismos permisos."
      />
      <p className="mb-5 flex max-w-3xl gap-2.5 rounded-lg bg-gold-100 px-4 py-3 text-sm">
        <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-gold-600" strokeWidth={1.5} />
        <span>
          No hay registro abierto. Para dar de alta a alguien, créalo en el panel de Supabase
          (Authentication, Users). Aparece aquí con rol del despacho y desde aquí le pones nombre y
          cargo.
        </span>
      </p>
      <UsersTable />
    </RoleGate>
  )
}
