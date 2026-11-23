/**
 * Verifica que el bundle de producción (dist/) no contenga la service_role (criterio de la Fase 2).
 * Busca la palabra "service_role" y cualquier JWT cuyo payload tenga role = service_role.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = new URL('../dist', import.meta.url).pathname

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) yield* files(path)
    else yield path
  }
}

const problems = []
let scanned = 0
for (const file of files(root)) {
  if (!/\.(js|mjs|css|html|map|json|txt)$/.test(file)) continue
  scanned += 1
  const text = readFileSync(file, 'utf8')
  if (/service_role/i.test(text)) problems.push(`${file}: contiene "service_role"`)
  for (const [token] of text.matchAll(/eyJ[\w-]{10,}\.eyJ[\w-]{10,}\.[\w-]{10,}/g)) {
    try {
      const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'))
      if (payload.role === 'service_role') problems.push(`${file}: JWT con role=service_role`)
    } catch {
      // no era un JWT
    }
  }
}

if (scanned === 0) {
  console.error('No hay archivos en dist/. Corre `npm run build` primero.')
  process.exit(1)
}
if (problems.length > 0) {
  console.error(problems.join('\n'))
  process.exit(1)
}
console.log(`Sin service_role en el bundle (${scanned} archivos revisados).`)
