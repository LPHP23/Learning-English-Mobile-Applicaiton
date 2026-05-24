# VocaBoost

Ứng dụng học từ vựng tiếng Anh cho người Việt — **iOS & Android** (React Native / Expo).

## Tính năng

- Thẻ từ: IPA, nghĩa Việt, ví dụ, phát âm (TTS)
- Chuỗi ngày học (streak)
- Từ điển Anh ↔ Việt (API miễn phí)
- Chủ đề: Hospital, Airport, Restaurant (+ thêm bằng AI)
- Quiz trắc nghiệm ôn tập

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
| AI (tuỳ chọn) | AI provider qua Edge Functions |
| Từ điển | Free Dictionary + MyMemory + VietPhrase DB |
| Local cache | MMKV |

## Tài liệu

- [SETUP.md](SETUP.md) — cài đặt từ A–Z
- [docs/DICTIONARY_API.md](docs/DICTIONARY_API.md) — API từ điển miễn phí
# Learning-English-Mobile-Applicaiton
