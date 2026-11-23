-- OPA Panel de Seguimiento · Fase 2 · Funciones auxiliares, triggers y RLS (§7.3)
-- NOTA: se usa `app_role()` y no `current_role()` porque `current_role` es una función reservada de SQL.

-- ---------- Funciones auxiliares (security definer, stable, search_path fijo) ----------
create function public.app_role() returns public.user_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and is_active
$$;

create function public.is_dev() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.app_role() = 'dev', false)
$$;

create function public.is_opa() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.app_role() = 'opa', false)
$$;

create function public.can_see_project(p uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_dev()
      or (public.is_opa() and exists (
            select 1 from public.projects
            where id = p and is_published and archived_at is null))
$$;

-- Registro de actividad: solo la usan triggers y RPC (no se expone al cliente).
create function public.log_activity(
  p_project uuid, p_action text, p_entity_type text, p_entity_id uuid,
  p_label text, p_meta jsonb default '{}'::jsonb
) returns void
language sql security definer set search_path = public as $$
  insert into public.activity_log (project_id, actor_id, action, entity_type, entity_id, meta)
  values (p_project, auth.uid(), p_action, p_entity_type, p_entity_id,
          coalesce(p_meta, '{}'::jsonb) || jsonb_build_object('label', p_label))
$$;

revoke all on function public.log_activity(uuid, text, text, uuid, text, jsonb) from public, anon, authenticated;
revoke all on function public.app_role(), public.is_dev(), public.is_opa(), public.can_see_project(uuid) from public, anon;
grant execute on function public.app_role(), public.is_dev(), public.is_opa(), public.can_see_project(uuid) to authenticated;

-- Sin acceso para el rol anónimo: toda la app exige sesión.
revoke all on all tables in schema public from anon;
alter default privileges in schema public revoke all on tables from anon;

-- Defensa en profundidad: estas tablas solo se escriben por triggers y RPC (security definer),
-- así que el cliente ni siquiera tiene el privilegio. Los comentarios nunca se borran (solo borrado lógico).
revoke insert, update, delete on public.activity_log, public.deliverable_reviews from authenticated;
revoke delete on public.comments from authenticated;

-- ---------- Perfil automático al crear un usuario en auth.users ----------
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1))
  );
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Solo dev cambia `role` e `is_active`. Desde el SQL Editor (auth.uid() nulo) se permite.
create function public.guard_profiles() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null and not public.is_dev() then
    if new.role is distinct from old.role or new.is_active is distinct from old.is_active
       or new.id is distinct from old.id or new.email is distinct from old.email then
      raise exception 'Solo el desarrollador puede cambiar el rol o la activación de una cuenta.';
    end if;
  end if;
  return new;
end $$;

create trigger profiles_guard before update on public.profiles
  for each row execute function public.guard_profiles();

-- ---------- Entregables: estatus solo por RPC e inmutables al aprobarse ----------
create function public.guard_deliverables() returns trigger
language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null and new.status <> 'borrador' then
      raise exception 'Un entregable nuevo siempre empieza como borrador.';
    end if;
    return new;
  end if;
  if old.status = 'aprobado' then
    -- Un DELETE en cascada (al borrar todo el proyecto, profundidad > 1) sí se permite;
    -- borrar o modificar el entregable directamente, no.
    if tg_op = 'DELETE' and pg_trigger_depth() > 1 then
      return old;
    end if;
    raise exception 'Un entregable aprobado no se puede modificar.';
  end if;
  if tg_op = 'DELETE' then
    return old;
  end if;
  if new.status is distinct from old.status
     and coalesce(current_setting('app.rpc', true), '') <> 'on'
     and auth.uid() is not null then
    raise exception 'El estatus del entregable solo cambia con las acciones de enviar o revisar.';
  end if;
  return new;
end $$;

create trigger deliverables_guard before insert or update or delete on public.deliverables
  for each row execute function public.guard_deliverables();

-- ---------- Hitos: fecha de cierre automática y bitácora de actividad ----------
create function public.milestone_completion() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.status = 'completado' and (tg_op = 'INSERT' or old.status <> 'completado') then
    new.completed_at = coalesce(new.completed_at, now());
  elsif new.status <> 'completado' then
    new.completed_at = null;
  end if;
  return new;
end $$;

create trigger milestones_completion before insert or update on public.milestones
  for each row execute function public.milestone_completion();

