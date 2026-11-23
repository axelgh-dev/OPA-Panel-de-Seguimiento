-- OPA Panel de Seguimiento · Fase 2 · El autor puede borrar su comentario dentro de los 15 minutos (§3.1)
-- La app usa borrado lógico (UPDATE de deleted_at); esta política cubre además el DELETE físico,
-- limitado al autor, a la ventana de 15 minutos y a comentarios sin respuestas (para no dejarlas huérfanas).
grant delete on public.comments to authenticated;

-- security definer para evitar la recursión de RLS al consultar la misma tabla.
create function public.comment_has_replies(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.comments where parent_id = c)
$$;
revoke all on function public.comment_has_replies(uuid) from public, anon;
grant execute on function public.comment_has_replies(uuid) to authenticated;

create policy comments_delete_own on public.comments for delete to authenticated
  using (
    author_id = auth.uid()
    and public.app_role() is not null
    and public.can_see_project(project_id)
    and created_at > now() - interval '15 minutes'
    and not public.comment_has_replies(id)
  );
