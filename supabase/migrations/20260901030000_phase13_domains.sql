begin;

create table public.domains (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null,
  user_id uuid not null,
  hostname text not null unique
    check (hostname = lower(hostname) and char_length(hostname) between 4 and 253),
  type text not null check (type in ('sitewing_subdomain', 'custom')),
  status text not null check (status in ('pending', 'verifying', 'active', 'error')),
  verification_token text not null unique
    check (verification_token ~ '^swv_[0-9a-f]{48}$'),
  verified_at timestamptz,
  provider_synced_at timestamptz,
  last_error text check (last_error is null or char_length(last_error) <= 300),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint domains_project_owner_fkey
    foreign key (project_id, user_id)
    references public.projects (id, user_id)
    on delete cascade,
  constraint domains_type_state_check check (
    (type = 'sitewing_subdomain' and status = 'active' and verified_at is not null)
    or (
      type = 'custom'
      and (
        status <> 'active'
        or (verified_at is not null and provider_synced_at is not null)
      )
    )
  )
);

create unique index domains_one_sitewing_subdomain_per_project_idx
  on public.domains (project_id)
  where type = 'sitewing_subdomain';

create index domains_owner_project_idx on public.domains (user_id, project_id);
create index domains_active_hostname_idx on public.domains (hostname) where status = 'active';

create trigger domains_set_updated_at
before update on public.domains
for each row execute function public.set_updated_at();

alter table public.domains enable row level security;
revoke all on table public.domains from anon, authenticated;
grant select on table public.domains to authenticated;

create policy "domains_select_own"
on public.domains for select
to authenticated
using ((select auth.uid()) = user_id);

insert into public.domains (
  project_id, user_id, hostname, type, status, verification_token,
  verified_at, provider_synced_at
)
select
  sites.project_id,
  sites.user_id,
  sites.public_slug || '.sitewing.ai',
  'sitewing_subdomain',
  'active',
  'swv_' || encode(gen_random_bytes(24), 'hex'),
  sites.published_at,
  sites.published_at
from public.published_sites as sites
on conflict (hostname) do nothing;

create or replace function public.sync_sitewing_publication_domain()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.domains (
    project_id, user_id, hostname, type, status, verification_token,
    verified_at, provider_synced_at
  ) values (
    new.project_id,
    new.user_id,
    new.public_slug || '.sitewing.ai',
    'sitewing_subdomain',
    'active',
    'swv_' || encode(gen_random_bytes(24), 'hex'),
    new.published_at,
    new.published_at
  )
  on conflict (project_id) where type = 'sitewing_subdomain'
  do update set
    hostname = excluded.hostname,
    status = 'active',
    verified_at = excluded.verified_at,
    provider_synced_at = excluded.provider_synced_at;
  return new;
end;
$$;

create trigger published_sites_sync_sitewing_domain
after insert or update of public_slug on public.published_sites
for each row execute function public.sync_sitewing_publication_domain();

revoke execute on function public.sync_sitewing_publication_domain() from public, anon, authenticated;

commit;
