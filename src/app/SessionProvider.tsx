import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { listDemoUsers, setSession } from '@/data'
import { SessionContext } from '@/lib/session'

const STORAGE_KEY = 'opa.viewAs'
// SUPUESTO: Admin OPA es el usuario por defecto de la maqueta.
const DEFAULT_USER_ID = 'u-admin'

function readStoredUserId(users: { id: string }[]): string {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && users.some((u) => u.id === stored)) return stored
  } catch {
    // localStorage no disponible: se usa el valor por defecto.
  }
  return DEFAULT_USER_ID
}

/** Fase 1: la sesión viene del selector "Ver como". En fase 2 vendrá de Supabase Auth. */
export function SessionProvider({
  children,
  initialUserId,
}: {
  children: ReactNode
  initialUserId?: string
}) {
  const queryClient = useQueryClient()
  const users = useMemo(() => listDemoUsers(), [])
  const [userId, setUserIdState] = useState(() => {
    const id = initialUserId ?? readStoredUserId(users)
    setSession(id) // antes del primer render de los hijos, para que sus consultas usen este usuario
    return id
  })

  const setUserId = useCallback(
    (id: string) => {
      setSession(id)
      try {
        localStorage.setItem(STORAGE_KEY, id)
      } catch {
        // sin persistencia
      }
      setUserIdState(id)
      void queryClient.invalidateQueries()
    },
    [queryClient],
  )

  const value = useMemo(
    () => ({ user: users.find((u) => u.id === userId)!, users, setUserId }),
    [users, userId, setUserId],
  )
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
