-- OPA Panel de Seguimiento · Fase 2 · Vista del dashboard y RPC con lógica de negocio (§7.2, §7.3)

-- ---------- project_overview ----------
-- `security_invoker`: cada usuario ve solo lo que RLS le permite (proyectos y conteos).
-- Los hitos "actual" y "próximo" se resuelven en la capa de datos a partir de `milestones`.
create view public.project_overview with (security_invoker = true) as
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
         '-infinity'::timestamptz)) as unread_comments,
  greatest(
    p.updated_at,
    (select max(a.created_at) from public.activity_log a where a.project_id = p.id),
    (select max(u.published_at) from public.project_updates u where u.project_id = p.id),
    (select max(c.updated_at) from public.change_requests c where c.project_id = p.id)
  ) as last_activity_at
from public.projects p;

grant select on public.project_overview to authenticated;

-- ---------- RPC ----------
-- Todas validan rol y estado, y escriben en activity_log dentro de la misma transacción.

create function public.review_deliverable(
  p_deliverable_id uuid, p_decision public.review_decision, p_comment text default ''
) returns void
language plpgsql security definer set search_path = public as $$
declare
  d public.deliverables;
  v_comment text := trim(coalesce(p_comment, ''));
begin
  if not public.is_opa() then
    raise exception 'Tu rol no puede aprobar ni rechazar entregables.';
  end if;
  select * into d from public.deliverables where id = p_deliverable_id;
  if not found or not public.can_see_project(d.project_id) or d.status = 'borrador' then
    raise exception 'El entregable no existe.';
  end if;
  if d.status <> 'en_revision' then
    raise exception 'Solo se pueden revisar entregables que están en revisión.';
  end if;
  if p_decision <> 'aprobado' and length(v_comment) < 3 then
    raise exception 'Agrega un comentario para rechazar o pedir cambios.';
  end if;

  insert into public.deliverable_reviews (deliverable_id, reviewer_id, decision, comment)
  values (d.id, auth.uid(), p_decision, v_comment);

  perform set_config('app.rpc', 'on', true);
  update public.deliverables set status = p_decision::text::public.deliverable_status, decided_at = now()
   where id = d.id;
  perform set_config('app.rpc', 'off', true);

  perform public.log_activity(
    d.project_id,
    case p_decision
      when 'aprobado' then 'entregable_aprobado'
      when 'rechazado' then 'entregable_rechazado'
      else 'entregable_cambios_solicitados'
    end,
    'deliverable', d.id, d.title);
end $$;

create function public.submit_deliverable(p_deliverable_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  d public.deliverables;
begin
  if not public.is_dev() then
    raise exception 'Solo el desarrollador puede enviar entregables a revisión.';
  end if;
  select * into d from public.deliverables where id = p_deliverable_id;
  if not found then
    raise exception 'El entregable no existe.';
  end if;
  if d.status = 'en_revision' then
    raise exception 'El entregable ya está en revisión.';
  end if;
  if d.status = 'aprobado' then
    raise exception 'Un entregable aprobado no se puede modificar.';
  end if;

  perform set_config('app.rpc', 'on', true);
  update public.deliverables set status = 'en_revision', submitted_at = now(), decided_at = null
   where id = d.id;
  perform set_config('app.rpc', 'off', true);
  perform public.log_activity(d.project_id, 'entregable_enviado', 'deliverable', d.id, d.title);
end $$;

create function public.set_change_request_status(
  p_id uuid, p_status public.change_req_status,
  p_impact_note text default null, p_update_note boolean default false
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_dev() then
    raise exception 'Solo el desarrollador puede cambiar el estatus de una solicitud.';
  end if;
  update public.change_requests
     set status = p_status,
         impact_note = case when p_update_note then nullif(trim(coalesce(p_impact_note, '')), '') else impact_note end,
         resolved_at = case when p_status in ('rechazada', 'completada') then now() else null end
   where id = p_id;
  if not found then
    raise exception 'La solicitud no existe.';
  end if;
end $$;

create function public.set_project_priority(p_project_id uuid, p_priority public.priority_level) returns void
language plpgsql security definer set search_path = public as $$
declare
  p public.projects;
begin
  if public.app_role() is null or not public.can_see_project(p_project_id) then
    raise exception 'No tienes acceso a este proyecto.';
  end if;
  select * into p from public.projects where id = p_project_id;
  if p.priority is distinct from p_priority then
    update public.projects set priority = p_priority where id = p.id;
    perform public.log_activity(p.id, 'prioridad_cambiada', 'project', p.id, p.name,
      jsonb_build_object('priority', p_priority));
  end if;
end $$;

revoke all on function
  public.review_deliverable(uuid, public.review_decision, text),
  public.submit_deliverable(uuid),
  public.set_change_request_status(uuid, public.change_req_status, text, boolean),
  public.set_project_priority(uuid, public.priority_level)
from public, anon;
grant execute on function
  public.review_deliverable(uuid, public.review_decision, text),
  public.submit_deliverable(uuid),
  public.set_change_request_status(uuid, public.change_req_status, text, boolean),
  public.set_project_priority(uuid, public.priority_level)
to authenticated;
