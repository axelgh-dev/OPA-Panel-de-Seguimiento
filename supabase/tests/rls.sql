-- Pruebas de RLS, triggers y RPC (docs/REQUERIMIENTOS.md §7.3 y criterios de la Fase 2).
-- Se ejecuta completo dentro de una transacción que termina en ROLLBACK: no deja datos.
--   psql "$DB_URL" -v ON_ERROR_STOP=1 -f supabase/tests/rls.sql
-- Cada aserción lanza una excepción si falla; al final imprime "RLS OK".
begin;

create schema tests;
grant usage on schema tests to public;

create function tests.login(u uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('sub', u, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', u::text, true);
  set local role authenticated;
end $$;

create function tests.logout() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', '', true);
  perform set_config('request.jwt.claim.sub', '', true);
  reset role;
end $$;

-- Cuenta filas de una consulta y compara.
create function tests.count_is(label text, q text, expected bigint) returns void language plpgsql as $$
declare n bigint;
begin
  execute 'select count(*) from (' || q || ') t' into n;
  if n is distinct from expected then
    raise exception 'FALLÓ [%]: se esperaban % filas y hay %', label, expected, n;
  end if;
  raise notice 'ok  %', label;
end $$;

-- La sentencia debe fallar (excepción) y, si se indica, el mensaje debe contener `pattern`.
create function tests.fails(label text, stmt text, pattern text default '') returns void language plpgsql as $$
begin
  begin
    execute stmt;
  exception when others then
    if pattern <> '' and position(lower(pattern) in lower(sqlerrm)) = 0 then
      raise exception 'FALLÓ [%]: error inesperado: %', label, sqlerrm;
    end if;
    raise notice 'ok  % (%)', label, left(sqlerrm, 60);
    return;
  end;
  raise exception 'FALLÓ [%]: debió fallar y no falló', label;
end $$;

-- La sentencia debe afectar exactamente `n` filas (RLS filtra en silencio los UPDATE/DELETE).
create function tests.affects(label text, stmt text, n integer) returns void language plpgsql as $$
declare c integer;
begin
  execute stmt;
  get diagnostics c = row_count;
  if c <> n then
    raise exception 'FALLÓ [%]: afectó % filas, se esperaban %', label, c, n;
  end if;
  raise notice 'ok  %', label;
end $$;

create function tests.works(label text, stmt text) returns void language plpgsql as $$
begin
  execute stmt;
  raise notice 'ok  %', label;
end $$;

-- ---------- Datos de prueba (como superusuario) ----------
insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-0000000000d1', 'axel@test.mx'),
  ('00000000-0000-0000-0000-0000000000a1', 'admin@test.mx'),
  ('00000000-0000-0000-0000-0000000000a2', 'ej1@test.mx'),
  ('00000000-0000-0000-0000-0000000000a3', 'ej2@test.mx');
update public.profiles set role = 'dev' where email = 'axel@test.mx';
update public.profiles set is_active = false where email = 'ej2@test.mx';

insert into public.projects (id, slug, name, target_date, is_published, archived_at) values
  ('10000000-0000-0000-0000-000000000001', 'publicado', 'Publicado', current_date + 30, true, null),
  ('10000000-0000-0000-0000-000000000002', 'borrador', 'Borrador', current_date + 30, false, null),
  ('10000000-0000-0000-0000-000000000003', 'archivado', 'Archivado', current_date + 30, true, now());

insert into public.milestones (id, project_id, name, start_date, due_date, weight, status) values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Hito A', current_date, current_date + 5, 1, 'completado'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Hito B', current_date, current_date + 9, 3, 'pendiente'),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'Hito C', current_date, current_date + 9, 1, 'pendiente');

insert into public.tasks (project_id, title, is_internal) values
  ('10000000-0000-0000-0000-000000000001', 'Tarea visible', false),
  ('10000000-0000-0000-0000-000000000001', 'Tarea interna', true);

