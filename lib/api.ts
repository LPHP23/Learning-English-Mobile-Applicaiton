// lib/api.ts
import { supabase } from './supabase';
import type { Word, QuizQuestion } from '../types';

import { getSupabaseConfig } from './config';

async function callEdgeFunction(name: string, body: object) {
  const { url, anonKey } = getSupabaseConfig();
  const edgeBase = `${url}/functions/v1`;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const token = session?.access_token ?? anonKey;

  const res = await fetch(`${edgeBase}/${name}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      apikey: anonKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Edge function error: ${err}`);
  }

  return res.json();
}

// ─── Generate words for a topic via Claude AI ──────────────────────────────────
export async function generateWordsForTopic(
  topic: string,
  count = 60
): Promise<Word[]> {
  const data = await callEdgeFunction('generate-words', { topic, count });
  return data.words;
}

// ─── Generate quiz questions ───────────────────────────────────────────────────
export async function generateQuiz(
  wordIds: string[],
  count = 10
): Promise<QuizQuestion[]> {
  const data = await callEdgeFunction('generate-quiz', { wordIds, count });
  return data.questions;
}

// ─── Dictionary (multi-source free APIs) ───────────────────────────────────────
export {
  searchDictionary,
  searchDictionaryMany,
} from './dictionaryApi';
