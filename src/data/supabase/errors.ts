import { DomainError } from '../errors'

interface DbError {
  message: string
  code?: string
}

/**
 * Traduce errores de Supabase a `DomainError` con mensaje en español.
 * Los `raise exception` de nuestras funciones y triggers (código P0001) ya vienen en español y se muestran tal cual.
 */
export function toDomainError(error: DbError): DomainError {
  switch (error.code) {
    case 'P0001':
      return new DomainError(error.message)
    case '42501':
      return new DomainError('No tienes permiso para realizar esta acción.')
    case '23505':
      return new DomainError(
        'Ya existe un registro con esos datos (por ejemplo, el mismo identificador).',
      )
    case '23503':
      return new DomainError(
        'Este registro está relacionado con otros datos y no se puede modificar así.',
      )
    case '23514':
    case '22P02':
    case '22007':
      return new DomainError('Revisa los datos capturados: alguno no es válido.')
    case 'PGRST301':
      return new DomainError('Tu sesión expiró. Vuelve a iniciar sesión.')
  }
  if (/fetch|network|failed to|load failed/i.test(error.message)) {
    return new DomainError(
      'No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.',
    )
  }
  console.error('[supabase]', error)
  return new DomainError('Ocurrió un error inesperado. Intenta de nuevo.')
}

/** Desempaqueta `{ data, error }` de supabase-js: lanza `DomainError` o devuelve `data`. */
export async function unwrap<T>(
  query: PromiseLike<{ data: T | null; error: DbError | null }>,
): Promise<T> {
  const { data, error } = await query
  if (error) throw toDomainError(error)
  return data as T
}
