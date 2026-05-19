-- Chạy file này NẾU bạn đã chạy schema.sql trước khi có policy insert
-- (bỏ qua nếu setup mới từ đầu)

drop policy if exists "Authenticated users can create topics" on topics;
create policy "Authenticated users can create topics"
  on topics for insert to authenticated with check (true);

drop policy if exists "Authenticated users can create words" on words;
create policy "Authenticated users can create words"
  on words for insert to authenticated with check (true);

drop policy if exists "Users can insert own profile" on profiles;
create policy "Users can insert own profile"
  on profiles for insert with check (auth.uid() = id);
