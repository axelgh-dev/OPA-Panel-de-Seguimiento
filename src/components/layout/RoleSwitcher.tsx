import { Eye } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSession } from '@/lib/session'

/**
 * Selector "Ver como" (solo fase 1). Se muestra siempre porque la maqueta es una demo de
 * concepto; en fase 2 el rol vendrá del perfil de Supabase y esto desaparece.
 */
export function RoleSwitcher() {
  const { user, users, setUserId } = useSession()
  return (
    <div className="flex items-center gap-2">
      <span
        className="hidden items-center gap-1.5 text-xs text-muted-foreground sm:flex"
        aria-hidden
      >
        <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
        Ver como
      </span>
      <Select value={user.id} onValueChange={setUserId}>
        <SelectTrigger aria-label="Ver como" className="h-8 w-[9.5rem] bg-card text-xs">
          <SelectValue>{user.full_name}</SelectValue>
        </SelectTrigger>
        <SelectContent align="end">
          {users.map((u) => (
            <SelectItem key={u.id} value={u.id} className="text-xs">
              {u.full_name}
              <span className="ml-1.5 text-muted-foreground">· {u.job_title}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
