import type { AuthApi } from '../adapter'
import { DomainError } from '../errors'
import type { Profile } from '../types'
import { supabase } from './client'

const PROFILE_COLS = 'id, full_name, email, role, job_title, avatar_url, is_active, created_at'

function authError(message: string): DomainError {
  if (/invalid login credentials/i.test(message)) {
    return new DomainError('Correo o contraseña incorrectos.')
  }
  if (/rate limit|too many/i.test(message)) {
    return new DomainError('Demasiados intentos. Espera unos minutos e inténtalo de nuevo.')
  }
  if (/password should be|weak/i.test(message)) {
    return new DomainError('La contraseña es muy débil. Usa al menos 8 caracteres.')
  }
  if (/fetch|network/i.test(message)) {
    return new DomainError('No pudimos conectar con el servidor. Revisa tu conexión.')
  }
  if (/same password/i.test(message)) {
    return new DomainError('La nueva contraseña debe ser distinta a la anterior.')
  }
  console.error('[supabase auth]', message)
  return new DomainError('Ocurrió un error inesperado. Intenta de nuevo.')
}

async function fetchProfile(userId: string): Promise<Profile | null> {
  // RLS: una cuenta desactivada no puede leer ni su propio perfil, así que llega null.
  const { data } = await supabase
    .from('profiles')
    .select(PROFILE_COLS)
    .eq('id', userId)
    .maybeSingle()
  return (data as Profile | null) ?? null
}

export const auth: AuthApi = {
  async getSessionProfile() {
    const { data } = await supabase.auth.getSession()
    if (!data.session) return null
    const profile = await fetchProfile(data.session.user.id)
    if (!profile) {
      await supabase.auth.signOut()
      return null
    }
    return profile
  },

  onAuthChange(callback) {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      // Renovar el token no cambia al usuario; todo lo demás (incluida INITIAL_SESSION) sí interesa.
      if (event !== 'TOKEN_REFRESHED') callback()
    })
    return () => data.subscription.unsubscribe()
  },

  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw authError(error.message)
    const profile = await fetchProfile(data.user.id)
    if (!profile) {
      await supabase.auth.signOut()
      throw new DomainError('Tu cuenta está desactivada. Contacta al administrador.')
    }
  },

  async signOut() {
    await supabase.auth.signOut()
  },

  async requestPasswordReset(email) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/restablecer`,
    })
    if (error) throw authError(error.message)
  },

  async updatePassword(newPassword) {
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw authError(error.message)
  },
}
