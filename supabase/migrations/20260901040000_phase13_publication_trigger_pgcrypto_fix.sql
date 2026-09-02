begin;

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
    'swv_' || pg_catalog.encode(extensions.gen_random_bytes(24), 'hex'),
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

revoke execute on function public.sync_sitewing_publication_domain()
from public, anon, authenticated;

commit;
