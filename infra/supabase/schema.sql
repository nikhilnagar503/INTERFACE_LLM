-- Supabase schema for chats, prompts, and user settings (no provider API keys stored)
-- Run this in Supabase SQL editor or via migrations.
-- Uses auth.uid() for per-user isolation via RLS.

-- Enable required extensions
create extension if not exists "pgcrypto"; -- for gen_random_uuid()

-- Profiles (optional metadata for users)
create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Chat sessions
create table if not exists chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'New Chat',
  model_used text,
  message_count integer not null default 0,
  last_message_at timestamptz not null default now(),
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Chat messages
create table if not exists chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references chat_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system', 'tool', 'error')),
  content text not null,
  model text,
  tokens_used integer,
  metadata jsonb,
  created_at timestamptz not null default now()
);

-- Prompts saved by users
create table if not exists prompts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade, -- nullable for system prompts
  title text not null,
  description text,
  content text not null,
  tags text[] not null default '{}',
  is_public boolean not null default false, -- if true, anyone can read
  is_system boolean not null default false, -- true for built-in/system prompts
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes for performance
create index if not exists idx_chat_sessions_user on chat_sessions(user_id, last_message_at desc);
create index if not exists idx_chat_messages_session on chat_messages(session_id, created_at asc);
create index if not exists idx_prompts_user on prompts(user_id, created_at desc);
create index if not exists idx_prompts_public on prompts(is_public, created_at desc);

-- Enable Row Level Security
alter table profiles enable row level security;
alter table chat_sessions enable row level security;
alter table chat_messages enable row level security;
alter table prompts enable row level security;

-- Profiles policies
create policy "Profiles: owner access" on profiles
  using (user_id = auth.uid());
create policy "Profiles: insert self" on profiles
  for insert with check (user_id = auth.uid());

-- User settings policies
-- Chat sessions policies
create policy "Sessions: owner access" on chat_sessions
  using (user_id = auth.uid());
create policy "Sessions: insert self" on chat_sessions
  for insert with check (user_id = auth.uid());
create policy "Sessions: update self" on chat_sessions
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Sessions: delete self" on chat_sessions
  for delete using (user_id = auth.uid());

-- Chat messages policies (tie to session ownership)
create policy "Messages: session owner" on chat_messages
  using (
    exists (
      select 1 from chat_sessions s
      where s.id = chat_messages.session_id and s.user_id = auth.uid()
    )
  );
create policy "Messages: insert by session owner" on chat_messages
  for insert with check (
    exists (
      select 1 from chat_sessions s
      where s.id = chat_messages.session_id and s.user_id = auth.uid()
    )
  );
create policy "Messages: update by session owner" on chat_messages
  for update using (
    exists (
      select 1 from chat_sessions s
      where s.id = chat_messages.session_id and s.user_id = auth.uid()
    )
  ) with check (
    exists (
      select 1 from chat_sessions s
      where s.id = chat_messages.session_id and s.user_id = auth.uid()
    )
  );
create policy "Messages: delete by session owner" on chat_messages
  for delete using (
    exists (
      select 1 from chat_sessions s
      where s.id = chat_messages.session_id and s.user_id = auth.uid()
    )
  );

-- Prompts policies (own data + public read)
create policy "Prompts: owner full access" on prompts
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
create policy "Prompts: public read" on prompts
  for select using (is_public = true);
-- Allow everyone to read system prompts (seeded built-ins)
create policy "Prompts: system read" on prompts
  for select using (is_system = true);
-- Allow inserting system prompts (user_id can be null for system prompts)
create policy "Prompts: insert system" on prompts
  for insert with check (is_system = true and user_id is null);

-- Timestamps trigger to keep updated_at fresh
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_profiles_updated
  before update on profiles
  for each row execute function set_updated_at();

create trigger trg_chat_sessions_updated
  before update on chat_sessions
  for each row execute function set_updated_at();

create trigger trg_prompts_updated
  before update on prompts
  for each row execute function set_updated_at();

-- Optional: keep chat_sessions counters in sync when inserting messages
-- (can be done in app code; leaving as a helper example)
-- create or replace function bump_session_counters()
-- returns trigger as $$
-- begin
--   update chat_sessions
--   set message_count = coalesce(message_count, 0) + 1,
--       last_message_at = now(),
--       updated_at = now()
--   where id = new.session_id;
--   return new;
-- end;
-- $$ language plpgsql;
--
-- create trigger trg_chat_messages_insert
--   after insert on chat_messages
--   for each row execute function bump_session_counters();
