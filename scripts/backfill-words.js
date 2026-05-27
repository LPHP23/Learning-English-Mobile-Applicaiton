#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

function loadEnvFile() {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, 'utf8');

  content.split('\n').forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const idx = trimmed.indexOf('=');
    if (idx === -1) return;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (!key) return;
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith('\'') && value.endsWith('\''))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  });
}

loadEnvFile();

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const FORCE = process.argv.includes('--force');
const TOPUP = process.argv.includes('--topup');
const HELP = process.argv.includes('--help') || process.argv.includes('-h');
const TARGET_COUNT = Number(process.env.BACKFILL_COUNT || 60);

if (HELP) {
  console.log('Usage: node scripts/backfill-words.js [--topup] [--force]');
  console.log('Env: SUPABASE_URL or EXPO_PUBLIC_SUPABASE_URL');
  console.log('     SUPABASE_SERVICE_ROLE_KEY (required)');
  console.log('Optional: BACKFILL_COUNT=60');
  process.exit(0);
}

if (!global.fetch) {
  console.error('Missing global fetch. Please use Node.js 18+');
  process.exit(1);
}

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  const missing = [];
  if (!SUPABASE_URL) missing.push('SUPABASE_URL (or EXPO_PUBLIC_SUPABASE_URL)');
  if (!SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  console.error(`Missing ${missing.join(' and ')}. Check your .env file.`);
  process.exit(1);
}

const EDGE_URL = `${SUPABASE_URL}/functions/v1/generate-words`;

function normalizeExample(raw) {
  if (typeof raw.example_sentence === 'string') return raw.example_sentence;
  if (Array.isArray(raw.example_sentences)) return raw.example_sentences[0] ?? '';
  return '';
}

async function callGenerate(topic, count) {
  const res = await fetch(EDGE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      apikey: ANON_KEY || SERVICE_ROLE_KEY,
    },
    body: JSON.stringify({ topic, count }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Edge function error: ${err}`);
  }

  const data = await res.json();
  return Array.isArray(data.words) ? data.words : [];
}

async function backfill() {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: topics, error } = await supabase
    .from('topics')
    .select('id, name')
    .order('created_at', { ascending: true });

  if (error) throw error;
  if (!topics || topics.length === 0) {
    console.log('No topics found.');
    return;
  }

  for (const topic of topics) {
    if (!topic.name) {
      console.log(`- ${topic.id}: skip (missing name)`);
      continue;
    }

    const { count: existingCount, error: countErr } = await supabase
      .from('words')
      .select('id', { count: 'exact', head: true })
      .eq('topic_id', topic.id);

    if (countErr) {
      console.error(`- ${topic.name}: failed to count words`, countErr.message);
      continue;
    }

    const total = existingCount ?? 0;
    let target = TARGET_COUNT;

    if (TOPUP) {
      const remaining = TARGET_COUNT - total;
      if (remaining <= 0 && !FORCE) {
        console.log(`- ${topic.name}: skip (already ${total} words)`);
        continue;
      }
      target = remaining > 0 ? remaining : TARGET_COUNT;
    } else if (!FORCE && total > 0) {
      console.log(`- ${topic.name}: skip (${total} words)`);
      continue;
    }

    let existingSet = new Set();
    let maxOrder = 0;
    if (total > 0) {
      const { data: existingRows, error: existingErr } = await supabase
        .from('words')
        .select('word, cefr_order')
        .eq('topic_id', topic.id);

      if (existingErr) {
        console.error(`- ${topic.name}: failed to load existing words`, existingErr.message);
        continue;
      }

      existingSet = new Set(
        (existingRows || [])
          .map((row) => String(row.word || '').trim().toLowerCase())
          .filter(Boolean)
      );
      maxOrder = (existingRows || []).reduce(
        (max, row) => Math.max(max, Number(row.cefr_order) || 0),
        0
      );
    }

    console.log(`- ${topic.name}: generating ${target} words...`);
    try {
      const aiWords = await callGenerate(topic.name, target);
      const seen = new Set();
      const deduped = [];

      for (const raw of aiWords) {
        const word = typeof raw.word === 'string' ? raw.word.trim() : '';
        const key = word.toLowerCase();
        if (!word || existingSet.has(key) || seen.has(key)) continue;
        seen.add(key);

        deduped.push({
          word,
          ipa: raw.ipa ?? '',
          part_of_speech: raw.part_of_speech ?? 'n',
          cefr_level: raw.cefr_level ?? 'B1',
          vietnamese_meaning: raw.vietnamese_meaning ?? '',
          example_sentence: normalizeExample(raw),
        });
      }

      if (deduped.length === 0) {
        console.log(`  -> no new words to insert`);
        continue;
      }

      const payload = deduped.map((w, index) => ({
        ...w,
        topic_id: topic.id,
        cefr_order: maxOrder + index + 1,
      }));

      const { error: insertErr } = await supabase.from('words').insert(payload);
      if (insertErr) throw insertErr;

      await supabase
        .from('topics')
        .update({ total_words: total + payload.length })
        .eq('id', topic.id);

      console.log(`  -> inserted ${payload.length} words`);
    } catch (err) {
      console.error(`  -> failed: ${err.message || err}`);
    }
  }
}

backfill().catch((err) => {
  console.error(err);
  process.exit(1);
});
