-- OPA Panel de Seguimiento · Fase 2 · Storage de entregables (§7.2)
-- Bucket privado; ruta `{project_id}/{deliverable_id}/{archivo}`; descarga con URL firmada.
insert into storage.buckets (id, name, public, file_size_limit)
values ('deliverables', 'deliverables', false, 20971520)  -- 20 MB
on conflict (id) do update set public = false, file_size_limit = 20971520;

-- Lectura: quien puede ver el proyecto y el entregable (RLS de deliverables oculta los borradores a OPA).
create policy deliverables_files_read on storage.objects for select to authenticated
  using (
    bucket_id = 'deliverables'
    and exists (
      select 1 from public.deliverables d
      where d.id::text = (storage.foldername(name))[2]
        and d.project_id::text = (storage.foldername(name))[1]
    )
  );

-- Escritura: solo dev.
create policy deliverables_files_write on storage.objects for insert to authenticated
  with check (bucket_id = 'deliverables' and public.is_dev());
create policy deliverables_files_update on storage.objects for update to authenticated
  using (bucket_id = 'deliverables' and public.is_dev());
create policy deliverables_files_delete on storage.objects for delete to authenticated
  using (bucket_id = 'deliverables' and public.is_dev());
