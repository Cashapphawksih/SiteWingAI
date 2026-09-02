begin;

create extension if not exists pgcrypto with schema extensions;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) between 1 and 80),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null default 'Untitled site' check (char_length(name) between 1 and 80),
  website_config jsonb check (website_config is null or jsonb_typeof(website_config) = 'object'),
  current_page_id text check (current_page_id is null or char_length(current_page_id) between 1 and 64),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.project_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 4000),
  created_at timestamptz not null default timezone('utc', now())
);

create index projects_user_updated_idx on public.projects (user_id, updated_at desc);
create index project_messages_project_created_idx on public.project_messages (project_id, created_at asc);

create function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger projects_set_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

create function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

-- Keep the migration safe for Supabase projects that already contain Auth users.
insert into public.profiles (id)
select id from auth.users
on conflict (id) do nothing;

revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.project_messages enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.projects from anon, authenticated;
revoke all on table public.project_messages from anon, authenticated;

grant select on table public.profiles to authenticated;
grant update (display_name) on table public.profiles to authenticated;

grant select, insert, delete on table public.projects to authenticated;
grant update (name, website_config, current_page_id) on table public.projects to authenticated;

grant select, insert, delete on table public.project_messages to authenticated;
grant update (role, content) on table public.project_messages to authenticated;

create policy "profiles_select_own"
on public.profiles for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = id);

create policy "profiles_update_own"
on public.profiles for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = id)
with check ((select auth.uid()) is not null and (select auth.uid()) = id);

create policy "projects_select_own"
on public.projects for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "projects_insert_own"
on public.projects for insert
to authenticated
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "projects_update_own"
on public.projects for update
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id)
with check ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "projects_delete_own"
on public.projects for delete
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create policy "project_messages_select_own_project"
on public.project_messages for select
to authenticated
using (
  (select auth.uid()) is not null
  and exists (
    select 1 from public.projects
    where projects.id = project_messages.project_id
      and projects.user_id = (select auth.uid())
  )
);

create policy "project_messages_insert_own_project"
on public.project_messages for insert
to authenticated
with check (
  (select auth.uid()) is not null
  and exists (
    select 1 from public.projects
    where projects.id = project_messages.project_id
      and projects.user_id = (select auth.uid())
  )
);

create policy "project_messages_update_own_project"
on public.project_messages for update
to authenticated
using (
  (select auth.uid()) is not null
  and exists (
    select 1 from public.projects
    where projects.id = project_messages.project_id
      and projects.user_id = (select auth.uid())
  )
)
with check (
  (select auth.uid()) is not null
  and exists (
    select 1 from public.projects
    where projects.id = project_messages.project_id
      and projects.user_id = (select auth.uid())
  )
);

create policy "project_messages_delete_own_project"
on public.project_messages for delete
to authenticated
using (
  (select auth.uid()) is not null
  and exists (
    select 1 from public.projects
    where projects.id = project_messages.project_id
      and projects.user_id = (select auth.uid())
  )
);

commit;
