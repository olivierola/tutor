-- ============================================================
-- Per-user state blob — simple cloud sync for the hub.
--
-- The front-end keeps courses + folders in one JSON document; we
-- store it as a single row per user (last-write-wins). This avoids
-- a fragile relational mapping while still syncing across devices.
-- Protected by RLS: a user can only read/write their own row.
-- ============================================================

create table if not exists public.user_state (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.user_state enable row level security;

drop policy if exists "user_state self" on public.user_state;
create policy "user_state self"
  on public.user_state for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
