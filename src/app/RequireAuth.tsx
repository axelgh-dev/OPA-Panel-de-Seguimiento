import { useMemo, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { dataMode } from '@/data'
import { useAuth } from '@/lib/auth'
import { SessionContext } from '@/lib/session'
import { InitialFallback } from './InitialFallback'

/** Rutas protegidas. En modo demo (mock) no hay inicio de sesión real y deja pasar. */
export function RequireAuth({ children }: { children: ReactNode }) {
  return dataMode === 'supabase' ? (
    <RequireSupabaseAuth>{children}</RequireSupabaseAuth>
  ) : (
    <>{children}</>
  )
}

function RequireSupabaseAuth({ children }: { children: ReactNode }) {
  const { status, profile, signOut } = useAuth()
  const location = useLocation()
  const value = useMemo(
    () =>
      profile ? { user: profile, users: [profile], setUserId: () => undefined, signOut } : null,
    [profile, signOut],
  )

  if (status === 'loading') return <InitialFallback />
  if (status === 'anonymous' || !value) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
