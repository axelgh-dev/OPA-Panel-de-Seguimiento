import { createContext, useContext } from 'react'
import type { Profile } from '@/data'

export interface SessionValue {
  /** Usuario con sesión activa (en la demo, el elegido en "Ver como"). */
  user: Profile
  users: Profile[]
  /** Solo en la demo: cambia el usuario. En producción no hace nada. */
  setUserId: (id: string) => void
  /** Cierra la sesión (solo con Supabase). */
  signOut?: () => Promise<void>
}

export const SessionContext = createContext<SessionValue | null>(null)

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession debe usarse dentro de <SessionProvider>')
  return ctx
}
