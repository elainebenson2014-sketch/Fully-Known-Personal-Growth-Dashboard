-- Fully Known — Phase 2 migration
-- Facilitators, participant consent, admin assignments, and care notes.
-- Safe to run ONCE on top of the existing database (schema.sql).
-- Supabase: SQL Editor -> New query -> paste -> Run.

-- 1. New columns ------------------------------------------------------
alter table public.profiles
  add column if not exists share_with_facilitator boolean not null default false;

alter table public.checkins
  add column if not exists shared_fields text[] not null default '{}';

-- 2. Admin links a facilitator to a participant -----------------------
create table if not exists public.assignments (
  id             uuid primary key default gen_random_uuid(),
  facilitator_id uuid not null references auth.users(id) on delete cascade,
  participant_id uuid not null references auth.users(id) on delete cascade,
  created_at     timestamptz not null default now(),
  unique (facilitator_id, participant_id)
);

-- 3. Facilitator meeting / care notes --------------------------------
create table if not exists public.care_notes (
  id             uuid primary key default gen_random_uuid(),
  facilitator_id uuid not null references auth.users(id) on delete cascade,
  participant_id uuid not null references auth.users(id) on delete cascade,
  note           text not null default '',
  created_at     timestamptz not null default now()
);

-- 4. Helpers (SECURITY DEFINER so policies can call them safely) ------
create or replace function public.is_admin()
returns boolean language sql security definer stable set search_path = public as $$
  select coalesce((select role = 'admin' from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.is_facilitator_for(p uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.assignments
    where facilitator_id = auth.uid() and participant_id = p
  );
$$;

-- 5. Row-level security ----------------------------------------------
alter table public.assignments enable row level security;
alter table public.care_notes  enable row level security;

drop policy if exists "admin manage assignments" on public.assignments;
create policy "admin manage assignments" on public.assignments
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "facilitator reads own assignments" on public.assignments;
create policy "facilitator reads own assignments" on public.assignments
  for select using (facilitator_id = auth.uid());

drop policy if exists "facilitator owns notes" on public.care_notes;
create policy "facilitator owns notes" on public.care_notes
  for all using (facilitator_id = auth.uid() and public.is_facilitator_for(participant_id))
  with check (facilitator_id = auth.uid() and public.is_facilitator_for(participant_id));

drop policy if exists "admin reads notes" on public.care_notes;
create policy "admin reads notes" on public.care_notes
  for select using (public.is_admin());

-- Admins may read every profile (needed for the assignment screen).
drop policy if exists "admin reads profiles" on public.profiles;
create policy "admin reads profiles" on public.profiles
  for select using (public.is_admin());

-- NOTE: check-ins remain owner-only. Facilitators never get direct
-- table access. All facilitator reads go through the functions below,
-- which enforce assignment + consent and strip un-shared reflections.

-- 6. Admin functions -------------------------------------------------
create or replace function public.admin_list_people()
returns table(id uuid, full_name text, role app_role, email text)
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  return query
    select p.id, p.full_name, p.role, u.email::text
    from public.profiles p
    join auth.users u on u.id = p.id
    order by u.email;
end $$;

create or replace function public.admin_set_role(target uuid, new_role app_role)
returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_admin() then raise exception 'not authorized'; end if;
  update public.profiles set role = new_role where id = target;
end $$;

-- 7. Facilitator functions -------------------------------------------
-- Assigned participants with a light summary. Respects consent:
-- if the participant hasn't shared, metrics come back null.
create or replace function public.my_participants()
returns table(
  participant_id uuid, full_name text, email text,
  consented boolean, weeks_count int, last_week date, wellness numeric
)
language plpgsql security definer set search_path = public as $$
begin
  return query
  select
    a.participant_id,
    p.full_name,
    u.email::text,
    p.share_with_facilitator,
    case when p.share_with_facilitator
      then (select count(*)::int from public.checkins c where c.user_id = a.participant_id)
      else null end,
    case when p.share_with_facilitator
      then (select max(c.week) from public.checkins c where c.user_id = a.participant_id)
      else null end,
    case when p.share_with_facilitator then (
      select round(avg((mv.value)::numeric), 1)
      from public.checkins c
      cross join lateral jsonb_each(c.ratings)        as sec(skey, svalue)
      cross join lateral jsonb_each_text(sec.svalue)  as mv(mkey, value)
      where c.user_id = a.participant_id
    ) else null end
  from public.assignments a
  join public.profiles p on p.id = a.participant_id
  join auth.users u on u.id = a.participant_id
  where a.facilitator_id = auth.uid()
  order by p.full_name nulls last, u.email;
end $$;

-- One participant's weeks: full ratings, plus ONLY the reflection
-- fields the participant marked shareable. Requires assignment + consent.
create or replace function public.participant_weeks(participant uuid)
returns table(week date, ratings jsonb, reflection jsonb)
language plpgsql security definer set search_path = public as $$
declare consented boolean;
begin
  if not public.is_facilitator_for(participant) then
    raise exception 'not authorized';
  end if;
  select share_with_facilitator into consented from public.profiles where id = participant;
  if not coalesce(consented, false) then
    raise exception 'participant has not shared';
  end if;

  return query
  select c.week, c.ratings,
    coalesce(
      (select jsonb_object_agg(e.key, e.value)
       from jsonb_each(c.reflection) e
       where e.key = any(c.shared_fields)),
      '{}'::jsonb)
  from public.checkins c
  where c.user_id = participant
  order by c.week;
end $$;
