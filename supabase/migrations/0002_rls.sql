-- ============================================================
-- Row Level Security policies
--
-- Principle: a user owns their courses, pages and messages and
-- can do anything with them. Everyone else is denied — except
-- read access to a course (and its pages) that has an active,
-- non-expired share token.
--
-- NOT DEPLOYED. Apply after 0001_init.sql.
-- ============================================================

alter table public.profiles       enable row level security;
alter table public.courses        enable row level security;
alter table public.pages          enable row level security;
alter table public.agent_messages enable row level security;
alter table public.shares         enable row level security;

-- ── helper: does an active share exist for this course? ─────
create or replace function public.course_is_shared(cid uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.shares s
    where s.course_id = cid
      and (s.expires_at is null or s.expires_at > now())
  );
$$;

-- ── profiles ────────────────────────────────────────────────
drop policy if exists "profiles self read"  on public.profiles;
drop policy if exists "profiles self write" on public.profiles;
create policy "profiles self read"  on public.profiles
  for select using (auth.uid() = id);
create policy "profiles self write" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ── courses ─────────────────────────────────────────────────
drop policy if exists "courses owner all" on public.courses;
drop policy if exists "courses shared read" on public.courses;
create policy "courses owner all" on public.courses
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
create policy "courses shared read" on public.courses
  for select using (public.course_is_shared(id));

-- ── pages ───────────────────────────────────────────────────
drop policy if exists "pages owner all" on public.pages;
drop policy if exists "pages shared read" on public.pages;
create policy "pages owner all" on public.pages
  for all
  using (exists (select 1 from public.courses c where c.id = course_id and c.owner_id = auth.uid()))
  with check (exists (select 1 from public.courses c where c.id = course_id and c.owner_id = auth.uid()));
create policy "pages shared read" on public.pages
  for select using (public.course_is_shared(course_id));

-- ── agent_messages ──────────────────────────────────────────
drop policy if exists "messages owner all" on public.agent_messages;
create policy "messages owner all" on public.agent_messages
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- ── shares ──────────────────────────────────────────────────
-- Owner manages share rows. Anonymous clients never read this
-- table directly; share resolution happens through the
-- `share` edge function (service role).
drop policy if exists "shares owner all" on public.shares;
create policy "shares owner all" on public.shares
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
