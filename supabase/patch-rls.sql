-- Chạy file này NẾU bạn đã chạy schema.sql trước khi có policy insert
-- (bỏ qua nếu setup mới từ đầu)

alter table topics add column if not exists user_id uuid references auth.users(id) on delete cascade;
create index if not exists topics_user_idx on topics(user_id);

alter table topics enable row level security;
alter table words enable row level security;
alter table vietphrase enable row level security;

drop policy if exists "Topics are public" on topics;
drop policy if exists "Authenticated users can create topics" on topics;
drop policy if exists "Authenticated users can update topics" on topics;
drop policy if exists "Users can read own topics" on topics;
drop policy if exists "Users can create own topics" on topics;
drop policy if exists "Users can update own topics" on topics;
drop policy if exists "Users can delete own topics" on topics;

create policy "Users can read own topics"
  on topics for select to authenticated using (auth.uid() = user_id);
create policy "Users can create own topics"
  on topics for insert to authenticated with check (auth.uid() = user_id);
create policy "Users can update own topics"
  on topics for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete own topics"
  on topics for delete to authenticated using (auth.uid() = user_id);

drop policy if exists "Words are public" on words;
drop policy if exists "Authenticated users can create words" on words;
drop policy if exists "Users can read own words" on words;
drop policy if exists "Users can create words for own topics" on words;
drop policy if exists "Users can update own words" on words;
drop policy if exists "Users can delete own words" on words;

create policy "Users can read own words"
  on words for select to authenticated
  using (exists (
    select 1 from topics t
    where t.id = words.topic_id
      and t.user_id = auth.uid()
  ));
create policy "Users can create words for own topics"
  on words for insert to authenticated
  with check (exists (
    select 1 from topics t
    where t.id = words.topic_id
      and t.user_id = auth.uid()
  ));
create policy "Users can update own words"
  on words for update to authenticated
  using (exists (
    select 1 from topics t
    where t.id = words.topic_id
      and t.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from topics t
    where t.id = words.topic_id
      and t.user_id = auth.uid()
  ));
create policy "Users can delete own words"
  on words for delete to authenticated
  using (exists (
    select 1 from topics t
    where t.id = words.topic_id
      and t.user_id = auth.uid()
  ));

drop policy if exists "Users can insert own profile" on profiles;
create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);

select id, email from auth.users;

update public.topics
set user_id = '<YOUR_USER_ID>'
where user_id is null;