create function public.milestone_activity() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'completado' and old.status <> 'completado' then
    perform public.log_activity(new.project_id, 'hito_completado', 'milestone', new.id, new.name);
  end if;
  return new;
end $$;

create trigger milestones_activity after update on public.milestones
  for each row execute function public.milestone_activity();

-- ---------- Bitácora de actividad por triggers ----------
create function public.update_activity() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.log_activity(new.project_id, 'bitacora_publicada', 'update', new.id, new.title);
  return new;
end $$;
create trigger project_updates_activity after insert on public.project_updates
  for each row execute function public.update_activity();

create function public.change_request_activity() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    perform public.log_activity(new.project_id, 'solicitud_creada', 'change_request', new.id, new.title);
  elsif new.status is distinct from old.status then
    perform public.log_activity(new.project_id, 'solicitud_estatus', 'change_request', new.id, new.title,
      jsonb_build_object('status', new.status));
  end if;
  return new;
end $$;
create trigger change_requests_activity after insert or update on public.change_requests
  for each row execute function public.change_request_activity();

create function public.comment_activity() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform public.log_activity(new.project_id, 'comentario_creado', 'comment', new.target_id, left(new.body, 80));
  return new;
end $$;
create trigger comments_activity after insert on public.comments
  for each row execute function public.comment_activity();

-- ---------- Solicitudes de cambio: qué columnas puede tocar cada rol ----------
create function public.guard_change_requests() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    -- Con sesión: el autor y el estado inicial no los decide el cliente. Sin sesión (seed/SQL Editor) se respeta lo capturado.
    if auth.uid() is not null then
      new.requested_by = auth.uid();
      new.status = 'nueva';
      new.impact_note = null;
      new.resolved_at = null;
    end if;
    return new;
  end if;
  if new.project_id is distinct from old.project_id or new.requested_by is distinct from old.requested_by then
    raise exception 'No se puede cambiar el proyecto ni el autor de la solicitud.';
  end if;
  if auth.uid() is not null and not public.is_dev() then
    if new.status is distinct from old.status
       or new.impact_note is distinct from old.impact_note
       or new.resolved_at is distinct from old.resolved_at then
      raise exception 'Solo el desarrollador puede cambiar el estatus de una solicitud.';
    end if;
    if (new.title is distinct from old.title or new.description is distinct from old.description)
       and (auth.uid() <> old.requested_by or old.status <> 'nueva') then
      raise exception 'Solo puedes editar tu solicitud mientras está en estatus nueva.';
    end if;
  end if;
  return new;
end $$;
create trigger change_requests_guard before insert or update on public.change_requests
  for each row execute function public.guard_change_requests();

-- ---------- Comentarios: ventana de 15 minutos para el autor (§3.1) ----------
create function public.guard_comments() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if auth.uid() is not null then
      new.author_id = auth.uid();
      new.edited_at = null;
      new.deleted_at = null;
    end if;
    return new;
  end if;
  if new.project_id is distinct from old.project_id or new.target_type is distinct from old.target_type
     or new.target_id is distinct from old.target_id or new.parent_id is distinct from old.parent_id
     or new.author_id is distinct from old.author_id or new.created_at is distinct from old.created_at then
    raise exception 'Solo se puede cambiar el texto del comentario.';
  end if;
  if auth.uid() is null then
    return new;
  end if;
  if old.deleted_at is not null then
    raise exception 'El comentario ya fue eliminado.';
  end if;
  if auth.uid() = old.author_id then
    if now() - old.created_at > interval '15 minutes' then
      raise exception 'Ya pasaron más de 15 minutos: el comentario ya no se puede modificar.';
    end if;
  elsif public.is_dev() then
    if new.body is distinct from old.body then
      raise exception 'Solo puedes ocultar comentarios ajenos, no editarlos.';
    end if;
  else
    raise exception 'Solo puedes modificar tus propios comentarios.';
  end if;
  if new.body is distinct from old.body then
    new.edited_at = now();
  end if;
  return new;
end $$;
create trigger comments_guard before insert or update on public.comments
  for each row execute function public.guard_comments();

-- ---------- RLS: habilitada en TODAS las tablas ----------
alter table public.profiles            enable row level security;
alter table public.projects            enable row level security;
alter table public.project_members     enable row level security;
alter table public.milestones          enable row level security;
alter table public.tasks               enable row level security;
alter table public.deliverables        enable row level security;
alter table public.deliverable_reviews enable row level security;
alter table public.project_updates     enable row level security;
alter table public.change_requests     enable row level security;
alter table public.comments            enable row level security;
alter table public.read_receipts       enable row level security;
alter table public.activity_log        enable row level security;

