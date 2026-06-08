-- ============================================================
-- Tutor-AI — initial schema
--
--   profiles        one row per auth user (display name, etc.)
--   courses         a course owned by a user
--   pages           an infinite-canvas document inside a course
--   agent_messages  chat history between the student and the tutor
--   shares          public share links for a course (read-only)
--
-- Every table is protected by Row Level Security: a user only
-- ever sees / writes their own rows. Public read access to a
-- course is granted exclusively through an active `shares` row.
--
-- NOT DEPLOYED. Apply later with `supabase db push` (or the SQL
-- editor) once the project is linked.
-- ============================================================

-- Needed for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ── profiles ────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  display_name text,
  avatar_url  text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── courses ─────────────────────────────────────────────────
create table if not exists public.courses (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users (id) on delete cascade,
  title       text not null default 'Nouveau cours',
  description text not null default '',
  color       text not null default 'blue',
  subject     text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists courses_owner_idx on public.courses (owner_id, updated_at desc);

-- ── pages ───────────────────────────────────────────────────
-- The canvas document (elements / instruments / viewport) is
-- stored as JSONB so the front-end Scene/Element schema can evolve
-- without a migration. `position` keeps page ordering stable.
create table if not exists public.pages (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid not null references public.courses (id) on delete cascade,
  title       text not null default 'Page 1',
  position    integer not null default 0,
  document    jsonb not null default '{"elements":[],"instruments":[],"viewport":{"x":0,"y":0,"zoom":1}}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists pages_course_idx on public.pages (course_id, position);

-- ── agent_messages ──────────────────────────────────────────
create table if not exists public.agent_messages (
  id          uuid primary key default gen_random_uuid(),
  owner_id    uuid not null references auth.users (id) on delete cascade,
  course_id   uuid references public.courses (id) on delete cascade,
  page_id     uuid references public.pages (id) on delete set null,
  role        text not null check (role in ('user', 'assistant')),
  content     text not null default '',
  scene       jsonb,                       -- the Scene the tutor produced, if any
  created_at  timestamptz not null default now()
);
create index if not exists agent_messages_course_idx on public.agent_messages (course_id, created_at);

-- ── shares ──────────────────────────────────────────────────
-- A share token grants anonymous read-only access to one course.
create table if not exists public.shares (
  token       text primary key,            -- short random slug used in the URL
  course_id   uuid not null references public.courses (id) on delete cascade,
  owner_id    uuid not null references auth.users (id) on delete cascade,
  can_edit    boolean not null default false,
  expires_at  timestamptz,                 -- null = never
  created_at  timestamptz not null default now()
);
create index if not exists shares_course_idx on public.shares (course_id);

-- ============================================================
-- updated_at triggers
-- ============================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists trg_courses_touch on public.courses;
create trigger trg_courses_touch before update on public.courses
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_pages_touch on public.pages;
create trigger trg_pages_touch before update on public.pages
  for each row execute function public.touch_updated_at();

drop trigger if exists trg_profiles_touch on public.profiles;
create trigger trg_profiles_touch before update on public.profiles
  for each row execute function public.touch_updated_at();

-- ============================================================
-- Auto-create a profile row when a new auth user signs up
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists trg_on_auth_user_created on auth.users;
create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
