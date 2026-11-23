-- OPA Panel de Seguimiento · Fase 2 · "Nuevo / sin leer" y función de anti-pausa

-- Para un usuario sin marca de lectura de un proyecto, "visto por última vez" es su fecha de alta:
-- así, al primer inicio de sesión no ve como nuevo todo lo que ya existía.
create or replace view public.project_overview with (security_invoker = true) as
select
  p.*,
  coalesce(
    p.progress_override::int,
    (select round(100.0 * coalesce(sum(m.weight) filter (where m.status = 'completado'), 0)
                  / nullif(sum(m.weight), 0))::int
       from public.milestones m where m.project_id = p.id),
    0
  ) as progress,
  (select count(*)::int from public.deliverables d
     where d.project_id = p.id and d.status = 'en_revision') as pending_deliverables,
  (select count(*)::int from public.change_requests c
     where c.project_id = p.id and c.status not in ('rechazada', 'completada')) as open_change_requests,
  (select count(*)::int from public.comments cm
     where cm.project_id = p.id and cm.deleted_at is null and cm.author_id <> auth.uid()
       and cm.created_at > coalesce(
         (select r.read_at from public.read_receipts r
            where r.user_id = auth.uid() and r.target_type = 'project' and r.target_id = p.id),
         (select pr.created_at from public.profiles pr where pr.id = auth.uid()),
         '-infinity'::timestamptz)) as unread_comments,
  greatest(
    p.updated_at,
    (select max(a.created_at) from public.activity_log a where a.project_id = p.id),
    (select max(u.published_at) from public.project_updates u where u.project_id = p.id),
    (select max(c.updated_at) from public.change_requests c where c.project_id = p.id)
  ) as last_activity_at
from public.projects p;

-- Consulta ligera sin sesión para el GitHub Action semanal que evita que el proyecto gratuito se pause.
create function public.ping() returns timestamptz
language sql stable set search_path = public as $$ select now() $$;
revoke all on function public.ping() from public;
grant execute on function public.ping() to anon, authenticated;
