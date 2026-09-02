begin;

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'site-media',
  'site-media',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "site_media_select_owned_project" on storage.objects;
create policy "site_media_select_owned_project"
on storage.objects for select
to authenticated
using (
  bucket_id = 'site-media'
  and array_length(storage.foldername(name), 1) = 2
  and storage.filename(name) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)$'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1
    from public.projects
    where projects.id::text = (storage.foldername(objects.name))[2]
      and projects.user_id = (select auth.uid())
  )
);

drop policy if exists "site_media_insert_owned_project" on storage.objects;
create policy "site_media_insert_owned_project"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'site-media'
  and array_length(storage.foldername(name), 1) = 2
  and storage.filename(name) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)$'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1
    from public.projects
    where projects.id::text = (storage.foldername(objects.name))[2]
      and projects.user_id = (select auth.uid())
  )
);

drop policy if exists "site_media_delete_owned_project" on storage.objects;
create policy "site_media_delete_owned_project"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'site-media'
  and array_length(storage.foldername(name), 1) = 2
  and storage.filename(name) ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)$'
  and (storage.foldername(name))[1] = (select auth.uid())::text
  and exists (
    select 1
    from public.projects
    where projects.id::text = (storage.foldername(objects.name))[2]
      and projects.user_id = (select auth.uid())
  )
);

commit;
