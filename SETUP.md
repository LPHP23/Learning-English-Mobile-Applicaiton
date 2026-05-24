# 🚀 Setup Guide — VocaBoost

## Bước 1: Cài đặt môi trường

```bash
# Cài Node.js 18+ trước
node -v  # phải >= 18

# Cài Expo CLI
npm install -g expo-cli eas-cli

# Clone/copy project rồi install deps
cd vocaboost
npm install
```

## Bước 2: Setup Supabase

1. Vào **supabase.com** → Create new project
2. Vào **SQL Editor** → Paste toàn bộ file `supabase/schema.sql` → Run
3. Vào **Project Settings > API** → Copy 


4. Tạo file `.env`:
```bash
cp .env.example .env
# Điền EXPO_PUBLIC_SUPABASE_URL và EXPO_PUBLIC_SUPABASE_ANON_KEY
```

## Bước 3: Setup AI Provider

1. Tạo API key ở nhà cung cấp AI bạn chọn
2. Lưu vào Supabase Secrets (KHÔNG để trong .env):
```bash
supabase secrets set AI_ENDPOINT=https://your-ai-endpoint
supabase secrets set AI_API_KEY=your-ai-key
```

## Bước 4: Deploy Edge Functions

```bash
# Cài Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project (lấy project ref từ Supabase dashboard)
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy generate-words
supabase functions deploy generate-quiz
```

## Bước 5: Enable Google OAuth (optional)

1. Supabase Dashboard → Authentication → Providers → Google → Enable
2. Lấy Client ID/Secret từ Google Cloud Console
3. Điền vào Supabase

## Bước 6: Chạy app

```bash
# Development (scan QR với Expo Go app)
npx expo start

# iOS Simulator
npx expo start --ios

# Android Emulator  
npx expo start --android
```

## Bước 7: Build production (EAS)

```bash
# Đăng ký tài khoản expo.dev
eas login

# Config
eas build:configure

# Build Android APK
eas build --platform android --profile preview

# Build iOS (cần Apple Developer Account)
eas build --platform ios
```

## Cấu trúc DB đã tạo

| Bảng | Mô tả |
|------|-------|
| `profiles` | Thông tin người dùng |
| `topics` | Chủ đề từ vựng |
| `words` | Từ vựng (AI tạo) |
| `word_progress` | Tiến độ học từng từ |
| `user_progress` | Tiến độ theo chủ đề |
| `streaks` | Chuỗi ngày học |
| `vietphrase` | Từ điển Việt tĩnh |

## Lưu ý quan trọng

- ⚠️ **KHÔNG** để `AI_API_KEY` trong code hoặc `.env` client
- ✅ Chỉ lưu API key trong **Supabase Secrets** (server-side only)
- ✅ Edge Functions chạy trên server, an toàn để gọi API AI
- ✅ Row Level Security (RLS) đã bật → user chỉ đọc data của mình
