// lib/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import { getSupabaseConfig, isSupabaseConfigured } from './config';

function createSupabaseClient(): SupabaseClient {
  const { url: supabaseUrl, anonKey: supabaseAnonKey } = getSupabaseConfig();

// Custom storage adapter using Expo SecureStore
const ExpoSecureStoreAdapter = {
  getItem: (key: string) => {
    return SecureStore.getItemAsync(key);
  },
  setItem: (key: string, value: string) => {
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: (key: string) => {
    return SecureStore.deleteItemAsync(key);
  },
};

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: ExpoSecureStoreAdapter,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

let _client: SupabaseClient | null = null;

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop, receiver) {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase chưa cấu hình. Xem SETUP.md');
    }
    if (!_client) _client = createSupabaseClient();
    const value = Reflect.get(_client, prop, receiver);
    return typeof value === 'function' ? value.bind(_client) : value;
  },
});

// ─── DB helpers ────────────────────────────────────────────────────────────────

export async function getTopics(userId: string) {
  const [{ data: topics, error: topicsErr }, { data: progress, error: progErr }] =
    await Promise.all([
      supabase.from('topics').select('*').order('created_at', { ascending: false }),
      supabase.from('user_progress').select('*').eq('user_id', userId),
    ]);

  if (topicsErr) throw topicsErr;
  if (progErr) throw progErr;

  return (topics ?? []).map((topic) => ({
    ...topic,
    user_progress: (progress ?? []).filter((p) => p.topic_id === topic.id),
  }));
}

export async function getWordsByTopic(topicId: string, userId: string) {
  const { data, error } = await supabase
    .from('words')
    .select(`
      *,
      word_progress!left(learned, review_date)
    `)
    .eq('topic_id', topicId)
    .eq('word_progress.user_id', userId)
    .order('cefr_order', { ascending: true });

  if (error) throw error;
  return data;
}

export async function markWordLearned(wordId: string, userId: string) {
  const { error } = await supabase
    .from('word_progress')
    .upsert({
      word_id: wordId,
      user_id: userId,
      learned: true,
      review_date: new Date(Date.now() + 86400000).toISOString(), // next day
    });

  if (error) throw error;
}

export async function markWordForReview(wordId: string, userId: string) {
  const { error } = await supabase
    .from('word_progress')
    .upsert({
      word_id: wordId,
      user_id: userId,
      learned: false,
      review_date: new Date().toISOString(),
    });

  if (error) throw error;
}

export async function updateStreak(userId: string) {
  const today = new Date().toISOString().split('T')[0];

  const { data: existing } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (!existing) {
    await supabase.from('streaks').insert({
      user_id: userId,
      current_streak: 1,
      longest_streak: 1,
      last_study_date: today,
    });
    return;
  }

  const lastDate = new Date(existing.last_study_date);
  const todayDate = new Date(today);
  const diffDays = Math.floor(
    (todayDate.getTime() - lastDate.getTime()) / 86400000
  );

  if (diffDays === 0) return; // Already studied today

  const newStreak = diffDays === 1 ? existing.current_streak + 1 : 1;
  const newLongest = Math.max(newStreak, existing.longest_streak);

  await supabase
    .from('streaks')
    .update({
      current_streak: newStreak,
      longest_streak: newLongest,
      last_study_date: today,
    })
    .eq('user_id', userId);
}

export async function getStreak(userId: string) {
  const { data, error } = await supabase
    .from('streaks')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) return null;
  return data;
}
