/**
 * VocaBoost Dictionary API — kết hợp nhiều nguồn MIỄN PHÍ:
 *
 * 1. Free Dictionary API (dictionaryapi.dev)
 *    - EN: IPA, định nghĩa tiếng Anh, ví dụ, audio MP3
 *    - Không cần API key, không giới hạn nghiêm ngặt
 *
 * 2. MyMemory Translation (mymemory.translated.net)
 *    - EN ↔ VI dịch từ/cụm từ
 *    - ~1.000 từ/ngày/IP (miễn phí, không cần key)
 *    - Tùy chọn: EXPO_PUBLIC_MYMEMORY_EMAIL để tăng quota
 *
 * 3. Supabase `vietphrase` (dữ liệu tĩnh, chất lượng cao)
 *    - Nhiều nghĩa tiếng Việt, CEFR, chủ đề
 *    - Import từ supabase/seed-vietphrase.sql hoặc VietPhrase GitHub
 */
import { supabase } from './supabase';
import { getDictionaryCache, setDictionaryCache } from './storage';
import type { CEFRLevel, DictionaryEntry } from '../types';

const FREE_DICT_URL = 'https://api.dictionaryapi.dev/api/v2/entries/en';
const MYMEMORY_URL = 'https://api.mymemory.translated.net/get';

type DictDirection = 'en-vi' | 'vi-en';

interface FreeDictPhonetic {
  text?: string;
  audio?: string;
}

interface FreeDictDefinition {
  definition: string;
  example?: string;
}

interface FreeDictMeaning {
  partOfSpeech?: string;
  definitions?: FreeDictDefinition[];
}

interface FreeDictEntry {
  word: string;
  phonetic?: string;
  phonetics?: FreeDictPhonetic[];
  meanings?: FreeDictMeaning[];
}

