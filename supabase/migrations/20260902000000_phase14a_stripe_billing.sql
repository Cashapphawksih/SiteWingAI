begin;

create table public.billing_accounts (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  stripe_customer_id text not null unique
    check (stripe_customer_id ~ '^cus_[A-Za-z0-9]+$'),
  stripe_subscription_id text unique
    check (stripe_subscription_id is null or stripe_subscription_id ~ '^sub_[A-Za-z0-9]+$'),
  stripe_price_id text
    check (stripe_price_id is null or stripe_price_id ~ '^price_[A-Za-z0-9]+$'),
  status text not null default 'none'
    check (status in ('none', 'active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'paused', 'trialing', 'unpaid')),
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  last_stripe_event_created_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table public.stripe_webhook_events (
  event_id text primary key check (event_id ~ '^evt_[A-Za-z0-9]+$'),
  event_type text not null check (char_length(event_type) between 1 and 120),
  stripe_created_at timestamptz not null,
  processed_at timestamptz not null default timezone('utc', now())
);

create index billing_accounts_subscription_idx
  on public.billing_accounts (stripe_subscription_id)
  where stripe_subscription_id is not null;

create trigger billing_accounts_set_updated_at
before update on public.billing_accounts
for each row execute function public.set_updated_at();

alter table public.billing_accounts enable row level security;
alter table public.stripe_webhook_events enable row level security;

revoke all on table public.billing_accounts from anon, authenticated;
revoke all on table public.stripe_webhook_events from anon, authenticated;

grant select on table public.billing_accounts to authenticated;

create policy "billing_accounts_select_own"
on public.billing_accounts for select
to authenticated
using ((select auth.uid()) is not null and (select auth.uid()) = user_id);

create or replace function public.apply_stripe_subscription_event(
  p_event_id text,
  p_event_type text,
  p_event_created_at timestamptz,
  p_user_id uuid,
  p_stripe_customer_id text,
  p_stripe_subscription_id text,
  p_stripe_price_id text,
  p_status text,
  p_current_period_start timestamptz,
  p_current_period_end timestamptz,
  p_cancel_at_period_end boolean
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inserted_event_id text;
begin
  if (select auth.role()) is distinct from 'service_role' then
    raise exception 'service role required' using errcode = '42501';
  end if;

  if p_event_id is null
    or p_event_type is null
    or p_event_created_at is null
    or p_user_id is null
    or p_stripe_customer_id is null
    or p_stripe_subscription_id is null
    or p_status is null
    or p_cancel_at_period_end is null
    or p_event_id !~ '^evt_[A-Za-z0-9]+$'
    or char_length(p_event_type) not between 1 and 120
    or p_stripe_customer_id !~ '^cus_[A-Za-z0-9]+$'
    or p_stripe_subscription_id !~ '^sub_[A-Za-z0-9]+$'
    or (p_stripe_price_id is not null and p_stripe_price_id !~ '^price_[A-Za-z0-9]+$')
    or p_status not in ('active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'paused', 'trialing', 'unpaid') then
    raise exception 'invalid Stripe subscription event' using errcode = '22023';
  end if;

  if not exists (select 1 from public.profiles where id = p_user_id) then
    raise exception 'SiteWing user not found' using errcode = '23503';
  end if;

  insert into public.stripe_webhook_events (event_id, event_type, stripe_created_at)
  values (p_event_id, p_event_type, p_event_created_at)
  on conflict (event_id) do nothing
  returning event_id into v_inserted_event_id;

  if v_inserted_event_id is null then
    return false;
  end if;

  insert into public.billing_accounts (
    user_id,
    stripe_customer_id,
    stripe_subscription_id,
    stripe_price_id,
    status,
    current_period_start,
    current_period_end,
    cancel_at_period_end,
    last_stripe_event_created_at
  ) values (
    p_user_id,
    p_stripe_customer_id,
    p_stripe_subscription_id,
    p_stripe_price_id,
    p_status,
    p_current_period_start,
    p_current_period_end,
    p_cancel_at_period_end,
    p_event_created_at
  )
  on conflict (user_id) do update set
    stripe_customer_id = excluded.stripe_customer_id,
    stripe_subscription_id = excluded.stripe_subscription_id,
    stripe_price_id = excluded.stripe_price_id,
    status = excluded.status,
    current_period_start = excluded.current_period_start,
    current_period_end = excluded.current_period_end,
    cancel_at_period_end = excluded.cancel_at_period_end,
    last_stripe_event_created_at = excluded.last_stripe_event_created_at
  where billing_accounts.last_stripe_event_created_at is null
    or billing_accounts.last_stripe_event_created_at <= excluded.last_stripe_event_created_at;

  return true;
end;
$$;

revoke all on function public.apply_stripe_subscription_event(
  text, text, timestamptz, uuid, text, text, text, text, timestamptz, timestamptz, boolean
) from public, anon, authenticated;
grant execute on function public.apply_stripe_subscription_event(
  text, text, timestamptz, uuid, text, text, text, text, timestamptz, timestamptz, boolean
) to service_role;

commit;
