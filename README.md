# VocaBoost

Ứng dụng học từ vựng tiếng Anh cho người Việt — **iOS & Android** (React Native / Expo).

## Tính năng

- Thẻ từ: IPA, nghĩa Việt, ví dụ, phát âm (TTS)
- Chuỗi ngày học (streak)
- Từ điển Anh ↔ Việt (API miễn phí)
- Chủ đề: Hospital, Airport, Restaurant (+ thêm bằng AI)
- Quiz trắc nghiệm ôn tập

## Luồng hoạt động (workflow)

```mermaid
flowchart TD
	user[Người dùng] --> app[App UI]
	app --> auth[Supabase Auth]
	app --> topics[Màn chủ đề / thẻ từ]
	topics --> db[(Supabase DB)]
	topics -->|Tạo từ mới| edge[Edge Function: generate-words]
	edge --> ai[AI Provider (Gemini)]
	app --> dict[Tra từ điển]
	dict --> vp[(vietphrase table)]
	dict --> fd[Free Dictionary API]
	dict --> mm[MyMemory Translation]
	app --> quiz[Quiz]
	quiz --> edge2[Edge Function: generate-quiz]
	edge2 --> ai
```

## Database (Supabase)

| Bảng | Mô tả | Dữ liệu chính |
| --- | --- | --- |
| `profiles` | Hồ sơ người dùng | `full_name`, `email`, `daily_goal` |
| `topics` | Chủ đề từ vựng | `name`, `description`, `total_words` |
| `words` | Từ vựng theo chủ đề | `word`, `vietnamese_meaning`, `cefr_level` |
| `word_progress` | Tiến độ từng từ | `learned`, `review_date` |
| `user_progress` | Tiến độ theo chủ đề | `learned_count`, `total_count` |
| `streaks` | Chuỗi ngày học | `current_streak`, `last_study_date` |
| `vietphrase` | Từ điển nội bộ | `word`, `vietnamese_meaning`, `topics` |

## Luồng data & API sử dụng

| Luồng | API/DB | Mục đích |
| --- | --- | --- |
| Đăng nhập/đăng ký | Supabase Auth | Xác thực, tạo session, lấy `user_id` |
| Chủ đề & từ vựng | Supabase DB: `topics`, `words` | Lưu danh sách chủ đề và từ vựng |
| Tiến độ học | Supabase DB: `word_progress`, `user_progress`, `streaks` | Lưu trạng thái học, chuỗi ngày |
| Tạo từ mới (AI) | Edge Function `generate-words` → Google Generative Language API | Sinh thêm từ cho chủ đề |
| Từ điển | `vietphrase` → Free Dictionary → MyMemory | Tra nghĩa, IPA, ví dụ |
| Cache cục bộ | MMKV + AsyncStorage fallback | Cache từ điển, lịch sử quiz, vị trí học dở |
| TTS | `expo-speech` | Phát âm từ và câu ví dụ |

## Cách hệ thống hoạt động theo chức năng

- Đăng nhập/đăng ký: app gọi Supabase Auth, nhận session → tạo/đọc `profiles`.
- Trang Home: tải `topics` + `user_progress`, hiển thị tiến độ và chủ đề học tiếp.
- Chọn chủ đề: tạo chủ đề mới nếu chưa có; nếu thiếu từ, gọi Edge Function để sinh từ và lưu vào `words`.
- Học thẻ từ: tải `words` theo `cefr_order`, lưu `word_progress`, cập nhật `streaks`, ghi vị trí học dở trong cache.
- Tạo từ mỗi ngày: khi mở thẻ từ, nếu ngày mới thì gọi AI để bổ sung từ không trùng.
- Từ điển: tra theo thứ tự cache → `vietphrase` → Free Dictionary → MyMemory, sau đó lưu cache 7 ngày.
- Quiz: hiện tại tạo câu hỏi từ `words` trên client; Edge Function `generate-quiz` sẵn sàng để nâng cấp.
- Hồ sơ: cập nhật `full_name` lên `profiles`, avatar lưu cục bộ.

## Bắt đầu

**Đọc hướng dẫn đầy đủ:** [SETUP.md](SETUP.md)

```bash
npm install
cp .env.example .env   # điền Supabase URL + anon key
npm run assets
npx expo start
```

## Tech stack

| Layer | Công nghệ |
|-------|-----------|
| App | Expo 51, Expo Router, TypeScript |
| Backend | Supabase (PostgreSQL, Auth, Edge Functions) |
| AI (tuỳ chọn) | Google Generative Language API qua Edge Functions |
| Từ điển | Free Dictionary + MyMemory + VietPhrase DB |
| Local cache | MMKV + AsyncStorage fallback |

## Tài liệu

- [SETUP.md](SETUP.md) — cài đặt từ A–Z
- [docs/DICTIONARY_API.md](docs/DICTIONARY_API.md) — API từ điển miễn phí
# Learning-English-Mobile-Applicaiton
