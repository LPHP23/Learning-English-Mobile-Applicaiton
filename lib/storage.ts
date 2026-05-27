// lib/storage.ts
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { MMKV as MMKVType } from 'react-native-mmkv';

type StorageLike = {
  getString: (key: string) => string | undefined;
  getNumber: (key: string) => number | undefined;
  set: (key: string, value: string | number | boolean) => void;
  delete: (key: string) => void;
};

const memoryStore = new Map<string, string>();
let useAsyncFallback = false;

const memoryStorage: StorageLike = {
  getString: (key) => memoryStore.get(key),
  getNumber: (key) => {
    const value = memoryStore.get(key);
    if (value === undefined) return undefined;
    const num = Number(value);
    return Number.isNaN(num) ? undefined : num;
  },
  set: (key, value) => {
    const str = String(value);
    memoryStore.set(key, str);
    if (useAsyncFallback) {
      AsyncStorage.setItem(key, str).catch(() => {});
    }
  },
  delete: (key) => {
    memoryStore.delete(key);
    if (useAsyncFallback) {
      AsyncStorage.removeItem(key).catch(() => {});
    }
  },
};

function getWebStorage(): StorageLike {
  try {
    if (typeof localStorage === 'undefined') return memoryStorage;
    return {
      getString: (key) => {
        const value = localStorage.getItem(key);
        return value === null ? undefined : value;
      },
      getNumber: (key) => {
        const value = localStorage.getItem(key);
        if (value === null) return undefined;
        const num = Number(value);
        return Number.isNaN(num) ? undefined : num;
      },
      set: (key, value) => {
        localStorage.setItem(key, String(value));
      },
      delete: (key) => {
        localStorage.removeItem(key);
      },
    };
  } catch {
    return memoryStorage;
  }
}

function createNativeStorage(): StorageLike {
  try {
    const { MMKV } = require('react-native-mmkv') as {
      MMKV: new (options: { id: string; encryptionKey: string }) => MMKVType;
    };
    return new MMKV({
      id: 'vocaboost-storage',
      encryptionKey: 'vocaboost-secret',
    });
  } catch {
    useAsyncFallback = true;
    return memoryStorage;
  }
}

export const storage: StorageLike =
  Platform.OS === 'web' ? getWebStorage() : createNativeStorage();

let storageReady = !useAsyncFallback;

export async function hydrateStorage(keys?: string[]): Promise<void> {
  if (!useAsyncFallback || storageReady) return;
  try {
    if (keys && keys.length > 0) {
      const entries = await AsyncStorage.multiGet(keys);
      entries.forEach(([key, value]) => {
        if (value !== null) memoryStore.set(key, value);
      });
      return;
    }

    const allKeys = await AsyncStorage.getAllKeys();
    if (allKeys.length > 0) {
      const entries = await AsyncStorage.multiGet(allKeys);
      entries.forEach(([key, value]) => {
        if (value !== null) memoryStore.set(key, value);
      });
    }
  } finally {
    storageReady = true;
  }
}

export function isStorageReady(): boolean {
  return storageReady;
}

// ─── Keys ──────────────────────────────────────────────────────────────────────
const KEYS = {
  STREAK: 'streak',
  CURRENT_TOPIC: 'current_topic',
  WORD_PROGRESS: (topicId: string) => `progress_${topicId}`,
  CACHED_WORDS: (topicId: string) => `words_${topicId}`,
  QUIZ_HISTORY: 'quiz_history',
  USER_PREFS: 'user_prefs',
  DICT_CACHE: 'dict_cache',
  AVATAR_URI: (userId: string) => `avatar_${userId}`,
  WORD_CARD_INDEX: (userId: string, topicId: string) =>
    `word_card_${userId}_${topicId}`,
  AI_GEN_DATE: (userId: string, topicId: string) =>
    `ai_gen_${userId}_${topicId}`,
};

export const BOOTSTRAP_STORAGE_KEYS = [
  KEYS.STREAK,
  KEYS.USER_PREFS,
  KEYS.QUIZ_HISTORY,
];

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

// ─── Avatar (local) ─────────────────────────────────────────────────────────
export function getAvatarUri(userId: string): string | null {
  return storage.getString(KEYS.AVATAR_URI(userId)) ?? null;
}

export function setAvatarUri(userId: string, uri: string | null): void {
  if (!uri) {
    storage.delete(KEYS.AVATAR_URI(userId));
    return;
  }
  storage.set(KEYS.AVATAR_URI(userId), uri);
}

// ─── Word card position ─────────────────────────────────────────────────────
export function getWordCardIndex(userId: string, topicId: string): number {
  return storage.getNumber(KEYS.WORD_CARD_INDEX(userId, topicId)) ?? 0;
}

export function setWordCardIndex(
  userId: string,
  topicId: string,
  index: number
): void {
  storage.set(KEYS.WORD_CARD_INDEX(userId, topicId), index);
}

// ─── AI generation (per day) ───────────────────────────────────────────────
export function getLastAiGenerationDate(
  userId: string,
  topicId: string
): string | null {
  return storage.getString(KEYS.AI_GEN_DATE(userId, topicId)) ?? null;
}

export function setLastAiGenerationDate(
  userId: string,
  topicId: string,
  date: string
): void {
  storage.set(KEYS.AI_GEN_DATE(userId, topicId), date);
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
