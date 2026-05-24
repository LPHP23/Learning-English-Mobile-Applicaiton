// supabase/functions/generate-quiz/index.ts
// Deploy: supabase functions deploy generate-quiz

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { wordIds, count = 10 } = await req.json();
    const authHeader = req.headers.get('Authorization')!;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Fetch words from DB
    const { data: words, error } = await supabase
      .from('words')
      .select('id, word, ipa, vietnamese_meaning, cefr_level')
      .in('id', wordIds)
      .limit(count * 3); // Get extra for distractors

    if (error) throw error;
    if (!words?.length) throw new Error('No words found');

    const aiEndpoint = Deno.env.get('AI_ENDPOINT');
    const aiApiKey = Deno.env.get('AI_API_KEY');
    if (!aiEndpoint || !aiApiKey) {
      throw new Error('AI provider not configured. Set AI_ENDPOINT and AI_API_KEY in Supabase secrets.');
    }
    const endpointUrl = aiEndpoint.includes('?')
      ? `${aiEndpoint}&key=${aiApiKey}`
      : `${aiEndpoint}?key=${aiApiKey}`;

    // Build quiz with AI-generated distractors
    const quizWords = words.slice(0, count);
    const allMeanings = words.map(w => w.vietnamese_meaning);

    const prompt = `Given these English words and their Vietnamese meanings, create ${count} multiple choice quiz questions.

Words to quiz:
${quizWords.map(w => `- ${w.word}: ${w.vietnamese_meaning}`).join('\n')}

All available Vietnamese options (use as distractors):
${allMeanings.join(', ')}

For each question, provide:
- The English word being tested
- 3 wrong but plausible Vietnamese options (from the available options above OR create new plausible ones)
- The correct Vietnamese meaning
- Shuffle the 4 options randomly

Return ONLY valid JSON array:
[
  {
    "word": "stethoscope",
    "ipa": "/ˈsteθ.ə.skəʊp/",
    "correct": "ống nghe (y tế)",
    "options": ["băng cứu thương", "máy đo huyết áp", "ống nghe (y tế)", "kim tiêm"]
  }
]`;

    const response = await fetch(endpointUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 2048,
          temperature: 0.7,
        },
      }),
    });

    const data = await response.json();
    if (data?.error?.message) {
      throw new Error(`Gemini API error: ${data.error.message}`);
    }
    const parts = data?.candidates?.[0]?.content?.parts;
    const text = Array.isArray(parts)
      ? parts.map((part: { text?: string }) => part.text ?? '').join('').trim()
      : '';
    if (!text) {
      throw new Error('Gemini response missing text. Check response parser.');
    }
    const clean = text.replace(/```json\n?|\n?```/g, '').trim();
    const questions = JSON.parse(clean);

    return new Response(JSON.stringify({ questions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
