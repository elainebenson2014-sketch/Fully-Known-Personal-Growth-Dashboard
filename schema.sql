-- Fully Known — Personal Growth Dashboard
-- Run this once in Supabase: SQL Editor -> New query -> paste -> Run.

create type app_role as enum ('participant', 'facilitator', 'admin');

create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  full_name  text,
  role       app_role not null default 'participant',
  created_at timestamptz not null default now()
);

create table public.checkins (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  week       date not null,
  ratings    jsonb not null default '{}'::jsonb,
  reflection jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, week)
);

alter table public.profiles enable row level security;
alter table public.checkins enable row level security;

-- A person can see and edit only their own profile.
create policy "own profile read"   on public.profiles for select using (auth.uid() = id);
create policy "own profile update" on public.profiles for update using (auth.uid() = id);

-- Check-ins are fully private to the person who wrote them.
-- Facilitator/leader sharing is Phase 2 and intentionally not enabled here.
create policy "own checkins" on public.checkins
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Create a profile automatically the first time someone signs in.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Anonymous, aggregate-only summary for leadership. Admins only.
-- Returns counts, never any individual's ratings or reflections.
create or replace function public.program_summary()
returns jsonb language plpgsql security definer set search_path = public as $$
declare is_admin boolean; result jsonb;
begin
  select (role = 'admin') into is_admin from public.profiles where id = auth.uid();
  if not coalesce(is_admin, false) then
    raise exception 'not authorized';
  end if;
  select jsonb_build_object(
    'participants', (select count(distinct user_id) from public.checkins),
    'checkins',     (select count(*) from public.checkins),
    'this_week',    (select count(*) from public.checkins
                     where week = date_trunc('week', now())::date)
  ) into result;
  return result;
end $$;

-- To make yourself an admin after signing in once:
--   update public.profiles set role = 'admin' where id = auth.uid();
