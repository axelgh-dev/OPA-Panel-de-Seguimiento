import type { Profile } from '../types'
import { t } from './dates'

export const AXEL_ID = 'u-axel'
export const ADMIN_ID = 'u-admin'
export const EJ1_ID = 'u-ej1'
export const EJ2_ID = 'u-ej2'

export const profiles: Profile[] = [
  {
    id: AXEL_ID,
    full_name: 'Axel',
    email: 'axel@ejemplo.mx',
    role: 'dev',
    job_title: 'Desarrollador',
    avatar_url: null,
    is_active: true,
    created_at: t(-140),
  },
  {
    id: ADMIN_ID,
    full_name: 'Admin OPA',
    email: 'admin@opasesores.ejemplo',
    role: 'opa',
    job_title: 'Gerente del despacho',
    avatar_url: null,
    is_active: true,
    created_at: t(-140),
  },
  {
    id: EJ1_ID,
    full_name: 'Ejecutivo 1',
    email: 'ejecutivo1@opasesores.ejemplo',
    role: 'opa',
    job_title: 'Administración',
    avatar_url: null,
    is_active: true,
    created_at: t(-130),
  },
  {
    id: EJ2_ID,
    full_name: 'Ejecutivo 2',
    email: 'ejecutivo2@opasesores.ejemplo',
    role: 'opa',
    job_title: 'Administración',
    avatar_url: null,
    is_active: true,
    created_at: t(-130),
  },
]
