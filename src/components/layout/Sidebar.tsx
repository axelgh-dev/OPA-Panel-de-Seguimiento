import {
  BookOpen,
  GitPullRequestArrow,
  LayoutDashboard,
  LogOut,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { UserAvatar } from '@/components/shared/UserAvatar'
import { can, type Action } from '@/lib/permissions'
import { useSession } from '@/lib/session'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  requires?: Action
}

// SUPUESTO: no hay entrada "Proyectos" aparte; el Inicio ya es la lista de proyectos.
const NAV: NavItem[] = [
  { to: '/', label: 'Inicio', icon: LayoutDashboard, end: true },
  { to: '/bitacora', label: 'Bitácora', icon: BookOpen },
  { to: '/solicitudes', label: 'Solicitudes', icon: GitPullRequestArrow },
  { to: '/admin/usuarios', label: 'Administración', icon: Users, requires: 'user.manage' },
]

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { user } = useSession()
  return (
    <div className="flex h-full flex-col bg-navy-900 text-white">
      <div className="px-6 pb-6 pt-7">
        <img src="/brand/logo-white.png" alt="OP&A" className="h-auto w-28" />
        <p className="mt-3 text-xs text-white/70">Panel de seguimiento</p>
      </div>

      <nav aria-label="Principal" className="flex-1 px-3">
        <ul className="space-y-0.5">
          {NAV.filter((i) => !i.requires || can(user.role, i.requires)).map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                className={({ isActive }) =>
                  cn(
                    'relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-white/80 transition-colors',
                    'hover:bg-white/5 hover:text-white focus-visible:ring-white focus-visible:ring-offset-navy-900',
                    isActive && 'bg-white/10 font-medium text-white',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      aria-hidden
                      className={cn(
                        'absolute inset-y-2 left-0 w-[3px] rounded-r bg-gold-500 transition-opacity',
                        isActive ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                    <item.icon aria-hidden className="h-[18px] w-[18px]" strokeWidth={1.5} />
                    {item.label}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="flex items-center gap-3">
          <UserAvatar user={user} size="lg" className="bg-white/10 text-white" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{user.full_name}</p>
            <p className="truncate text-xs text-white/70">{user.job_title}</p>
          </div>
        </div>
        <NavLink
          to="/login"
          onClick={onNavigate}
          className="mt-3 flex items-center gap-2 rounded-md px-2 py-1.5 text-xs text-white/70 hover:text-white focus-visible:ring-white focus-visible:ring-offset-navy-900"
        >
          <LogOut aria-hidden className="h-3.5 w-3.5" strokeWidth={1.5} />
          Cerrar sesión
        </NavLink>
      </div>
    </div>
  )
}
