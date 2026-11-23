-- OPA Panel de Seguimiento · Fase 2 · Un dev no puede quitarse el acceso a sí mismo
-- (evita quedarse sin ninguna cuenta con permisos de administración desde la propia interfaz).
create or replace function public.guard_profiles() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is not null then
    if not public.is_dev() then
      if new.role is distinct from old.role or new.is_active is distinct from old.is_active
         or new.id is distinct from old.id or new.email is distinct from old.email then
        raise exception 'Solo el desarrollador puede cambiar el rol o la activación de una cuenta.';
      end if;
    elsif auth.uid() = old.id
          and (new.role is distinct from old.role or new.is_active is distinct from old.is_active) then
      raise exception 'No puedes desactivar tu propia cuenta ni quitarte el rol de desarrollador.';
    end if;
  end if;
  return new;
end $$;
