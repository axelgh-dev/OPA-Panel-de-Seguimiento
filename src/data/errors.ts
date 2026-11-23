/** Error de negocio con mensaje listo para mostrar al usuario (español). */
export class DomainError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'DomainError'
  }
}
