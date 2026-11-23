import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { dataMode, getDemo } from '@/data'
import { AuthProvider } from './AuthProvider'
import { SessionContext } from '@/lib/session'

const STORAGE_KEY = 'opa.viewAs'

function readStoredUserId(users: { id: string }[]): string {
  // Enlace de demo: ?as=axel | admin | ej1 | ej2 (tiene prioridad sobre lo guardado).
  const fromUrl = new URLSearchParams(window.location.search).get('as')
  if (fromUrl && users.some((u) => u.id === `u-${fromUrl}`)) return `u-${fromUrl}`
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && users.some((u) => u.id === stored)) return stored
  } catch {
    // localStorage no disponible: se usa el valor por defecto.
  }
  return getDemo().defaultUserId
}

/**
 * Con Supabase la sesión es real (`AuthProvider` + `RequireAuth`). En modo mock la sesión viene del
 * selector "Ver como" de la demo.
 */
export function SessionProvider({
  children,
  initialUserId,
}: {
  children: ReactNode
  initialUserId?: string
}) {
  if (dataMode === 'supabase') return <AuthProvider>{children}</AuthProvider>
  return <DemoSessionProvider initialUserId={initialUserId}>{children}</DemoSessionProvider>
}

function DemoSessionProvider({
  children,
  initialUserId,
}: {
  children: ReactNode
  initialUserId?: string
}) {
  const queryClient = useQueryClient()
  const demo = getDemo()
  const users = useMemo(() => demo.listDemoUsers(), [demo])
  const [userId, setUserIdState] = useState(() => {
    const id = initialUserId ?? readStoredUserId(users)
    demo.setSession(id) // antes del primer render de los hijos, para que sus consultas usen este usuario
    return id
  })

  const setUserId = useCallback(
    (id: string) => {
      demo.setSession(id)
      try {
        localStorage.setItem(STORAGE_KEY, id)
      } catch {
        // sin persistencia
      }
      setUserIdState(id)
      void queryClient.invalidateQueries()
    },
    [queryClient, demo],
  )

  const value = useMemo(
    () => ({ user: users.find((u) => u.id === userId)!, users, setUserId }),
    [users, userId, setUserId],
  )
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}
