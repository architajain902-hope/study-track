-- SatiStudy — Feature expansion schema (planner, analysis, time-tracking, backup)
-- New tables: study_plans, topic_tracking, test_records, study_sessions,
--             reminder_prefs (on profiles), planner todos live in tasks.
-- RLS: every table scopes data to auth.uid(). Idempotent (safe to re-run).

-- 1. PROFILES EXTENSIONS ----------------------------------------------------
-- Reminder preferences: whether the user opts into in-app/browser/email nudges.
alter table public.profiles
  add column if not exists reminder_enabled boolean not null default true;

alter table public.profiles
  add column if not exists reminder_hour smallint not null default 20
  check (reminder_hour between 0 and 23);

alter table public.profiles
  add column if not exists notify_level text not null default 'all'
  check (notify_level in ('all', 'inapp', 'browser', 'email', 'none'));

-- 2. STUDY PLANS (daily / weekly subject-wise plan rows) --------------------
create table if not exists public.study_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  plan_date date not null,
  plan_type text not null default 'day' check (plan_type in ('day', 'week')),
  subject text not null check (char_length(subject) between 1 and 200),
  task_title text not null check (char_length(task_title) between 1 and 300),
  is_done boolean not null default false,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists study_plans_user_idx on public.study_plans (user_id);
create index if not exists study_plans_date_idx on public.study_plans (plan_date);

-- 3. TOPIC TRACKING (chapter / topic weak-strong analysis) -------------------
create table if not exists public.topic_tracking (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject text not null check (char_length(subject) between 1 and 200),
  chapter text not null check (char_length(chapter) between 1 and 200),
  topic text not null check (char_length(topic) between 1 and 200),
  confidence smallint not null default 3 check (confidence between 1 and 5),
  notes text check (notes is null or char_length(notes) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, subject, chapter, topic)
);

create index if not exists topic_tracking_user_idx on public.topic_tracking (user_id);

-- 4. TEST RECORDS (test & practice analysis) ---------------------------------
create table if not exists public.test_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject text not null check (char_length(subject) between 1 and 200),
  test_name text not null check (char_length(test_name) between 1 and 200),
  test_type text not null default 'test' check (test_type in ('test', 'practice')),
  score numeric not null default 0 check (score >= 0),
  max_score numeric not null default 100 check (max_score >= 1),
  taken_on date,
  notes text check (notes is null or char_length(notes) <= 2000),
  created_at timestamptz not null default now()
);

create index if not exists test_records_user_idx on public.test_records (user_id);
create index if not exists test_records_date_idx on public.test_records (taken_on);

-- 5. STUDY SESSIONS (time tracking / daily study time) -----------------------
create table if not exists public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject text,
  task_id uuid references public.tasks (id) on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  auto boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists study_sessions_user_idx on public.study_sessions (user_id);
create index if not exists study_sessions_start_idx on public.study_sessions (started_at);

-- 6. TRIGGERS ----------------------------------------------------------------
create or replace function public.touch_updated_at_generic()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists topic_tracking_touch_updated_at on public.topic_tracking;
create trigger topic_tracking_touch_updated_at
  before update on public.topic_tracking
  for each row execute procedure public.touch_updated_at_generic();

-- 7. ROW LEVEL SECURITY ------------------------------------------------------
alter table public.study_plans enable row level security;
alter table public.topic_tracking enable row level security;
alter table public.test_records enable row level security;
alter table public.study_sessions enable row level security;

-- study_plans
drop policy if exists "study_plans_select_own" on public.study_plans;
create policy "study_plans_select_own" on public.study_plans
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "study_plans_insert_own" on public.study_plans;
create policy "study_plans_insert_own" on public.study_plans
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "study_plans_update_own" on public.study_plans;
create policy "study_plans_update_own" on public.study_plans
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "study_plans_delete_own" on public.study_plans;
create policy "study_plans_delete_own" on public.study_plans
  for delete to authenticated using (auth.uid() = user_id);

-- topic_tracking
drop policy if exists "topic_tracking_select_own" on public.topic_tracking;
create policy "topic_tracking_select_own" on public.topic_tracking
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "topic_tracking_insert_own" on public.topic_tracking;
create policy "topic_tracking_insert_own" on public.topic_tracking
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "topic_tracking_update_own" on public.topic_tracking;
create policy "topic_tracking_update_own" on public.topic_tracking
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "topic_tracking_delete_own" on public.topic_tracking;
create policy "topic_tracking_delete_own" on public.topic_tracking
  for delete to authenticated using (auth.uid() = user_id);

-- test_records
drop policy if exists "test_records_select_own" on public.test_records;
create policy "test_records_select_own" on public.test_records
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "test_records_insert_own" on public.test_records;
create policy "test_records_insert_own" on public.test_records
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "test_records_update_own" on public.test_records;
create policy "test_records_update_own" on public.test_records
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "test_records_delete_own" on public.test_records;
create policy "test_records_delete_own" on public.test_records
  for delete to authenticated using (auth.uid() = user_id);

-- study_sessions
drop policy if exists "study_sessions_select_own" on public.study_sessions;
create policy "study_sessions_select_own" on public.study_sessions
  for select to authenticated using (auth.uid() = user_id);
drop policy if exists "study_sessions_insert_own" on public.study_sessions;
create policy "study_sessions_insert_own" on public.study_sessions
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "study_sessions_update_own" on public.study_sessions;
create policy "study_sessions_update_own" on public.study_sessions
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "study_sessions_delete_own" on public.study_sessions;
create policy "study_sessions_delete_own" on public.study_sessions
  for delete to authenticated using (auth.uid() = user_id);