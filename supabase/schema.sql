-- 1) Chạy toàn bộ SQL này trong Supabase Dashboard > SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  image_url text,
  category text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.club_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_club_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.club_admins
    where user_id = auth.uid()
  );
$$;

alter table public.products enable row level security;
alter table public.club_admins enable row level security;

drop policy if exists "Public can read active products" on public.products;
create policy "Public can read active products"
on public.products for select
to anon, authenticated
using (is_active = true or public.is_club_admin());

drop policy if exists "Admins can insert products" on public.products;
create policy "Admins can insert products"
on public.products for insert
to authenticated
with check (public.is_club_admin());

drop policy if exists "Admins can update products" on public.products;
create policy "Admins can update products"
on public.products for update
to authenticated
using (public.is_club_admin())
with check (public.is_club_admin());

drop policy if exists "Admins can delete products" on public.products;
create policy "Admins can delete products"
on public.products for delete
to authenticated
using (public.is_club_admin());

drop policy if exists "Admins can read admin list" on public.club_admins;
create policy "Admins can read admin list"
on public.club_admins for select
to authenticated
using (public.is_club_admin());

grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
grant select on public.club_admins to authenticated;
grant execute on function public.is_club_admin() to anon, authenticated;

-- Sau khi tạo user quản trị trong Authentication > Users,
-- thay YOUR_AUTH_USER_UUID bằng UUID của user đó rồi chạy:
-- insert into public.club_admins (user_id) values ('YOUR_AUTH_USER_UUID');

-- 2) Lịch sinh hoạt, thành viên và lịch sử nhắc lịch.
create table if not exists public.club_members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  zalo_uid text,
  consent_to_reminders boolean not null default false,
  consent_recorded_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.club_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  starts_at timestamptz not null,
  location text,
  notes text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reminder_logs (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.club_events(id) on delete cascade,
  member_id uuid not null references public.club_members(id) on delete cascade,
  reminder_type text not null check (reminder_type in ('24h', '2h')),
  status text not null default 'processing' check (status in ('processing', 'sent', 'failed')),
  provider_message_id text,
  error_code text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (event_id, member_id, reminder_type)
);

create index if not exists club_events_active_starts_at_idx on public.club_events (starts_at) where is_active = true;
create index if not exists club_members_eligible_idx on public.club_members (is_active, consent_to_reminders);
create index if not exists reminder_logs_status_idx on public.reminder_logs (status, created_at desc);

alter table public.club_members enable row level security;
alter table public.club_events enable row level security;
alter table public.reminder_logs enable row level security;

drop policy if exists "Club admins manage members" on public.club_members;
create policy "Club admins manage members" on public.club_members
  for all to authenticated using (public.is_club_admin()) with check (public.is_club_admin());
drop policy if exists "Club admins manage events" on public.club_events;
create policy "Club admins manage events" on public.club_events
  for all to authenticated using (public.is_club_admin()) with check (public.is_club_admin());
drop policy if exists "Club admins read reminder logs" on public.reminder_logs;
create policy "Club admins read reminder logs" on public.reminder_logs
  for select to authenticated using (public.is_club_admin());

grant select, insert, update, delete on public.club_members to authenticated;
grant select, insert, update, delete on public.club_events to authenticated;
grant select on public.reminder_logs to authenticated;
-- Cron route uses SUPABASE_SERVICE_ROLE_KEY on the server only; never expose it to the browser.

-- Server-only token storage. RLS is enabled with no client policies; service-role access is server-only.
create table if not exists public.zalo_token_state (
  id integer primary key check (id = 1),
  encrypted_access_token text,
  encrypted_refresh_token text not null,
  access_expires_at timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.zalo_token_state enable row level security;
revoke all on public.zalo_token_state from anon, authenticated;
