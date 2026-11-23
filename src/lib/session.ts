import { createContext, useContext } from 'react'
import type { Profile } from '@/data'

export interface SessionValue {
  /** Usuario con el que se está viendo la maqueta ("Ver como"). */
  user: Profile
  users: Profile[]
  setUserId: (id: string) => void
}

export const SessionContext = createContext<SessionValue | null>(null)

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession debe usarse dentro de <SessionProvider>')
  return ctx
}