-- profiles
create policy profiles_select on public.profiles for select to authenticated
  using (public.app_role() is not null);
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid() and public.app_role() is not null) with check (id = auth.uid());
create policy profiles_update_dev on public.profiles for update to authenticated
  using (public.is_dev()) with check (public.is_dev());

-- projects (la prioridad para OPA va por la RPC set_project_priority)
create policy projects_select on public.projects for select to authenticated
  using (public.can_see_project(id));
create policy projects_insert on public.projects for insert to authenticated
  with check (public.is_dev());
create policy projects_update on public.projects for update to authenticated
  using (public.is_dev()) with check (public.is_dev());
create policy projects_delete on public.projects for delete to authenticated
  using (public.is_dev());

-- project_members (reservada: solo dev)
create policy project_members_dev on public.project_members for all to authenticated
  using (public.is_dev()) with check (public.is_dev());

-- milestones
create policy milestones_select on public.milestones for select to authenticated
  using (public.can_see_project(project_id));
create policy milestones_write on public.milestones for all to authenticated
  using (public.is_dev()) with check (public.is_dev());

-- tasks (is_internal oculta para OPA)
create policy tasks_select on public.tasks for select to authenticated
  using (public.is_dev() or (public.can_see_project(project_id) and not is_internal));
create policy tasks_write on public.tasks for all to authenticated
  using (public.is_dev()) with check (public.is_dev());

-- deliverables (borrador oculto para OPA; aprobado inmutable por trigger)
create policy deliverables_select on public.deliverables for select to authenticated
  using (public.is_dev() or (public.can_see_project(project_id) and status <> 'borrador'));
create policy deliverables_insert on public.deliverables for insert to authenticated
  with check (public.is_dev() and created_by = auth.uid());
create policy deliverables_update on public.deliverables for update to authenticated
  using (public.is_dev() and status <> 'aprobado') with check (public.is_dev());
create policy deliverables_delete on public.deliverables for delete to authenticated
  using (public.is_dev() and status = 'borrador');

-- deliverable_reviews (solo lectura; el insert es por RPC)
create policy reviews_select on public.deliverable_reviews for select to authenticated
  using (exists (select 1 from public.deliverables d where d.id = deliverable_id));

-- project_updates
create policy updates_select on public.project_updates for select to authenticated
  using (public.can_see_project(project_id));
create policy updates_insert on public.project_updates for insert to authenticated
  with check (public.is_dev() and author_id = auth.uid());
create policy updates_modify on public.project_updates for update to authenticated
  using (public.is_dev()) with check (public.is_dev());
create policy updates_delete on public.project_updates for delete to authenticated
  using (public.is_dev());

-- change_requests
create policy change_requests_select on public.change_requests for select to authenticated
  using (public.can_see_project(project_id));
create policy change_requests_insert on public.change_requests for insert to authenticated
  with check (public.is_opa() and public.can_see_project(project_id) and requested_by = auth.uid());
create policy change_requests_update on public.change_requests for update to authenticated
  using (public.is_dev() or (public.is_opa() and public.can_see_project(project_id)))
  with check (public.is_dev() or (public.is_opa() and public.can_see_project(project_id)));

-- comments (borrado lógico: UPDATE de deleted_at; nunca DELETE)
create policy comments_select on public.comments for select to authenticated
  using (
    public.can_see_project(project_id)
    and (target_type <> 'deliverable'
         or exists (select 1 from public.deliverables d where d.id = target_id))
  );
create policy comments_insert on public.comments for insert to authenticated
  with check (
    public.app_role() is not null
    and author_id = auth.uid()
    and public.can_see_project(project_id)
    and (target_type <> 'deliverable'
         or exists (select 1 from public.deliverables d where d.id = target_id))
  );
create policy comments_update on public.comments for update to authenticated
  using (public.can_see_project(project_id) and (author_id = auth.uid() or public.is_dev()))
  with check (public.can_see_project(project_id) and (author_id = auth.uid() or public.is_dev()));

-- read_receipts (solo propios)
create policy read_receipts_own on public.read_receipts for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- activity_log (solo lectura; se llena por triggers y RPC)
create policy activity_select on public.activity_log for select to authenticated
  using (public.can_see_project(project_id));
