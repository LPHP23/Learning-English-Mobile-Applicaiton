-- ============================================================
-- VocaBoost Database Schema
-- Run in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── Profiles ────────────────────────────────────────────────
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  daily_goal int default 20,
  notification_time text default '08:00',
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email
  );
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ─── Topics ──────────────────────────────────────────────────
create table if not exists topics (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  emoji text default '📚',
  description text,
  total_words int default 60,
  cefr_level text default 'B1',
  created_at timestamptz default now()
);

-- ─── Words ───────────────────────────────────────────────────
create table if not exists words (
  id uuid primary key default uuid_generate_v4(),
  topic_id uuid references topics(id) on delete cascade,
  word text not null,
  ipa text,
  part_of_speech text default 'n',
  cefr_level text not null,
  cefr_order int default 0,
  vietnamese_meaning text not null,
  example_sentence text,
  created_at timestamptz default now()
);

create index if not exists words_topic_idx on words(topic_id);
create index if not exists words_cefr_idx on words(cefr_order);

-- ─── Word progress (per user) ─────────────────────────────────
create table if not exists word_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  word_id uuid references words(id) on delete cascade,
  learned boolean default false,
  review_date timestamptz,
  updated_at timestamptz default now(),
  unique(user_id, word_id)
);

create index if not exists wp_user_idx on word_progress(user_id);
create index if not exists wp_review_idx on word_progress(review_date);

-- ─── User progress per topic ─────────────────────────────────
create table if not exists user_progress (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade,
  topic_id uuid references topics(id) on delete cascade,
  learned_count int default 0,
  total_count int default 0,
  last_studied timestamptz,
  unique(user_id, topic_id)
);

-- Auto-update user_progress when word_progress changes
create or replace function update_user_progress()
returns trigger as $$
declare
  v_topic_id uuid;
  v_learned_count int;
  v_total_count int;
begin
  select topic_id into v_topic_id from words where id = new.word_id;

  select count(*) into v_learned_count
  from word_progress wp
  join words w on w.id = wp.word_id
  where wp.user_id = new.user_id
    and w.topic_id = v_topic_id
    and wp.learned = true;

  select count(*) into v_total_count
  from words where topic_id = v_topic_id;

  insert into user_progress (user_id, topic_id, learned_count, total_count, last_studied)
  values (new.user_id, v_topic_id, v_learned_count, v_total_count, now())
  on conflict (user_id, topic_id) do update
    set learned_count = v_learned_count,
        total_count = v_total_count,
        last_studied = now();

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_word_progress_change on word_progress;
create trigger on_word_progress_change
  after insert or update on word_progress
  for each row execute procedure update_user_progress();

-- ─── Streaks ─────────────────────────────────────────────────
create table if not exists streaks (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade unique,
  current_streak int default 0,
  longest_streak int default 0,
  last_study_date date,
  updated_at timestamptz default now()
);

-- ─── VietPhrase lookup table ──────────────────────────────────
-- Import from github.com/vanthanhtran245/VietPhrase
create table if not exists vietphrase (
  id uuid primary key default uuid_generate_v4(),
  word text not null,
  ipa text,
  part_of_speech text,
  vietnamese_meaning text,
  example_sentence text,
  cefr_level text,
  topics text[] default '{}',
  created_at timestamptz default now()
);

create index if not exists vp_word_idx on vietphrase(word);
create index if not exists vp_meaning_idx on vietphrase using gin(to_tsvector('simple', vietnamese_meaning));

-- ─── Row Level Security ──────────────────────────────────────
alter table profiles enable row level security;
alter table word_progress enable row level security;
alter table user_progress enable row level security;
alter table streaks enable row level security;

-- Profiles: users can only see/edit their own
create policy "Users can view own profile"
  on profiles for select using (auth.uid() = id);
create policy "Users can update own profile"
  on profiles for update using (auth.uid() = id);

-- Word progress: own data only
create policy "Users can manage own word progress"
  on word_progress for all using (auth.uid() = user_id);

-- User progress: own data only  
create policy "Users can view own topic progress"
  on user_progress for all using (auth.uid() = user_id);

-- Streaks: own data only
create policy "Users can manage own streak"
  on streaks for all using (auth.uid() = user_id);

-- Topics and Words: public read, authenticated insert
create policy "Topics are public" on topics for select using (true);
create policy "Authenticated users can create topics"
  on topics for insert to authenticated with check (true);

create policy "Words are public" on words for select using (true);
create policy "Authenticated users can create words"
  on words for insert to authenticated with check (true);

create policy "VietPhrase is public" on vietphrase for select using (true);

-- Profiles: allow insert on signup (trigger runs as definer; users may upsert own row)
create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);
