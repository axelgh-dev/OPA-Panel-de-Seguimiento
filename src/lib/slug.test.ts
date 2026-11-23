import { slugify } from './slug'

describe('slugify', () => {
  it('quita acentos, signos y espacios', () => {
    expect(slugify('Portal de clientes: documentos fiscales')).toBe(
      'portal-de-clientes-documentos-fiscales',
    )
    expect(slugify('  Conciliación bancaria ¡ya!  ')).toBe('conciliacion-bancaria-ya')
  })

  it('devuelve vacío si no hay caracteres válidos', () => {
    expect(slugify('¿¡?!')).toBe('')
  })

  it('limita la longitud sin dejar guion al final', () => {
    const out = slugify('a'.repeat(59) + ' bbbb')
    expect(out.length).toBeLessThanOrEqual(60)
    expect(out.endsWith('-')).toBe(false)
  })
})
