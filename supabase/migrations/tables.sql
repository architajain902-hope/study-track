-- ChatPlanner / SatiStudy Chat — Database schema
-- Tables: profiles, tasks, exams, streaks, completed_days
-- Row Level Security: every table scopes data to auth.uid()

-- Extensions
create extension if not exists pgcrypto;

-- 1. PROFILES --------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  username text unique,
  avatar_url text,
  daily_goal smallint not null default 3 check (daily_goal between 1 and 20),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. TASKS -----------------------------------------------------------------
create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(title) >= 1 and char_length(title) <= 200),
  description text check (description is null or char_length(description) <= 2000),
  subject text,
  due_date timestamptz,
  priority smallint not null default 2 check (priority between 1 and 3),
  recurrence text check (recurrence is null or recurrence in ('none', 'daily', 'weekly', 'monthly')),
  is_completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tasks_user_idx on public.tasks (user_id);
create index if not exists tasks_due_idx on public.tasks (due_date);
create index if not exists tasks_completed_idx on public.tasks (is_completed) where is_completed = false;

-- 3. EXAMS -----------------------------------------------------------------
create table if not exists public.exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  subject text not null check (char_length(subject) between 1 and 200),
  exam_date timestamptz not null,
  notes text check (notes is null or char_length(notes) <= 2000),
  created_at timestamptz not null default now()
);

create index if not exists exams_user_idx on public.exams (user_id);
create index if not exists exams_date_idx on public.exams (exam_date);

-- 4. STREAKS ---------------------------------------------------------------
create table if not exists public.streaks (
  user_id uuid primary key references auth.users (id) on delete cascade,
  current_streak integer not null default 0 check (current_streak >= 0),
  best_streak integer not null default 0 check (best_streak >= 0),
  last_completed_date date
);

-- 5. COMPLETED_DAYS (daily goal log) ---------------------------------------
create table if not exists public.completed_days (
  user_id uuid not null references auth.users (id) on delete cascade,
  day date not null,
  completed_count integer not null default 0,
  primary key (user_id, day)
);

-- 6. TRIGGERS ---------------------------------------------------------------
-- Auto-create profile + streak row on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''));
  insert into public.streaks (user_id)
  values (new.id);
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Touch updated_at on tasks
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tasks_touch_updated_at on public.tasks;
create trigger tasks_touch_updated_at
  before update on public.tasks
  for each row execute procedure public.touch_updated_at();

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute procedure public.touch_updated_at();

-- 7. ROW LEVEL SECURITY -----------------------------------------------------
alter table public.profiles enable row level security;
alter table public.tasks enable row level security;
alter table public.exams enable row level security;
alter table public.streaks enable row level security;
alter table public.completed_days enable row level security;

-- profiles: users manage their own profile
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select to authenticated
  using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- tasks: full CRUD scoped to owner
drop policy if exists "tasks_select_own" on public.tasks;
create policy "tasks_select_own" on public.tasks
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "tasks_insert_own" on public.tasks;
create policy "tasks_insert_own" on public.tasks
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "tasks_update_own" on public.tasks;
create policy "tasks_update_own" on public.tasks
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "tasks_delete_own" on public.tasks;
create policy "tasks_delete_own" on public.tasks
  for delete to authenticated
  using (auth.uid() = user_id);

-- exams: full CRUD scoped to owner
drop policy if exists "exams_select_own" on public.exams;
create policy "exams_select_own" on public.exams
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "exams_insert_own" on public.exams;
create policy "exams_insert_own" on public.exams
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "exams_update_own" on public.exams;
create policy "exams_update_own" on public.exams
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "exams_delete_own" on public.exams;
create policy "exams_delete_own" on public.exams
  for delete to authenticated
  using (auth.uid() = user_id);

-- streaks: select own row
drop policy if exists "streaks_select_own" on public.streaks;
create policy "streaks_select_own" on public.streaks
  for select to authenticated
  using (auth.uid() = user_id);

-- completed_days: select + upsert own rows (used by commit handler)
drop policy if exists "completed_days_select_own" on public.completed_days;
create policy "completed_days_select_own" on public.completed_days
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "completed_days_insert_own" on public.completed_days;
create policy "completed_days_insert_own" on public.completed_days
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "completed_days_update_own" on public.completed_days;
create policy "completed_days_update_own" on public.completed_days
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 8. STREAK ENGINE -----------------------------------------------------------
-- Called by the app when a task is completed. Increments (start/resume) the
-- streak for the calling user. Idempotent for the current day. Day boundary is
-- Asia/Kolkata (the college's local day). Row is locked (FOR UPDATE) so
-- concurrent calls cannot double-increment.
create or replace function public.commit_daily_goal()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  today date := (now() at time zone 'Asia/Kolkata')::date;
  prev_streak integer;
  prev_last_date date;
  new_streak integer;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;

  -- Upsert the daily counter (idempotent per task completion)
  insert into public.completed_days (user_id, day, completed_count)
  values (auth.uid(), today, 1)
  on conflict (user_id, day)
  do update set completed_count = public.completed_days.completed_count + 1;

  -- Lock the row while we read-modify-write to keep the check atomic
  select current_streak, last_completed_date
    into prev_streak, prev_last_date
  from public.streaks
  where user_id = auth.uid()
  for update;

  if prev_streak is null then
    insert into public.streaks (user_id, current_streak, best_streak, last_completed_date)
    values (auth.uid(), 1, 1, today);
    return 1;
  end if;

  -- Already counted today → no change (same-day repeats are no-ops)
  if prev_last_date is not null and prev_last_date = today then
    return prev_streak;
  end if;

  -- Completed yesterday → continue streak; otherwise start a new one
  if prev_last_date is not null and prev_last_date = today - 1 then
    new_streak := prev_streak + 1;
  else
    new_streak := 1;
  end if;

  update public.streaks
  set current_streak = new_streak,
      best_streak = greatest(best_streak, new_streak),
      last_completed_date = today
  where user_id = auth.uid();

  return new_streak;
end;
$$;

revoke all on function public.commit_daily_goal() from public;
grant execute on function public.commit_daily_goal() to authenticated;