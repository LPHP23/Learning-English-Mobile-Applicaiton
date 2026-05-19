# Hướng dẫn cài đặt VocaBoost

App học từ vựng tiếng Anh (Expo + Supabase), chạy trên **iOS** và **Android**.

---

## Yêu cầu hệ thống

| Công cụ | Phiên bản |
|---------|-----------|
| Node.js | 18 trở lên (`node -v`) |
| npm | 9+ |
| Git | Tuỳ chọn |
| Tài khoản [Supabase](https://supabase.com) | Miễn phí |
| Expo Go (điện thoại) hoặc Simulator | Để chạy thử |

**Tuỳ chọn (Phase 2 — AI tạo từ):**

- Tài khoản [Anthropic](https://console.anthropic.com)
- [Supabase CLI](https://supabase.com/docs/guides/cli) để deploy Edge Functions

---

## Cài đặt nhanh (~15 phút, không cần Claude)

### 1. Clone / mở project

```bash
cd /path/to/vocaboost
npm install
```

### 2. Tạo icon & splash (nếu chưa có thư mục `assets/`)

```bash
npm run assets
# hoặc: python3 scripts/create-assets.py
```

### 3. Cấu hình Supabase

1. Vào [supabase.com](https://supabase.com) → **New project**
2. **SQL Editor** → chạy lần lượt **3 file** (copy toàn bộ nội dung, Run):

| Thứ tự | File | Mục đích |
|--------|------|----------|
| 1 | `supabase/schema.sql` | Tạo bảng + RLS |
| 2 | `supabase/seed-vietphrase.sql` | 30 từ cho từ điển EN↔VI |
| 3 | `supabase/seed-topics.sql` | 3 chủ đề: Hospital, Airport, Restaurant |

> Nếu đã chạy `schema.sql` cũ (thiếu quyền insert): chạy thêm `supabase/patch-rls.sql`

3. **Authentication** → **Providers** → **Email**:
   - Bật Email
   - **Tắt** “Confirm email” khi dev (đăng ký xong vào app ngay)

4. **Project Settings** → **API** → copy:
   - `Project URL`
   - `anon` `public` key

### 4. File `.env`

```bash
cp .env.example .env
```

Sửa `.env`:

```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Tuỳ chọn — tăng quota dịch MyMemory
# EXPO_PUBLIC_MYMEMORY_EMAIL=email@cua-ban.com
```

### 5. Chạy app

```bash
npx expo start
```

- Quét QR bằng **Expo Go** (Android/iOS)
- Hoặc `npx expo start --ios` / `--android`

### 6. Đăng ký & kiểm tra

1. **Đăng ký** tài khoản mới
2. Tab **Trang chủ** → thấy 3 chủ đề 🏥 ✈️ 🍽️
3. Chọn chủ đề → học thẻ từ (lật thẻ, 🔊 phát âm)
4. Tab **Từ điển** → tra `hospital`, `bệnh viện`
5. Tab **Quiz** → làm bài (cần có từ trong DB)
6. Tab **Cá nhân** → streak, cài đặt TTS

---

## Cài đặt đầy đủ (có AI Claude)

### Bước A — Anthropic API

1. [console.anthropic.com](https://console.anthropic.com) → tạo API key
2. **Không** ghi key vào `.env` trên máy client

### Bước B — Supabase CLI & Edge Functions

```bash
npm install -g supabase

supabase login
supabase link --project-ref YOUR_PROJECT_REF
# Project ref: Settings → General → Reference ID

supabase secrets set ANTHROPIC_API_KEY=sk-ant-api03-xxxxx

supabase functions deploy generate-words
supabase functions deploy generate-quiz
```

Kiểm tra: Dashboard → **Edge Functions** → thấy 2 function **Active**.

### Bước C — Thêm chủ đề bằng AI

1. Trang chủ → **+ Thêm** → chọn chủ đề (Office, Travel, …)
2. App gọi Claude tạo ~60 từ/chủ đề (30–60 giây)
3. Nếu AI lỗi: app tự dùng từ có sẵn (`lib/builtinTopics.ts`) cho Hospital / Airport / Restaurant

---

## Google đăng nhập (tuỳ chọn)

1. [Google Cloud Console](https://console.cloud.google.com) → OAuth Client ID
2. Supabase → **Authentication** → **Providers** → **Google** → bật, dán Client ID/Secret
3. Redirect URL: copy từ Supabase (dạng `https://xxx.supabase.co/auth/v1/callback`)

---

## Build lên App Store / Play Store (EAS)

```bash
npm install -g eas-cli
eas login
eas build:configure
# Sửa app.json → extra.eas.projectId sau khi tạo project trên expo.dev

eas build --platform android --profile preview
eas build --platform ios
```

Cần tài khoản Apple Developer ($99/năm) cho iOS.

---

## Cấu trúc project

```
vocaboost/
├── app/                    # Màn hình (Expo Router)
│   ├── (auth)/             # Đăng nhập, đăng ký
│   ├── (tabs)/             # Home, Quiz, Dictionary, Profile
│   ├── word-card.tsx       # Thẻ từ học
│   └── topic-select.tsx    # Chọn chủ đề
├── lib/
│   ├── supabase.ts         # Client + helpers DB
│   ├── api.ts              # Edge Functions + export dictionary
│   ├── dictionaryApi.ts    # Từ điển miễn phí (3 nguồn)
│   ├── builtinTopics.ts    # Từ mẫu offline
│   ├── storage.ts          # MMKV cache
│   └── tts.ts              # expo-speech
├── constants/theme.ts      # Màu & design tokens
├── supabase/
│   ├── schema.sql
│   ├── seed-vietphrase.sql
│   ├── seed-topics.sql
│   └── functions/          # generate-words, generate-quiz
├── docs/DICTIONARY_API.md
├── scripts/create-assets.py
├── SETUP.md                # File này
└── .env                    # Không commit lên Git
```

---

## Database

| Bảng | Mô tả |
|------|--------|
| `profiles` | Hồ sơ user (tự tạo khi đăng ký) |
| `topics` | Chủ đề học |
| `words` | Từ vựng theo chủ đề |
| `word_progress` | Tiến độ từng từ / ôn lại |
| `user_progress` | Tiến độ theo chủ đề |
| `streaks` | Chuỗi ngày học |
| `vietphrase` | Từ điển tra cứu |

---

## API & dịch vụ

| Dịch vụ | Dùng cho | API key |
|---------|----------|---------|
| Supabase | Auth, DB, Edge Functions | `.env` (anon key) |
| dictionaryapi.dev | IPA, định nghĩa EN | Không |
| mymemory.translated.net | Dịch EN↔VI | Không (email tùy chọn) |
| Anthropic Claude | Tạo từ & quiz AI | Supabase Secrets only |
| expo-speech | Phát âm TTS | Không |

Chi tiết từ điển: [docs/DICTIONARY_API.md](docs/DICTIONARY_API.md)

---

## Biến môi trường

| Biến | Bắt buộc | Ghi chú |
|------|----------|---------|
| `EXPO_PUBLIC_SUPABASE_URL` | Có | URL project Supabase |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | Có | Anon public key |
| `EXPO_PUBLIC_MYMEMORY_EMAIL` | Không | Tăng quota dịch |
| `ANTHROPIC_API_KEY` | Chỉ server | `supabase secrets set` |

---

## Xử lý lỗi thường gặp

### `Thiếu EXPO_PUBLIC_SUPABASE_URL`

- Chưa tạo `.env` hoặc chưa restart Metro sau khi sửa `.env`
- Chạy: `npx expo start -c` (clear cache)

### Đăng ký xong không vào được app

- Supabase → Auth → tắt **Confirm email** (môi trường dev)
- Hoặc mở link xác nhận trong email

### Trang chủ trống, không có chủ đề

- Chạy lại `supabase/seed-topics.sql` trong SQL Editor
- Hoặc: **+ Thêm** → chọn Hospital / Airport / Restaurant

### Từ điển không có nghĩa tiếng Việt

- Chạy `seed-vietphrase.sql`
- Kiểm tra bảng `vietphrase` có dữ liệu (Table Editor)

### Thêm chủ đề báo lỗi RLS / permission denied

- Chạy `supabase/patch-rls.sql` hoặc chạy lại phần policy cuối `schema.sql`

### Edge Function / AI không hoạt động

- `supabase secrets set ANTHROPIC_API_KEY=...`
- Deploy lại: `supabase functions deploy generate-words`
- App vẫn học được nhờ `builtinTopics` + `seed-topics.sql`

### `Unable to resolve asset ./assets/icon.png`

```bash
npm run assets
```

### Metro / build lỗi cache

```bash
rm -rf node_modules .expo
npm install
npx expo start -c
```

### `Unable to resolve module @opentelemetry/api`

```bash
npm install @opentelemetry/api
```

### Quét QR báo "No usable data found"

1. **Không** quét bằng app **Camera** của iPhone/Android — dùng app **Expo Go** → **Scan QR code**
2. **Không** dùng `npm run start:offline` khi cần quét QR — chạy:
   ```bash
   npx expo start
   ```
   Hoặc mạng khó kết nối:
   ```bash
   npm run start:tunnel
   ```
3. Điện thoại và Mac **cùng Wi‑Fi** (trừ khi dùng tunnel)
4. Cập nhật **Expo Go** lên bản mới nhất (hỗ trợ SDK 51)
5. Nhập tay trong Expo Go → **Enter URL manually**:
   ```text
   exp://<IP-MAC>:8081
   ```
   (IP Mac: System Settings → Network; thay `<IP-MAC>` ví dụ `192.168.1.5`)

### `EMFILE: too many open files` (macOS)

```bash
ulimit -n 10240
npx expo start
```

### Expo CLI báo lỗi mạng / "Blocked by"

```bash
EXPO_OFFLINE=1 npx expo start --offline
```

---

## Checklist sau khi setup

- [ ] `npm install` thành công
- [ ] `npm run assets` — có folder `assets/`
- [ ] `.env` đã điền URL + anon key
- [ ] SQL: `schema.sql` → `seed-vietphrase.sql` → `seed-topics.sql`
- [ ] Auth: tắt confirm email (dev)
- [ ] Đăng ký / đăng nhập OK
- [ ] 3 chủ đề hiện trên Trang chủ
- [ ] Học thẻ từ + phát âm OK
- [ ] Từ điển tra `hospital` OK
- [ ] Quiz có câu hỏi (sau khi có từ trong DB)

---

## Lộ trình phát triển

| Phase | Tính năng |
|-------|-----------|
| **1 (MVP)** | Thẻ từ, streak, từ điển, 3 chủ đề, quiz |
| **2** | Claude tạo chủ đề, CEFR, SRS, push notification |
| **3** | ElevenLabs TTS, quiz nâng cao, leaderboard, store |

---

## Bảo mật

- Không commit `.env` lên Git (đã có trong `.gitignore` nếu dùng git)
- Không đặt `ANTHROPIC_API_KEY` trong code client
- RLS Supabase: user chỉ sửa dữ liệu của mình (`word_progress`, `streaks`, …)
- `topics` / `words`: đọc công khai; chỉ user đăng nhập mới **thêm** mới

---

## Liên hệ & tài liệu

- [Expo docs](https://docs.expo.dev)
- [Supabase docs](https://supabase.com/docs)
- [Expo Router](https://docs.expo.dev/router/introduction/)
