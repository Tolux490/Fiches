-- Fiches — database setup
-- Run this once in your Supabase project: Dashboard → SQL Editor → New query → paste → Run.

-- One row per user holds their whole app state (deck, progress, top-1000 cache, prefs).
create table if not exists public.fiches_state (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  state      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Row Level Security: every user can only ever see/edit their own row.
alter table public.fiches_state enable row level security;

drop policy if exists "own_state_select" on public.fiches_state;
drop policy if exists "own_state_insert" on public.fiches_state;
drop policy if exists "own_state_update" on public.fiches_state;

create policy "own_state_select" on public.fiches_state
  for select using (auth.uid() = user_id);

create policy "own_state_insert" on public.fiches_state
  for insert with check (auth.uid() = user_id);

create policy "own_state_update" on public.fiches_state
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
