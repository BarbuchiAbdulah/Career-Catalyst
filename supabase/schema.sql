-- Career Catalyst — Supabase schema
-- Run this once in the Supabase SQL Editor (Project → SQL Editor → New query → paste → Run).
-- Safe to re-run: uses "if not exists" / "or replace" / "drop ... if exists" throughout.

-- One row per authenticated user. Scalar profile fields are real columns; the
-- growing collections (skills, entries, applications, ...) are jsonb, holding
-- exactly the shapes already defined in src/lib/types.ts. See the plan for why
-- this isn't fully normalized into per-entity tables.
create table if not exists public.students (
  id                     uuid primary key references auth.users (id) on delete cascade,
  role                   text not null default 'student' check (role in ('student', 'staff')),
  name                   text not null default '',
  grad                   text not null default '',
  majors                 jsonb not null default '[]',
  minors                 jsonb not null default '[]',
  interests              jsonb not null default '[]',
  headline               text not null default '',
  resume_url             text not null default '',
  linkedin               text not null default '',
  avatar_url             text not null default '',
  flagged                boolean not null default false,
  skills                 jsonb not null default '[]',
  entries                jsonb not null default '[]',
  contacts               jsonb not null default '[]',
  applications           jsonb not null default '[]',
  events_attended        jsonb not null default '[]',
  advising_notes         jsonb not null default '[]',
  todos                  jsonb not null default '[]',
  dismissed_suggestions  jsonb not null default '[]',
  created_at             timestamptz not null default now()
);

-- The create table above is skipped by "if not exists" on a database that
-- already has this table — these alters are what actually apply new columns
-- to an existing, already-deployed students table. Safe to re-run.
alter table public.students add column if not exists avatar_url text not null default '';
alter table public.students add column if not exists contacts jsonb not null default '[]';

alter table public.students enable row level security;

-- security definer so this can be called from inside an RLS policy on the
-- same table without triggering "infinite recursion in policy" errors.
create or replace function public.is_staff(uid uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.students where id = uid and role = 'staff'
  );
$$;

drop policy if exists "students_select" on public.students;
create policy "students_select" on public.students
  for select
  using (auth.uid() = id or public.is_staff(auth.uid()));

drop policy if exists "students_update_self" on public.students;
create policy "students_update_self" on public.students
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- No insert/delete policy for clients: rows are created only by the trigger
-- below (security definer, bypasses RLS) and removed only via the
-- on-delete-cascade from auth.users.

-- Creates the blank student row on signup. Reads name/grad out of the
-- signup call's options.data (see LoginView.tsx), and rejects any signup
-- whose email isn't an @lclark.edu address server-side — the client-side
-- check in LoginView is UX only, this is the real enforcement.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email !~* '@lclark\.edu$' then
    raise exception 'Sign up requires an @lclark.edu email address';
  end if;

  insert into public.students (id, name, grad)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'grad', '')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Lets staff toggle another student's outreach flag without a blanket UPDATE
-- grant on the whole table (RLS above only allows self-updates).
create or replace function public.set_student_flag(target_id uuid, is_flagged boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'Only staff can flag students for outreach';
  end if;
  update public.students set flagged = is_flagged where id = target_id;
end;
$$;

-- Lets staff append an advising/guidance note to a student's row, mirroring
-- set_student_flag: security definer, no blanket UPDATE grant on other rows.
-- id/date are generated client-side (same as every other logged entity) and
-- passed as plain text, so this doesn't depend on gen_random_uuid()/pgcrypto
-- being enabled on the target project.
create or replace function public.add_advising_note(target_id uuid, note_id text, note_date text, note_text text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'Only staff can add advising notes';
  end if;
  update public.students
  set advising_notes = advising_notes || jsonb_build_array(
    jsonb_build_object('id', note_id, 'date', note_date, 'note', note_text)
  )
  where id = target_id;
end;
$$;

-- --- Profile pictures --------------------------------------------------------
-- One public bucket; a student may only write to the folder named after their
-- own auth uid, enforced by storage.foldername() reading the object path's
-- first segment (the app always uploads to "{user id}/avatar.<ext>").

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatar public read" on storage.objects;
create policy "avatar public read" on storage.objects
  for select
  using (bucket_id = 'avatars');

drop policy if exists "avatar own write" on storage.objects;
create policy "avatar own write" on storage.objects
  for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatar own update" on storage.objects;
create policy "avatar own update" on storage.objects
  for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
