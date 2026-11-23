import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { auth } from '@/data'
import { AuthContext, type AuthStatus } from '@/lib/auth'
import type { Profile } from '@/data'

/** Sesión real con Supabase Auth: lee la sesión al cargar y reacciona a inicios y cierres. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [state, setState] = useState<{ status: AuthStatus; profile: Profile | null }>({
    status: 'loading',
    profile: null,
  })
  const lastUserId = useRef<string | null>(null)

  const refresh = useCallback(async () => {
    let profile: Profile | null = null
    try {
      profile = (await auth?.getSessionProfile()) ?? null
    } catch {
      profile = null
    }
    // Otro usuario (o ninguno): se descarta la caché para no mezclar datos entre sesiones.
    if ((profile?.id ?? null) !== lastUserId.current) {
      lastUserId.current = profile?.id ?? null
      queryClient.clear()
    }
    setState(
      profile ? { status: 'authenticated', profile } : { status: 'anonymous', profile: null },
    )
  }, [queryClient])

  useEffect(() => {
    // supabase-js emite INITIAL_SESSION al suscribirse, así que esto también hace la lectura inicial.
    // setTimeout: pide no llamar a su API de forma síncrona dentro del callback.
    return auth?.onAuthChange(() => setTimeout(() => void refresh(), 0))
  }, [refresh])

  const signOut = useCallback(async () => {
    await auth?.signOut()
    await refresh()
  }, [refresh])

  const value = useMemo(() => ({ ...state, refresh, signOut }), [state, refresh, signOut])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