interface VietPhraseRow {
  word: string;
  ipa: string | null;
  part_of_speech: string | null;
  vietnamese_meaning: string | null;
  example_sentence: string | null;
  cefr_level: string | null;
  topics: string[] | null;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function searchDictionary(
  query: string,
  direction: DictDirection = 'en-vi'
): Promise<DictionaryEntry | null> {
  const normalized = query.trim();
  if (!normalized) return null;

  const cacheKey = `${direction}:${normalized.toLowerCase()}`;
  const cached = getDictionaryCache(cacheKey);
  if (cached) return cached;

  const result =
    direction === 'en-vi'
      ? await lookupEnglish(normalized)
      : await lookupVietnamese(normalized);

  if (result) {
    setDictionaryCache(cacheKey, result);
  }

  return result;
}

/** Tra nhiều kết quả (VI → EN có thể trả về nhiều từ tiếng Anh) */
export async function searchDictionaryMany(
  query: string,
  direction: DictDirection = 'vi-en',
  limit = 5
): Promise<DictionaryEntry[]> {
  const normalized = query.trim();
  if (!normalized) return [];

  if (direction === 'en-vi') {
    const one = await searchDictionary(normalized, 'en-vi');
    return one ? [one] : [];
  }

  const rows = await fetchVietPhraseByVietnamese(normalized, limit);
  if (rows.length > 0) {
    return Promise.all(
      rows.map(async (row) => {
        const enDetails = await fetchFreeDictionary(row.word);
        return mergeEntry(row, enDetails);
      })
    );
  }

  const translated = await translateText(normalized, 'vi', 'en');
  if (!translated) return [];

  const enWord = translated.split(/[,;]/)[0].trim().replace(/\.$/, '');
  const entry = await lookupEnglish(enWord);
  return entry ? [entry] : [];
}

// ─── EN → VI ──────────────────────────────────────────────────────────────────

async function lookupEnglish(word: string): Promise<DictionaryEntry | null> {
  const key = word.toLowerCase();

  const [vietPhraseRows, freeDict] = await Promise.all([
    fetchVietPhraseByWord(key, 10),
    fetchFreeDictionary(key),
  ]);

  if (!freeDict && vietPhraseRows.length === 0) {
    // Từ không có trên Free Dictionary — thử dịch sang Việt
    const viText = await translateText(key, 'en', 'vi');
    if (!viText) return null;

    return {
      word: key,
      ipa: '',
      part_of_speech: 'n',
      vietnamese_meaning: viText,
      vietnamese_meanings: [viText],
      english_definition: '',
      example_sentence: '',
      topics: [],
      cefr_level: 'B1',
    };
  }

  const primaryRow = vietPhraseRows[0];
  const viMeanings = collectVietnameseMeanings(vietPhraseRows);

  if (primaryRow) {
    return mergeEntry(primaryRow, freeDict, viMeanings);
  }

  if (!freeDict) return null;

  const ipa = pickIpa(freeDict);
  const firstMeaning = freeDict.meanings?.[0];
  const enDef = firstMeaning?.definitions?.[0]?.definition ?? '';
  const example = firstMeaning?.definitions?.[0]?.example ?? '';
  const pos = firstMeaning?.partOfSpeech ?? 'n';

  let viMeaning = viMeanings[0];
  if (!viMeaning) {
    viMeaning = (await translateText(key, 'en', 'vi')) ?? enDef;
    viMeanings.push(viMeaning);
  }

  return {
    word: freeDict.word ?? key,
    ipa,
    part_of_speech: pos,
    vietnamese_meaning: viMeanings.join(' • '),
    vietnamese_meanings: viMeanings,
    english_definition: enDef,
    example_sentence: example,
    topics: [],
    cefr_level: 'B1',
    audio_url: pickAudioUrl(freeDict),
  };
}

// ─── VI → EN ──────────────────────────────────────────────────────────────────

async function lookupVietnamese(query: string): Promise<DictionaryEntry | null> {
  const rows = await fetchVietPhraseByVietnamese(query, 1);
  if (rows.length > 0) {
    const enDetails = await fetchFreeDictionary(rows[0].word);
    return mergeEntry(rows[0], enDetails);
  }

  const enText = await translateText(query, 'vi', 'en');
  if (!enText) return null;

  const enWord = enText.split(/[,;]/)[0].trim().replace(/\.$/, '');
  return lookupEnglish(enWord);
}

// ─── Data sources ─────────────────────────────────────────────────────────────

async function fetchFreeDictionary(word: string): Promise<FreeDictEntry | null> {
  try {
    const res = await fetch(
      `${FREE_DICT_URL}/${encodeURIComponent(word.toLowerCase())}`
    );
    if (!res.ok) return null;
    const data = (await res.json()) as FreeDictEntry[];
    return data[0] ?? null;
  } catch {
    return null;
  }
}

async function fetchVietPhraseByWord(
  word: string,
  limit = 10
): Promise<VietPhraseRow[]> {
  try {
    const { data, error } = await supabase
      .from('vietphrase')
      .select('word, ipa, part_of_speech, vietnamese_meaning, example_sentence, cefr_level, topics')
      .ilike('word', word)
      .limit(limit);

    if (error || !data?.length) return [];
    return data as VietPhraseRow[];
  } catch {
    return [];
  }
}

async function fetchVietPhraseByVietnamese(
  meaning: string,
  limit = 5
): Promise<VietPhraseRow[]> {
  try {
    const { data, error } = await supabase
      .from('vietphrase')
      .select('word, ipa, part_of_speech, vietnamese_meaning, example_sentence, cefr_level, topics')
      .ilike('vietnamese_meaning', `%${meaning}%`)
      .limit(limit);

    if (error || !data?.length) return [];
    return data as VietPhraseRow[];
  } catch {
    return [];
  }
}

async function translateText(
  text: string,
  source: 'en' | 'vi',
  target: 'en' | 'vi'
): Promise<string | null> {
  try {
    const email = process.env.EXPO_PUBLIC_MYMEMORY_EMAIL;
    const params = new URLSearchParams({
      q: text,
      langpair: `${source}|${target}`,
    });
    if (email) params.set('de', email);

    const res = await fetch(`${MYMEMORY_URL}?${params.toString()}`);
    if (!res.ok) return null;

    const json = await res.json();
    if (json.responseStatus !== 200) return null;

    const translated = json.responseData?.translatedText as string | undefined;
    return translated?.trim() || null;
  } catch {
    return null;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function collectVietnameseMeanings(rows: VietPhraseRow[]): string[] {
  const fromDb = rows
    .map((r) => r.vietnamese_meaning?.trim())
    .filter((m): m is string => Boolean(m));

  const unique = [...new Set(fromDb)];
  if (unique.length > 0) return unique;

  return [];
}

function mergeEntry(
  row: VietPhraseRow,
  freeDict: FreeDictEntry | null,
  extraMeanings?: string[]
): DictionaryEntry {
  const meanings = extraMeanings?.length
    ? extraMeanings
    : row.vietnamese_meaning
      ? [row.vietnamese_meaning]
      : [];

  const firstMeaning = freeDict?.meanings?.[0];
  const enDef = firstMeaning?.definitions?.[0]?.definition ?? '';
  const example =
    row.example_sentence ||
    firstMeaning?.definitions?.[0]?.example ||
    '';

  return {
    word: row.word,
    ipa: row.ipa || (freeDict ? pickIpa(freeDict) : ''),
    part_of_speech: row.part_of_speech || firstMeaning?.partOfSpeech || 'n',
    vietnamese_meaning: meanings.join(' • ') || row.vietnamese_meaning || '',
    vietnamese_meanings: meanings,
    english_definition: enDef,
    example_sentence: example,
    topics: row.topics ?? [],
    cefr_level: (row.cefr_level as CEFRLevel) || 'B1',
    audio_url: freeDict ? pickAudioUrl(freeDict) : undefined,
  };
}

function pickIpa(entry: FreeDictEntry): string {
  if (entry.phonetic) return entry.phonetic;
  const withText = entry.phonetics?.find((p) => p.text);
  return withText?.text ?? '';
}

function pickAudioUrl(entry: FreeDictEntry): string | undefined {
  const withAudio = entry.phonetics?.find((p) => p.audio);
  return withAudio?.audio || undefined;
}
