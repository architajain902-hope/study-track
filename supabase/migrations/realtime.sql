-- Enable Supabase Realtime for user-owned tables (safe to re-run).
-- duplicate_object is suppressed so this is idempotent.
do $$ begin
  alter publication supabase_realtime add table
    public.tasks, public.exams, public.profiles, public.streaks,
    public.study_plans, public.topic_tracking, public.test_records, public.study_sessions;
exception when duplicate_object then null;
end $$;