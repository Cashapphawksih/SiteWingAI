begin;

alter table public.projects
  add constraint projects_id_user_id_unique unique (id, user_id);

create table public.published_sites (
  project_id uuid primary key,
  user_id uuid not null,
  public_slug text not null unique
    check (public_slug ~ '^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$'),
  published_config jsonb not null
    check (jsonb_typeof(published_config) = 'object'),
  config_hash text not null
    check (config_hash ~ '^[0-9a-f]{64}$'),
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  published_at timestamptz not null default timezone('utc', now()),
  constraint published_sites_project_owner_fkey
    foreign key (project_id, user_id)
    references public.projects (id, user_id)
    on delete cascade
);

create table public.published_site_assets (
  project_id uuid not null references public.published_sites(project_id) on delete cascade,
  asset_id uuid not null,
  storage_path text not null,
  primary key (project_id, asset_id),
  unique (project_id, storage_path)
);

create index published_sites_active_slug_idx
  on public.published_sites (public_slug)
  where is_active;

create index published_site_assets_storage_path_idx
  on public.published_site_assets (storage_path);

create trigger published_sites_set_updated_at
before update on public.published_sites
for each row execute function public.set_updated_at();

alter table public.published_sites enable row level security;
alter table public.published_site_assets enable row level security;

revoke all on table public.published_sites from anon, authenticated;
revoke all on table public.published_site_assets from anon, authenticated;

grant select, insert on table public.published_sites to authenticated;
grant update (published_config, config_hash, is_active, published_at) on table public.published_sites to authenticated;
grant select, insert, delete on table public.published_site_assets to authenticated;

create policy "published_sites_select_own"
on public.published_sites for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "published_sites_insert_own"
on public.published_sites for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "published_sites_update_own"
on public.published_sites for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "published_site_assets_select_own"
on public.published_site_assets for select
to authenticated
using (
  exists (
    select 1 from public.published_sites
    where published_sites.project_id = published_site_assets.project_id
      and published_sites.user_id = (select auth.uid())
  )
);

create policy "published_site_assets_insert_own"
on public.published_site_assets for insert
to authenticated
with check (
  exists (
    select 1 from public.published_sites
    where published_sites.project_id = published_site_assets.project_id
      and published_sites.user_id = (select auth.uid())
  )
);

create policy "published_site_assets_delete_own"
on public.published_site_assets for delete
to authenticated
using (
  exists (
    select 1 from public.published_sites
    where published_sites.project_id = published_site_assets.project_id
      and published_sites.user_id = (select auth.uid())
  )
);

create or replace function public.publish_project(
  p_project_id uuid,
  p_public_slug_base text,
  p_published_config jsonb,
  p_config_hash text,
  p_storage_paths text[]
)
returns table (public_slug text, published_at timestamptz)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_slug text;
  v_now timestamptz := timezone('utc', now());
begin
  if v_user_id is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.projects
    where id = p_project_id and user_id = v_user_id
  ) then
    raise exception 'project not found' using errcode = '42501';
  end if;

  if p_public_slug_base !~ '^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$'
    or p_public_slug_base in ('admin', 'api', 'app', 'assets', 'auth', 'build', 'dashboard', 'favicon', 'login', 'media', 'robots', 'signup', 'site', 'sitemap', 'www') then
    raise exception 'invalid public slug' using errcode = '22023';
  end if;

  if jsonb_typeof(p_published_config) <> 'object'
    or p_config_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid published configuration' using errcode = '22023';
  end if;

  if exists (
    select 1
    from unnest(coalesce(p_storage_paths, array[]::text[])) as candidate(path)
    where candidate.path !~ ('^' || v_user_id::text || '/' || p_project_id::text || '/[0-9a-f-]{36}[.](jpg|png|webp)$')
  ) then
    raise exception 'invalid published asset path' using errcode = '22023';
  end if;

  if exists (
    select candidate.path
    from unnest(coalesce(p_storage_paths, array[]::text[])) as candidate(path)
    except
    select objects.name
    from storage.objects
    where objects.bucket_id = 'site-media'
  ) then
    raise exception 'published asset is missing' using errcode = '22023';
  end if;

  select sites.public_slug into v_slug
  from public.published_sites as sites
  where sites.project_id = p_project_id and sites.user_id = v_user_id;

  if v_slug is null then
    insert into public.published_sites (
      project_id, user_id, public_slug, published_config, config_hash,
      is_active, created_at, updated_at, published_at
    ) values (
      p_project_id, v_user_id, p_public_slug_base, p_published_config, p_config_hash,
      true, v_now, v_now, v_now
    );
    v_slug := p_public_slug_base;
  else
    update public.published_sites
    set published_config = p_published_config,
        config_hash = p_config_hash,
        is_active = true,
        published_at = v_now
    where project_id = p_project_id and user_id = v_user_id;
  end if;

  delete from public.published_site_assets
  where project_id = p_project_id;

  insert into public.published_site_assets (project_id, asset_id, storage_path)
  select p_project_id,
         split_part(storage.filename(candidate.path), '.', 1)::uuid,
         candidate.path
  from (
    select distinct path
    from unnest(coalesce(p_storage_paths, array[]::text[])) as supplied(path)
  ) as candidate;

  return query select v_slug, v_now;
end;
$$;

revoke all on function public.publish_project(uuid, text, jsonb, text, text[]) from public, anon;
grant execute on function public.publish_project(uuid, text, jsonb, text, text[]) to authenticated;

commit;
