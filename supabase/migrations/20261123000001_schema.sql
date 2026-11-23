-- OPA Panel de Seguimiento · Fase 2 · Esquema base (docs/REQUERIMIENTOS.md §7.1 y §7.2)

-- ---------- Enums ----------
create type public.user_role          as enum ('dev', 'opa');
create type public.project_status     as enum ('planeacion', 'en_progreso', 'en_pausa', 'en_revision', 'completado', 'cancelado');
create type public.project_health     as enum ('en_tiempo', 'en_riesgo', 'retrasado');
create type public.priority_level     as enum ('alta', 'media', 'baja');
create type public.milestone_status   as enum ('pendiente', 'en_curso', 'completado', 'retrasado');
create type public.task_status        as enum ('pendiente', 'en_progreso', 'bloqueada', 'hecha');
create type public.deliverable_status as enum ('borrador', 'en_revision', 'aprobado', 'rechazado', 'cambios_solicitados');
create type public.review_decision    as enum ('aprobado', 'rechazado', 'cambios_solicitados');
create type public.update_type        as enum ('avance', 'entrega', 'bloqueo', 'nota', 'reunion');
create type public.change_req_status  as enum ('nueva', 'en_analisis', 'aceptada', 'rechazada', 'en_progreso', 'completada');
create type public.comment_target     as enum ('project', 'deliverable', 'update', 'change_request');

-- ---------- Utilidades ----------
create function public.set_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------- Tablas ----------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  full_name    text        not null default '',
  email        text        not null,
  role         public.user_role not null default 'opa',
  job_title    text        not null default '',
  avatar_url   text,
  is_active    boolean     not null default true,
  notify_prefs jsonb       not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

create table public.projects (
  id                uuid primary key default gen_random_uuid(),
  slug              text        not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name              text        not null check (length(trim(name)) > 0),
  summary           text        not null default '',
  description_md    text        not null default '',
  status            public.project_status not null default 'planeacion',
  health            public.project_health not null default 'en_tiempo',
  priority          public.priority_level not null default 'media',
  progress_override smallint    check (progress_override between 0 and 100),
  start_date        date        not null default current_date,
  target_date       date        not null,
  is_published      boolean     not null default false,
  archived_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  check (target_date >= start_date)
);
create trigger projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

-- Reservada: en el MVP no filtra visibilidad.
create table public.project_members (
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  primary key (project_id, user_id)
);

create table public.milestones (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects (id) on delete cascade,
  name         text not null check (length(trim(name)) > 0),
  description  text not null default '',
  position     integer  not null default 0,
  weight       smallint not null default 1 check (weight >= 1),
  start_date   date     not null,
  due_date     date     not null,
  status       public.milestone_status not null default 'pendiente',
  completed_at timestamptz,
  check (due_date >= start_date)
);
create index milestones_project_idx on public.milestones (project_id, position);

create table public.tasks (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects (id) on delete cascade,
  milestone_id uuid references public.milestones (id) on delete set null,
  title        text not null check (length(trim(title)) > 0),
  status       public.task_status not null default 'pendiente',
  due_date     date,
  is_internal  boolean not null default false,
  position     integer not null default 0,
  updated_at   timestamptz not null default now()
);
create index tasks_project_idx on public.tasks (project_id, position);
create trigger tasks_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

create table public.deliverables (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects (id) on delete cascade,
  milestone_id uuid references public.milestones (id) on delete set null,
  title        text not null check (length(trim(title)) > 0),
  description  text not null default '',
  version      integer not null default 1 check (version >= 1),
  status       public.deliverable_status not null default 'borrador',
  link_url     text check (link_url is null or link_url ~* '^https?://'),
  storage_path text,
  submitted_at timestamptz,
  decided_at   timestamptz,
  created_by   uuid not null references public.profiles (id)
);
create index deliverables_project_idx on public.deliverables (project_id);

create table public.deliverable_reviews (
  id             uuid primary key default gen_random_uuid(),
  deliverable_id uuid not null references public.deliverables (id) on delete cascade,
  reviewer_id    uuid not null references public.profiles (id),
  decision       public.review_decision not null,
  comment        text not null default '',
  created_at     timestamptz not null default now()
);
create index deliverable_reviews_idx on public.deliverable_reviews (deliverable_id, created_at);

create table public.project_updates (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects (id) on delete cascade,
  author_id    uuid not null references public.profiles (id),
  type         public.update_type not null default 'avance',
  title        text not null check (length(trim(title)) > 0),
  body_md      text not null default '',
  published_at timestamptz not null default now(),
  created_at   timestamptz not null default now()
);
create index project_updates_idx on public.project_updates (project_id, published_at desc);

create table public.change_requests (
  id           uuid primary key default gen_random_uuid(),
  project_id   uuid not null references public.projects (id) on delete cascade,
  requested_by uuid not null references public.profiles (id),
  title        text not null check (length(trim(title)) > 0),
  description  text not null default '',
  priority     public.priority_level not null default 'media',
  status       public.change_req_status not null default 'nueva',
  impact_note  text,
  resolved_at  timestamptz,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index change_requests_idx on public.change_requests (project_id, created_at desc);
create trigger change_requests_updated_at before update on public.change_requests
  for each row execute function public.set_updated_at();

create table public.comments (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects (id) on delete cascade,
  target_type public.comment_target not null,
  target_id   uuid not null,
  parent_id   uuid references public.comments (id) on delete set null,
  author_id   uuid not null references public.profiles (id),
  body        text not null check (length(trim(body)) > 0 and length(body) <= 2000),
  created_at  timestamptz not null default now(),
  edited_at   timestamptz,
  deleted_at  timestamptz
);
create index comments_target_idx on public.comments (target_type, target_id, created_at);
create index comments_project_idx on public.comments (project_id);

create table public.read_receipts (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  target_type public.comment_target not null,
  target_id   uuid not null,
  read_at     timestamptz not null default now(),
  primary key (user_id, target_type, target_id)
);

create table public.activity_log (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects (id) on delete cascade,
  actor_id    uuid references public.profiles (id),
  action      text not null,
  entity_type text not null,
  entity_id   uuid,
  -- `label` guarda el texto legible del elemento (título) al momento del evento.
  meta        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index activity_log_idx on public.activity_log (project_id, created_at desc);
