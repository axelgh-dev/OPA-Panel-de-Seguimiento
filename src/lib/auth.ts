import { createContext, useContext } from 'react'
import type { Profile } from '@/data'

export type AuthStatus = 'loading' | 'anonymous' | 'authenticated'

export interface AuthValue {
  status: AuthStatus
  profile: Profile | null
  /** Vuelve a leer la sesión (tras iniciar sesión o cambiar la contraseña). */
  refresh: () => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthValue | null>(null)

/** Estado de autenticación real (solo existe con VITE_DATA_MODE=supabase). */
export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>')
  return ctx
}
