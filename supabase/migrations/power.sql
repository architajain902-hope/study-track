-- SatiStudy — Cognitive energy, gamified mascot & frictionless execution schema
-- New table: energy_checkins (cognitive battery). Profiles gain mascot
-- cosmetics columns; study_plans gain a difficulty flag for dynamic shifting.
-- Idempotent (safe to re-run).

-- 1. ENERGY CHECKINS (cognitive battery micro-checkins) ----------------------
create table if not exists public.energy_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  energy_level smallint not null check (energy_level between 1 and 10),
  mood text check (mood is null or char_length(mood) <= 40),
  created_at timestamptz not null default now()
);

create index if not exists energy_checkins_user_idx on public.energy_checkins (user_id);
create index if not exists energy_checkins_created_idx on public.energy_checkins (created_at);

-- 2. PROFILES — mascot cosmetics ---------------------------------------------
alter table public.profiles
  add column if not exists mascot_skin text not null default 'none';

alter table public.profiles
  add column if not exists unlocks jsonb not null default '[]'::jsonb;

-- 3. STUDY PLANS — difficulty for smart sprint / schedule shifting -----------
alter table public.study_plans
  add column if not exists difficulty text not null default 'medium'
  check (difficulty in ('easy', 'medium', 'hard'));

-- 4. ROW LEVEL SECURITY ------------------------------------------------------
alter table public.energy_checkins enable row level security;

drop policy if exists "energy_checkins_select_own" on public.energy_checkins;
create policy "energy_checkins_select_own" on public.energy_checkins
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists "energy_checkins_insert_own" on public.energy_checkins;
create policy "energy_checkins_insert_own" on public.energy_checkins
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "energy_checkins_update_own" on public.energy_checkins;
create policy "energy_checkins_update_own" on public.energy_checkins
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "energy_checkins_delete_own" on public.energy_checkins;
create policy "energy_checkins_delete_own" on public.energy_checkins
  for delete to authenticated using (auth.uid() = user_id);