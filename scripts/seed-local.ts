/**
 * Siembra la base de Supabase LOCAL (Docker) con los 5 proyectos de ejemplo de la maqueta y 4 usuarios de prueba.
 * Por seguridad solo corre contra localhost: nunca contra tu proyecto de Supabase en la nube.
 *
 *   npm run db:start && npm run db:seed
 *
 * Usa la service_role LOCAL que entrega `supabase status`; esa clave no sale de este script.
 */
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'node:crypto'
import { execSync } from 'node:child_process'
import { getDb } from '../src/data/mock/db'

const status = JSON.parse(
  execSync('npx supabase status -o json', {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  }),
) as { API_URL: string; SERVICE_ROLE_KEY: string }

const url = new URL(status.API_URL)
if (!['127.0.0.1', 'localhost'].includes(url.hostname)) {
  throw new Error(`Este script solo siembra bases locales; el API es ${url.hostname}.`)
}

const PASSWORD = 'Opa-local-2026'
const USERS = [
  { mockId: 'u-axel', email: 'axel@local.test' },
  { mockId: 'u-admin', email: 'admin@local.test' },
  { mockId: 'u-ej1', email: 'ejecutivo1@local.test' },
  { mockId: 'u-ej2', email: 'ejecutivo2@local.test' },
]

const sb = createClient(status.API_URL, status.SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
})
const db = getDb()

/** UUID determinista a partir de un id de la maqueta (así el seed es reproducible). */
function uuid(mockId: string): string {
  const h = createHash('sha1').update(`opa:${mockId}`).digest('hex')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-4${h.slice(13, 16)}-8${h.slice(17, 20)}-${h.slice(20, 32)}`
}

async function ok<T>(
  label: string,
  p: PromiseLike<{ data: T; error: { message: string } | null }>,
) {
  const { data, error } = await p
  if (error) throw new Error(`${label}: ${error.message}`)
  return data
}

async function main() {
  // 1) Limpieza (los proyectos arrastran todo lo demás por cascada).
  await ok('limpiar proyectos', sb.from('projects').delete().not('id', 'is', null))
  const existing = await sb.auth.admin.listUsers({ perPage: 200 })
  for (const u of existing.data.users) {
    if (USERS.some((x) => x.email === u.email)) await sb.auth.admin.deleteUser(u.id)
  }

  // 2) Usuarios (el trigger crea el perfil; luego se ajusta rol y cargo).
  const userId = new Map<string, string>()
  for (const u of USERS) {
    const profile = db.profiles.find((p) => p.id === u.mockId)!
    const { data, error } = await sb.auth.admin.createUser({
      email: u.email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: profile.full_name },
    })
    if (error) throw new Error(`crear ${u.email}: ${error.message}`)
    userId.set(u.mockId, data.user.id)
    await ok(
      `perfil ${u.email}`,
      sb
        .from('profiles')
        .update({ role: profile.role, job_title: profile.job_title, full_name: profile.full_name })
        .eq('id', data.user.id),
    )
  }
  const U = (mockId: string) =>
    userId.get(mockId) ??
    (() => {
      throw new Error(`usuario ${mockId}`)
    })()

  // 3) Datos de negocio
  await ok(
    'projects',
    sb.from('projects').insert(db.projects.map((p) => ({ ...p, id: uuid(p.id) }))),
  )
  await ok(
    'milestones',
    sb
      .from('milestones')
      .insert(db.milestones.map((m) => ({ ...m, id: uuid(m.id), project_id: uuid(m.project_id) }))),
  )
  await ok(
    'tasks',
    sb.from('tasks').insert(
      db.tasks.map((t) => ({
        ...t,
        id: uuid(t.id),
        project_id: uuid(t.project_id),
        milestone_id: t.milestone_id ? uuid(t.milestone_id) : null,
      })),
    ),
  )
  await ok(
    'deliverables',
    sb.from('deliverables').insert(
      db.deliverables.map((d) => ({
        ...d,
        id: uuid(d.id),
        project_id: uuid(d.project_id),
        milestone_id: d.milestone_id ? uuid(d.milestone_id) : null,
        created_by: U(d.created_by),
      })),
    ),
  )
  await ok(
    'deliverable_reviews',
    sb.from('deliverable_reviews').insert(
      db.reviews.map((r) => ({
        ...r,
        id: uuid(r.id),
        deliverable_id: uuid(r.deliverable_id),
        reviewer_id: U(r.reviewer_id),
      })),
    ),
  )
  await ok(
    'project_updates',
    sb.from('project_updates').insert(
      db.updates.map((u) => ({
        ...u,
        id: uuid(u.id),
        project_id: uuid(u.project_id),
        author_id: U(u.author_id),
      })),
    ),
  )
  await ok(
    'change_requests',
    sb.from('change_requests').insert(
      db.changeRequests.map((c) => ({
        ...c,
        id: uuid(c.id),
        project_id: uuid(c.project_id),
        requested_by: U(c.requested_by),
      })),
    ),
  )
  // Comentarios: primero los raíz, luego las respuestas (por la clave foránea parent_id).
  const comment = (c: (typeof db.comments)[number]) => ({
    ...c,
    id: uuid(c.id),
    project_id: uuid(c.project_id),
    target_id: uuid(c.target_id),
    parent_id: c.parent_id ? uuid(c.parent_id) : null,
    author_id: U(c.author_id),
  })
  await ok(
    'comments (raíz)',
    sb.from('comments').insert(db.comments.filter((c) => !c.parent_id).map(comment)),
  )
  const replies = db.comments.filter((c) => c.parent_id)
  if (replies.length)
    await ok('comments (respuestas)', sb.from('comments').insert(replies.map(comment)))

  // 4) Actividad: los triggers ya escribieron eventos con la hora de hoy; se reemplazan por los de la maqueta.
  await ok('limpiar activity_log', sb.from('activity_log').delete().not('id', 'is', null))
  const entityIds = new Map<string, string>(
    [...db.projects, ...db.deliverables, ...db.updates, ...db.changeRequests, ...db.milestones].map(
      (x) => [x.id, uuid(x.id)],
    ),
  )
  await ok(
    'activity_log',
    sb.from('activity_log').insert(
      db.activity.map((e) => ({
        id: uuid(e.id),
        project_id: uuid(e.project_id),
        actor_id: U(e.actor_id),
        action: e.action,
        entity_type: e.entity_type,
        entity_id: entityIds.get(e.entity_id) ?? uuid(e.entity_id),
        meta: { ...e.meta, label: e.entity_label },
        created_at: e.created_at,
      })),
    ),
  )

  // 5) Lecturas: todos vieron el panel hace dos días (igual que la maqueta).
  await ok(
    'read_receipts',
    sb.from('read_receipts').insert(
      USERS.flatMap((u) =>
        db.projects.map((p) => ({
          user_id: U(u.mockId),
          target_type: 'project',
          target_id: uuid(p.id),
          read_at: db.defaultReadAt[u.mockId],
        })),
      ),
    ),
  )

  console.log('\nBase local sembrada.\n')
  console.log('Usuarios de prueba (contraseña común):', PASSWORD)
  for (const u of USERS) {
    const p = db.profiles.find((x) => x.id === u.mockId)!
    console.log(`  ${p.role === 'dev' ? 'dev' : 'opa'}  ${u.email}  (${p.full_name})`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
