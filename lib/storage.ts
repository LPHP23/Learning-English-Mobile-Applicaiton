// lib/storage.ts
import { MMKV } from 'react-native-mmkv';

export const storage = new MMKV({
  id: 'vocaboost-storage',
  encryptionKey: 'vocaboost-secret',
});

// ─── Keys ──────────────────────────────────────────────────────────────────────
const KEYS = {
  STREAK: 'streak',
  CURRENT_TOPIC: 'current_topic',
  WORD_PROGRESS: (topicId: string) => `progress_${topicId}`,
  CACHED_WORDS: (topicId: string) => `words_${topicId}`,
  QUIZ_HISTORY: 'quiz_history',
  USER_PREFS: 'user_prefs',
  DICT_CACHE: 'dict_cache',
};

const DICT_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 ngày

interface DictCacheEntry {
  data: import('../types').DictionaryEntry;
  savedAt: number;
}

// ─── Streak ────────────────────────────────────────────────────────────────────
export function getLocalStreak(): number {
  return storage.getNumber(KEYS.STREAK) ?? 0;
}

export function setLocalStreak(streak: number): void {
  storage.set(KEYS.STREAK, streak);
}

// ─── Topic progress ────────────────────────────────────────────────────────────
export function getTopicProgress(topicId: string): {
  learned: number;
  total: number;
} {
  const raw = storage.getString(KEYS.WORD_PROGRESS(topicId));
  if (!raw) return { learned: 0, total: 0 };
  return JSON.parse(raw);
}

export function setTopicProgress(
  topicId: string,
  learned: number,
  total: number
): void {
  storage.set(KEYS.WORD_PROGRESS(topicId), JSON.stringify({ learned, total }));
}

// ─── Cached words ──────────────────────────────────────────────────────────────
export function getCachedWords(topicId: string): any[] | null {
  const raw = storage.getString(KEYS.CACHED_WORDS(topicId));
  if (!raw) return null;
  return JSON.parse(raw);
}

export function setCachedWords(topicId: string, words: any[]): void {
  storage.set(KEYS.CACHED_WORDS(topicId), JSON.stringify(words));
}

// ─── User preferences ──────────────────────────────────────────────────────────
export interface UserPrefs {
  daily_goal: number;
  notification_time: string;
  tts_enabled: boolean;
  tts_speed: number;
}

export function getUserPrefs(): UserPrefs {
  const raw = storage.getString(KEYS.USER_PREFS);
  if (!raw)
    return {
      daily_goal: 20,
      notification_time: '08:00',
      tts_enabled: true,
      tts_speed: 0.8,
    };
  return JSON.parse(raw);
}

export function setUserPrefs(prefs: Partial<UserPrefs>): void {
  const current = getUserPrefs();
  storage.set(KEYS.USER_PREFS, JSON.stringify({ ...current, ...prefs }));
}

// ─── Quiz history ──────────────────────────────────────────────────────────────
export interface QuizResult {
  date: string;
  topic_id: string;
  score: number;
  total: number;
}

export function addQuizResult(result: QuizResult): void {
  const raw = storage.getString(KEYS.QUIZ_HISTORY);
  const history: QuizResult[] = raw ? JSON.parse(raw) : [];
  history.unshift(result);
  // Keep last 50 results
  storage.set(KEYS.QUIZ_HISTORY, JSON.stringify(history.slice(0, 50)));
}

export function getQuizHistory(): QuizResult[] {
  const raw = storage.getString(KEYS.QUIZ_HISTORY);
  return raw ? JSON.parse(raw) : [];
}

// ─── Dictionary cache (giảm gọi API) ─────────────────────────────────────────
export function getDictionaryCache(
  key: string
): import('../types').DictionaryEntry | null {
  const raw = storage.getString(KEYS.DICT_CACHE);
  if (!raw) return null;

  const all: Record<string, DictCacheEntry> = JSON.parse(raw);
  const entry = all[key];
  if (!entry) return null;

  if (Date.now() - entry.savedAt > DICT_CACHE_TTL_MS) {
    return null;
  }

  return entry.data;
}

export function setDictionaryCache(
  key: string,
  data: import('../types').DictionaryEntry
): void {
  const raw = storage.getString(KEYS.DICT_CACHE);
  const all: Record<string, DictCacheEntry> = raw ? JSON.parse(raw) : {};

  // Giữ tối đa 200 mục
  const keys = Object.keys(all);
  if (keys.length >= 200) {
    const oldest = keys.sort(
      (a, b) => (all[a].savedAt ?? 0) - (all[b].savedAt ?? 0)
    )[0];
    delete all[oldest];
  }

  all[key] = { data, savedAt: Date.now() };
  storage.set(KEYS.DICT_CACHE, JSON.stringify(all));
}
