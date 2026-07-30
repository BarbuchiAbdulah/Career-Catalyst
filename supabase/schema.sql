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
  title                  text not null default '', -- staff only: position/job title
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
alter table public.students add column if not exists onboarded boolean not null default false;
alter table public.students add column if not exists title text not null default '';

-- Replaces the old plain `flagged` boolean with an actual outreach workflow
-- state. The old column is left in place (untouched, no data loss) but the
-- app no longer reads/writes it — this backfill promotes anyone already
-- flagged into "reached-out" once, the first time this runs; re-running is a
-- no-op for anyone whose status has since been changed by staff.
alter table public.students add column if not exists outreach_status text not null default 'not-contacted';
update public.students set outreach_status = 'reached-out' where flagged = true and outreach_status = 'not-contacted';
alter table public.students drop constraint if exists students_outreach_status_check;
alter table public.students add constraint students_outreach_status_check
  check (outreach_status in ('not-contacted', 'reached-out', 'responded', 'scheduled'));

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

-- Lets staff move another student along the outreach workflow without a
-- blanket UPDATE grant on the whole table (RLS above only allows self-updates).
-- Replaces the old set_student_flag boolean toggle with an actual status —
-- different name, so "create or replace" wouldn't touch the old one; drop it
-- explicitly so a dead function doesn't linger in the database.
drop function if exists public.set_student_flag(uuid, boolean);
create or replace function public.set_outreach_status(target_id uuid, status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'Only staff can update outreach status';
  end if;
  if status not in ('not-contacted', 'reached-out', 'responded', 'scheduled') then
    raise exception 'Invalid outreach status: %', status;
  end if;
  update public.students set outreach_status = status where id = target_id;
end;
$$;

-- Lets staff append an advising/guidance note to a student's row, mirroring
-- set_outreach_status: security definer, no blanket UPDATE grant on other
-- rows. id/date are generated client-side (same as every other logged entity)
-- and passed as plain text, so this doesn't depend on gen_random_uuid()/
-- pgcrypto being enabled on the target project. author_name is the writing
-- staff member's own name+title, captured at write time so it survives even
-- if their profile changes later. author_name was added as a new trailing
-- parameter — Postgres treats a different argument count as a different
-- function, so "create or replace" would leave the old 4-arg version behind
-- as a second overload (a real risk: PostgREST can fail to pick between
-- overloads of the same name) rather than replacing it. Drop the old exact
-- signature first.
drop function if exists public.add_advising_note(uuid, text, text, text);
create or replace function public.add_advising_note(target_id uuid, note_id text, note_date text, note_text text, author_name text default '')
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
    jsonb_build_object('id', note_id, 'date', note_date, 'note', note_text, 'author', author_name)
  )
  where id = target_id;
end;
$$;

-- --- Staff-redacted roster --------------------------------------------------
-- Staff can already SELECT every row via students_select's RLS policy, but
-- that policy is row-level/all-or-nothing — it can't hide individual jsonb
-- fields within a row. These functions strip the sensitive per-item fields
-- (skill evidence text, entry descriptions, all contact fields) before the
-- row ever leaves Postgres, so a staff-facing fetch can never leak them,
-- Network-tab or otherwise. Keeps enough per-item fields (id/title/dates/
-- category/path) that scoreFor/dominantPath/toTimelineItems in scoring.ts
-- keep working unchanged on the client — see src/lib/types.ts StaffStudent.

create or replace function public.redact_skills(skills jsonb)
returns jsonb
language sql
stable
as $$
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', sk->>'id',
      'title', sk->>'title',
      'path', coalesce(sk->>'path', ''),
      -- evidence id/date are kept (drives the level tag + timeline
      -- placement); 'description' is the free-text field and is omitted
      -- entirely, not just blanked, so the key isn't even present on the wire.
      'evidence', (
        select coalesce(jsonb_agg(
          jsonb_build_object('id', ev->>'id', 'date', ev->>'date')
        ), '[]'::jsonb)
        from jsonb_array_elements(coalesce(sk->'evidence', '[]'::jsonb)) ev
      )
    )
  ), '[]'::jsonb)
  from jsonb_array_elements(coalesce(skills, '[]'::jsonb)) sk;
$$;

create or replace function public.redact_entries(entries jsonb)
returns jsonb
language sql
stable
as $$
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', e->>'id',
      'title', e->>'title',
      'category', e->'category',
      'startDate', coalesce(e->>'startDate', e->>'date'), -- legacy rows used 'date'; see migrateEntries in storage.ts
      'endDate', e->'endDate',
      'ongoing', coalesce((e->>'ongoing')::boolean, false),
      'path', coalesce(e->>'path', '')
      -- 'meta' (free text), 'organization', 'location', 'tools',
      -- 'hoursLogged', 'link' are all omitted on purpose — decision: staff
      -- see title + dates + category only, never descriptive fields.
    )
  ), '[]'::jsonb)
  from jsonb_array_elements(coalesce(entries, '[]'::jsonb)) e
  -- legacy pre-migration rows could still hold folded-in "type":"skill"/
  -- "contact" items (see migrateEntries' comment in storage.ts) — drop them
  -- here too rather than mis-surfacing them to staff as experiences.
  -- Self-heals once that student's own client next saves, same window
  -- migrateEntries already documents.
  where coalesce(e->>'type', '') not in ('skill', 'contact');
$$;

-- Single staff-facing roster fetch. Returns every students row (same set
-- fetchRoster()'s plain select("*") returned before this change) with
-- skills/entries redacted and contacts collapsed to a bare count.
-- security definer + the is_staff() guard mirrors set_outreach_status/
-- add_advising_note above — a genuine second gate, not just reliance on the
-- students_select RLS policy already allowing staff the row.
-- "create or replace" can't change a returns-table function's column
-- signature (only its body) — drop first so this stays safe to re-run even
-- across changes to the returned shape (e.g. flagged boolean → outreach_status text).
drop function if exists public.staff_roster();
create or replace function public.staff_roster()
returns table (
  id uuid,
  role text,
  name text,
  grad text,
  majors jsonb,
  minors jsonb,
  interests jsonb,
  headline text,
  avatar_url text,
  outreach_status text,
  skills jsonb,
  entries jsonb,
  contacts_count integer,
  advising_notes jsonb
)
language plpgsql
security definer
set search_path = public
stable
as $$
begin
  if not public.is_staff(auth.uid()) then
    raise exception 'Only staff can view the roster';
  end if;
  return query
  select
    s.id, s.role, s.name, s.grad, s.majors, s.minors, s.interests, s.headline,
    s.avatar_url, s.outreach_status,
    public.redact_skills(s.skills),
    public.redact_entries(s.entries),
    jsonb_array_length(coalesce(s.contacts, '[]'::jsonb)),
    s.advising_notes
  from public.students s
  where s.role = 'student' -- staff accounts (including the caller's own row) never belong in this roster
  order by s.name;
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
