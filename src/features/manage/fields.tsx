import { z } from 'zod'

/** Campos de formulario compartidos por las pantallas de captura. */
export const dateField = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Elige una fecha.')
export const optionalDateField = z
  .string()
  .refine((v) => v === '' || /^\d{4}-\d{2}-\d{2}$/.test(v), 'Elige una fecha válida.')

/** Texto del error de una mutación, o null. */
export function errorMessage(error: unknown): string | null {
  if (!error) return null
  return error instanceof Error ? error.message : 'No pudimos guardar. Intenta de nuevo.'
}
