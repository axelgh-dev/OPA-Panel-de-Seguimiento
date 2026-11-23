import { Lock, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { RoleGate } from '@/components/shared/RoleGate'
import { Chip } from '@/components/shared/Chip'
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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/format'
import { ROLE_LABEL } from '@/lib/labels'
import { useProfiles } from './hooks'

function InviteDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-primary">Invitar usuario</DialogTitle>
          <DialogDescription>
            Recibirá un correo para crear su contraseña. No hay registro abierto.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="inv-name">Nombre</Label>
            <Input id="inv-name" disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="inv-email">Correo electrónico</Label>
            <Input id="inv-email" type="email" disabled />
          </div>
          <div className="space-y-2">
            <Label>Rol</Label>
            <Select disabled value="opa">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="opa">{ROLE_LABEL.opa}</SelectItem>
                <SelectItem value="dev">{ROLE_LABEL.dev}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <p className="rounded-md bg-gold-100 px-3 py-2 text-sm">
            Esta pantalla es solo visual. Las invitaciones reales llegan con la conexión a Supabase
            (fase 2).
          </p>
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
          <Button disabled>Enviar invitación</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function UsersTable() {
  const q = useProfiles()
  if (q.isError) return <ErrorState onRetry={() => void q.refetch()} />
  if (q.isLoading) return <Skeleton className="h-56 w-full rounded-xl" />
  return (
    <div className="overflow-x-auto rounded-xl border bg-card shadow-card">
      <table className="w-full min-w-[40rem] text-left text-sm">
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
              <td className="px-5 py-3 text-muted-foreground">{u.job_title}</td>
              <td className="px-5 py-3">
                <Chip tone={u.is_active ? 'success' : 'neutral'}>
                  {u.is_active ? 'Activo' : 'Desactivado'}
                </Chip>
              </td>
              <td className="px-5 py-3 tabular-nums text-muted-foreground">
                {formatDate(u.created_at)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function AdminUsersPage() {
  const [inviting, setInviting] = useState(false)
  return (
    <RoleGate
      action="user.manage"
      fallback={
        <EmptyState
          icon={Lock}
          title="Solo Axel administra usuarios"
          description="Cambia a la vista de Axel con el selector “Ver como” para ver esta pantalla."
        />
      }
    >
      <PageHeader
        title="Administración de usuarios"
        description="Quién tiene acceso al panel. Los tres usuarios del despacho tienen los mismos permisos."
        actions={
          <Button onClick={() => setInviting(true)}>
            <UserPlus aria-hidden className="mr-1.5 h-4 w-4" strokeWidth={1.5} />
            Invitar usuario
          </Button>
        }
      />
      <UsersTable />
      <InviteDialog open={inviting} onOpenChange={setInviting} />
    </RoleGate>
  )
}