insert into public.deliverables (id, project_id, title, status, created_by, submitted_at) values
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Borrador', 'borrador', '00000000-0000-0000-0000-0000000000d1', null),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'En revisión', 'en_revision', '00000000-0000-0000-0000-0000000000d1', now()),
  ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Aprobado', 'aprobado', '00000000-0000-0000-0000-0000000000d1', now()),
  ('30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'En revisión 2', 'en_revision', '00000000-0000-0000-0000-0000000000d1', now()),
  ('30000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', 'De proyecto borrador', 'en_revision', '00000000-0000-0000-0000-0000000000d1', now());

insert into public.project_updates (project_id, author_id, title) values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000d1', 'Avance publicado'),
  ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000d1', 'Avance de proyecto borrador');

-- ---------- Estructura ----------
select tests.count_is('todas las tablas de public tienen RLS habilitado',
  $q$select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity$q$, 0);
select tests.count_is('hay 4 perfiles creados por trigger', 'select 1 from public.profiles', 4);

-- ---------- Anónimo ----------
set local role anon;
select tests.fails('anon no puede leer proyectos', 'select * from public.projects', 'permission denied');
select tests.fails('anon no puede leer la vista', 'select * from public.project_overview', 'permission denied');
reset role;

-- ---------- OPA (Admin OPA) ----------
select tests.login('00000000-0000-0000-0000-0000000000a1');
select tests.count_is('OPA ve solo proyectos publicados y no archivados', 'select 1 from public.projects', 1);
select tests.count_is('OPA: la vista project_overview respeta RLS', 'select 1 from public.project_overview', 1);
select tests.count_is('OPA: progreso ponderado = 25%', 'select 1 from public.project_overview where progress = 25', 1);
select tests.count_is('OPA no ve hitos de proyectos no publicados', 'select 1 from public.milestones', 2);
select tests.count_is('OPA no ve tareas internas', 'select 1 from public.tasks', 1);
select tests.count_is('OPA no ve entregables en borrador ni de proyectos no publicados', 'select 1 from public.deliverables', 3);
select tests.count_is('OPA no ve bitácora de proyectos no publicados', 'select 1 from public.project_updates', 1);
select tests.fails('OPA no puede crear proyectos',
  $q$insert into public.projects (slug, name, target_date) values ('x', 'X', current_date + 1)$q$, 'row-level security');
select tests.affects('OPA no puede editar proyectos',
  $q$update public.projects set name = 'Hackeado'$q$, 0);
select tests.affects('OPA no puede borrar proyectos', 'delete from public.projects', 0);
select tests.affects('OPA no puede editar hitos', $q$update public.milestones set name = 'x'$q$, 0);
select tests.affects('OPA no puede editar tareas', $q$update public.tasks set title = 'x'$q$, 0);
select tests.fails('OPA no puede publicar bitácora',
  $q$insert into public.project_updates (project_id, author_id, title) values ('10000000-0000-0000-0000-000000000001', auth.uid(), 'x')$q$, 'row-level security');
select tests.fails('OPA no puede crear entregables',
  $q$insert into public.deliverables (project_id, title, created_by) values ('10000000-0000-0000-0000-000000000001', 'x', auth.uid())$q$, 'row-level security');
select tests.affects('OPA no puede cambiar el estatus de un entregable directo',
  $q$update public.deliverables set status = 'aprobado' where id = '30000000-0000-0000-0000-000000000002'$q$, 0);
select tests.fails('OPA no puede cambiar su propio rol',
  $q$update public.profiles set role = 'dev' where id = auth.uid()$q$, 'solo el desarrollador');
select tests.fails('OPA no puede escribir en activity_log',
  $q$insert into public.activity_log (project_id, action, entity_type) values ('10000000-0000-0000-0000-000000000001', 'x', 'x')$q$, 'permission denied');
select tests.fails('OPA no puede insertar reseñas a mano',
  $q$insert into public.deliverable_reviews (deliverable_id, reviewer_id, decision) values ('30000000-0000-0000-0000-000000000002', auth.uid(), 'aprobado')$q$, 'permission denied');

-- Aprobar / rechazar entregables
select tests.fails('OPA no puede revisar un borrador',
  $q$select public.review_deliverable('30000000-0000-0000-0000-000000000001', 'aprobado', '')$q$, 'no existe');
select tests.fails('OPA no puede revisar un entregable de proyecto no publicado',
  $q$select public.review_deliverable('30000000-0000-0000-0000-000000000005', 'aprobado', '')$q$, 'no existe');
select tests.fails('OPA no puede revisar un entregable ya aprobado',
  $q$select public.review_deliverable('30000000-0000-0000-0000-000000000003', 'rechazado', 'no')$q$, 'en revisión');
select tests.fails('rechazar exige comentario',
  $q$select public.review_deliverable('30000000-0000-0000-0000-000000000002', 'rechazado', '')$q$, 'comentario');
select tests.works('OPA aprueba un entregable en revisión',
  $q$select public.review_deliverable('30000000-0000-0000-0000-000000000002', 'aprobado', 'Todo bien')$q$);
select tests.count_is('queda la decisión en deliverable_reviews',
  $q$select 1 from public.deliverable_reviews where deliverable_id = '30000000-0000-0000-0000-000000000002' and decision = 'aprobado'$q$, 1);
select tests.count_is('queda el evento en activity_log',
  $q$select 1 from public.activity_log where action = 'entregable_aprobado' and actor_id = auth.uid()$q$, 1);
select tests.works('OPA pide cambios en otro entregable',
  $q$select public.review_deliverable('30000000-0000-0000-0000-000000000004', 'cambios_solicitados', 'Falta el anexo')$q$);

-- Prioridad
select tests.works('OPA cambia la prioridad de un proyecto visible',
  $q$select public.set_project_priority('10000000-0000-0000-0000-000000000001', 'alta')$q$);
select tests.fails('OPA no cambia prioridad de un proyecto no publicado',
  $q$select public.set_project_priority('10000000-0000-0000-0000-000000000002', 'alta')$q$, 'no tienes acceso');

-- Solicitudes de cambio
select tests.works('OPA crea una solicitud de cambio',
  $q$insert into public.change_requests (project_id, requested_by, title, description) values ('10000000-0000-0000-0000-000000000001', auth.uid(), 'Agregar reporte', 'Detalle')$q$);
select tests.fails('OPA no crea solicitudes en proyectos no publicados',
  $q$insert into public.change_requests (project_id, requested_by, title) values ('10000000-0000-0000-0000-000000000002', auth.uid(), 'x')$q$, 'row-level security');
select tests.works('al crear una solicitud, el autor siempre es quien la crea (no se puede suplantar)',
  $q$insert into public.change_requests (project_id, requested_by, title) values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a2', 'Suplantada')$q$);
select tests.count_is('la solicitud suplantada quedó a nombre del usuario real',
  $q$select 1 from public.change_requests where title = 'Suplantada' and requested_by = auth.uid()$q$, 1);
select tests.works('el autor edita su solicitud mientras es nueva',
  $q$update public.change_requests set title = 'Agregar reporte mensual'$q$);
select tests.fails('OPA no cambia el estatus de una solicitud',
  $q$update public.change_requests set status = 'aceptada'$q$, 'solo el desarrollador');
select tests.fails('OPA no usa la RPC de estatus',
  $q$select public.set_change_request_status((select id from public.change_requests limit 1), 'aceptada')$q$, 'solo el desarrollador');
select tests.count_is('la solicitud quedó en activity_log',
  $q$select 1 from public.activity_log where action = 'solicitud_creada'$q$, 2);

-- Comentarios
select tests.works('OPA comenta en un proyecto visible',
  $q$insert into public.comments (project_id, target_type, target_id, author_id, body) values ('10000000-0000-0000-0000-000000000001', 'project', '10000000-0000-0000-0000-000000000001', auth.uid(), 'Hola')$q$);
select tests.fails('OPA no comenta en un proyecto no publicado',
  $q$insert into public.comments (project_id, target_type, target_id, author_id, body) values ('10000000-0000-0000-0000-000000000002', 'project', '10000000-0000-0000-0000-000000000002', auth.uid(), 'Hola')$q$, 'row-level security');
select tests.fails('OPA no comenta un entregable en borrador',
  $q$insert into public.comments (project_id, target_type, target_id, author_id, body) values ('10000000-0000-0000-0000-000000000001', 'deliverable', '30000000-0000-0000-0000-000000000001', auth.uid(), 'Hola')$q$, 'row-level security');
select tests.works('un comentario siempre queda a nombre de quien lo escribe (no se puede suplantar)',
  $q$insert into public.comments (project_id, target_type, target_id, author_id, body) values ('10000000-0000-0000-0000-000000000001', 'project', '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a2', 'Suplantado')$q$);
select tests.count_is('el comentario suplantado quedó a nombre del usuario real',
  $q$select 1 from public.comments where body = 'Suplantado' and author_id = auth.uid()$q$, 1);
select tests.works('el autor edita su comentario dentro de 15 min',
  $q$update public.comments set body = 'Hola editado' where body = 'Hola'$q$);
select tests.count_is('al editar queda edited_at',
  'select 1 from public.comments where edited_at is not null', 1);
select tests.works('el autor borra su comentario (borrado lógico) dentro de 15 min',
  $q$update public.comments set deleted_at = now() where body = 'Hola editado'$q$);
select tests.works('el autor borra físicamente un comentario propio reciente sin respuestas',
  $q$insert into public.comments (project_id, target_type, target_id, author_id, body) values ('10000000-0000-0000-0000-000000000001', 'project', '10000000-0000-0000-0000-000000000001', auth.uid(), 'Para borrar')$q$);
select tests.affects('DELETE: el autor borra su comentario dentro de 15 min',
  $q$delete from public.comments where body = 'Para borrar'$q$, 1);
select tests.works('OPA marca como leído un proyecto',
  $q$insert into public.read_receipts (user_id, target_type, target_id) values (auth.uid(), 'project', '10000000-0000-0000-0000-000000000001')$q$);
select tests.fails('OPA no escribe recibos de otro usuario',
  $q$insert into public.read_receipts (user_id, target_type, target_id) values ('00000000-0000-0000-0000-0000000000a2', 'project', '10000000-0000-0000-0000-000000000001')$q$, 'row-level security');
select tests.logout();

-- Pasan 20 minutos: el comentario de Ejecutivo 1 ya no se puede editar.
insert into public.comments (id, project_id, target_type, target_id, author_id, body, created_at) values
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'project',
   '10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a2', 'Comentario viejo', now() - interval '20 minutes');

-- ---------- Ejecutivo 1 (otra cuenta OPA, mismos permisos) ----------
select tests.login('00000000-0000-0000-0000-0000000000a2');
select tests.count_is('Ejecutivo 1 tiene los mismos permisos de lectura', 'select 1 from public.projects', 1);
select tests.fails('no edita un comentario pasados 15 min',
  $q$update public.comments set body = 'tarde' where id = '40000000-0000-0000-0000-000000000001'$q$, '15 minutos');
select tests.affects('no edita comentarios ajenos',
  $q$update public.comments set body = 'x' where author_id = '00000000-0000-0000-0000-0000000000a1'$q$, 0);
select tests.affects('DELETE: no borra comentarios ajenos',
  $q$delete from public.comments where author_id = '00000000-0000-0000-0000-0000000000a1'$q$, 0);
select tests.affects('DELETE: no borra su comentario pasados 15 min',
  $q$delete from public.comments where id = '40000000-0000-0000-0000-000000000001'$q$, 0);
select tests.count_is('no ve recibos de lectura ajenos', 'select 1 from public.read_receipts', 0);
select tests.works('también puede aprobar (todas las cuentas OPA igual)',
  $q$select public.set_project_priority('10000000-0000-0000-0000-000000000001', 'baja')$q$);
select tests.logout();

-- ---------- Ejecutivo 2 desactivado ----------
select tests.login('00000000-0000-0000-0000-0000000000a3');
select tests.count_is('cuenta desactivada no ve proyectos', 'select 1 from public.projects', 0);
select tests.count_is('cuenta desactivada no ve perfiles', 'select 1 from public.profiles', 0);
select tests.fails('cuenta desactivada no puede comentar',
  $q$insert into public.comments (project_id, target_type, target_id, author_id, body) values ('10000000-0000-0000-0000-000000000001', 'project', '10000000-0000-0000-0000-000000000001', auth.uid(), 'Hola')$q$, 'row-level security');
select tests.logout();

-- ---------- Dev (Axel) ----------
select tests.login('00000000-0000-0000-0000-0000000000d1');
select tests.count_is('dev ve todos los proyectos', 'select 1 from public.projects', 3);
select tests.count_is('dev ve tareas internas', 'select 1 from public.tasks', 2);
select tests.count_is('dev ve borradores', $q$select 1 from public.deliverables where status = 'borrador'$q$, 1);
select tests.fails('dev NO puede aprobar entregables',
  $q$select public.review_deliverable('30000000-0000-0000-0000-000000000004', 'aprobado', '')$q$, 'tu rol');
select tests.fails('dev no cambia el estatus de un entregable a mano',
  $q$update public.deliverables set status = 'aprobado' where id = '30000000-0000-0000-0000-000000000004'$q$, 'solo cambia');
select tests.affects('un entregable aprobado no se puede modificar (RLS)',
  $q$update public.deliverables set title = 'Nuevo título' where id = '30000000-0000-0000-0000-000000000003'$q$, 0);
select tests.affects('un entregable aprobado no se puede borrar (RLS)',
  $q$delete from public.deliverables where id = '30000000-0000-0000-0000-000000000003'$q$, 0);
select tests.fails('un entregable nuevo no puede nacer aprobado',
  $q$insert into public.deliverables (project_id, title, status, created_by) values ('10000000-0000-0000-0000-000000000001', 'x', 'aprobado', auth.uid())$q$, 'borrador');
select tests.works('dev crea un entregable (borrador)',
  $q$insert into public.deliverables (project_id, title, created_by) values ('10000000-0000-0000-0000-000000000001', 'Nuevo', auth.uid())$q$);
select tests.works('dev reenvía a revisión el que tiene cambios solicitados',
  $q$select public.submit_deliverable('30000000-0000-0000-0000-000000000004')$q$);
select tests.fails('dev no reenvía uno aprobado',
  $q$select public.submit_deliverable('30000000-0000-0000-0000-000000000003')$q$, 'aprobado');
select tests.works('dev crea un proyecto',
  $q$insert into public.projects (slug, name, target_date) values ('nuevo', 'Nuevo', current_date + 10)$q$);
select tests.works('dev edita un proyecto', $q$update public.projects set summary = 'ok' where slug = 'nuevo'$q$);
select tests.works('dev crea hitos', $q$insert into public.milestones (project_id, name, start_date, due_date) select id, 'H', current_date, current_date + 2 from public.projects where slug = 'nuevo'$q$);
select tests.works('dev publica bitácora',
  $q$insert into public.project_updates (project_id, author_id, title) values ('10000000-0000-0000-0000-000000000001', auth.uid(), 'Avance')$q$);
select tests.works('dev cambia el estatus de la solicitud con RPC',
  $q$select public.set_change_request_status((select id from public.change_requests limit 1), 'en_analisis', 'Impacto bajo', true)$q$);
select tests.count_is('queda impact_note y estatus',
  $q$select 1 from public.change_requests where status = 'en_analisis' and impact_note = 'Impacto bajo'$q$, 1);
select tests.works('dev oculta un comentario ajeno',
  $q$update public.comments set deleted_at = now() where id = '40000000-0000-0000-0000-000000000001'$q$);
select tests.fails('dev no edita el texto de un comentario ajeno',
  $q$update public.comments set body = 'x' where author_id = '00000000-0000-0000-0000-0000000000a1'$q$, 'ocultar');
select tests.works('dev cambia el rol de otra cuenta',
  $q$update public.profiles set job_title = 'Ejecutivo' where email = 'ej1@test.mx'$q$);
select tests.fails('dev no puede borrar activity_log',
  'delete from public.activity_log', 'permission denied');
select tests.logout();

-- El trigger protege al aprobado incluso sin RLS (superusuario / SQL Editor).
select tests.fails('trigger: un entregable aprobado no se puede modificar ni con privilegios altos',
  $q$update public.deliverables set title = 'x' where id = '30000000-0000-0000-0000-000000000003'$q$, 'aprobado');
select tests.fails('trigger: un entregable aprobado no se puede borrar ni con privilegios altos',
  $q$delete from public.deliverables where id = '30000000-0000-0000-0000-000000000003'$q$, 'aprobado');

-- Completar un hito deja la fecha de cierre y el evento.
select tests.works('completar un hito escribe completed_at',
  $q$update public.milestones set status = 'completado' where id = '20000000-0000-0000-0000-000000000002'$q$);
select tests.count_is('completed_at se llena y hay evento hito_completado',
  $q$select 1 from public.milestones m where id = '20000000-0000-0000-0000-000000000002' and completed_at is not null$q$, 1);

do $$ begin raise notice 'RLS OK'; end $$;
rollback;
