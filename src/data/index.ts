/**
 * API pública de datos. Es lo ÚNICO que la UI puede importar (AGENT.md, regla 1).
 *
 * `VITE_DATA_MODE` elige el adaptador:
 *  - `mock` (por defecto): datos de ejemplo en memoria, para la demo y las pruebas.
 *  - `supabase`: datos reales con Supabase (Auth + RLS + RPC).
 * Ambos implementan `DataAdapter`, así que los hooks y componentes no cambian.
 * Se carga solo el adaptador elegido: en producción el mock no entra al bundle.
 */
import type { AuthApi, DataAdapter } from './adapter'
import type { DemoControls } from './mock/adapter'

export * from './types'
export { DomainError } from './errors'
export type { AuthApi } from './adapter'
export type { DemoControls }

export type DataMode = 'mock' | 'supabase'
export const dataMode: DataMode =
  import.meta.env.VITE_DATA_MODE === 'supabase' ? 'supabase' : 'mock'

/** El selector "Ver como" solo existe en la demo (mock + `VITE_DEMO_MODE=true`). */
export const isDemoMode = dataMode === 'mock' && import.meta.env.VITE_DEMO_MODE === 'true'

const loaded =
  dataMode === 'supabase'
    ? await import('./supabase').then((m) => ({ adapter: m.adapter, auth: m.auth, demo: null }))
    : await import('./mock/adapter').then((m) => ({
        adapter: m.adapter,
        auth: null,
        demo: m.demo,
      }))

const impl: DataAdapter = loaded.adapter

/** Autenticación real; null en modo mock. */
export const auth: AuthApi | null = loaded.auth

/** Controles del modo demo (cambiar de usuario, reiniciar datos, latencia); null con Supabase. */
export function getDemo(): DemoControls {
  if (!loaded.demo) throw new Error('Los controles de demo solo existen con VITE_DATA_MODE=mock.')
  return loaded.demo
}

export const {
  getProfiles,
  getProjects,
  getProject,
  getMilestones,
  getTasks,
  getDeliverables,
  getUpdates,
  getChangeRequests,
  getComments,
  getActivity,
  getDashboardKpis,
  reviewDeliverable,
  submitDeliverable,
  addComment,
  editComment,
  deleteComment,
  createChangeRequest,
  setChangeRequestStatus,
  setProjectPriority,
  updateTaskStatus,
  markProjectRead,
} = impl
