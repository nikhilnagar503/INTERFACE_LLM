-- Fix signup issues by checking for triggers and constraints
-- Run this in Supabase SQL Editor to diagnose the problem

-- 0. Create profile on signup (safe trigger)
-- Creates a profile row when a new auth user is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
as $$
begin
	insert into public.profiles (user_id, display_name, avatar_url)
	values (new.id, coalesce(new.email, 'User'), null)
	on conflict (user_id) do nothing;

	return new;
end;
$$;

-- Ensure user_id is unique for ON CONFLICT to work
alter table public.profiles
  add constraint profiles_user_id_key unique (user_id);

-- Ensure trigger exists on auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
	after insert on auth.users
	for each row execute function public.handle_new_user();

-- 1. Check all triggers on auth schema
SELECT trigger_name, event_object_schema, event_object_table, action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
ORDER BY trigger_name;

-- 2. Check all triggers on public schema
SELECT trigger_name, event_object_schema, event_object_table, action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
ORDER BY trigger_name;

-- 3. Check for any foreign key constraints on profiles
SELECT constraint_name, table_name, column_name
FROM information_schema.key_column_usage
WHERE table_name = 'profiles'
ORDER BY constraint_name;

-- 4. Check for any functions that might be failing
SELECT proname, prosrc
FROM pg_proc
WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
AND proname ILIKE '%profile%'
ORDER BY proname;

-- If you see any triggers that auto-create profiles on auth.users, 
-- you may need to DROP them:
-- DROP TRIGGER IF EXISTS trigger_name ON auth.users;

-- 5. Test profile insert manually with your user ID (replace with actual UUID)
-- First, get a test user ID from auth.users:
SELECT id, email FROM auth.users LIMIT 1;

-- Then try inserting a profile for that user:
-- INSERT INTO profiles (user_id, display_name, avatar_url)
-- VALUES ('REPLACE_WITH_USER_ID', 'Test User', NULL);
