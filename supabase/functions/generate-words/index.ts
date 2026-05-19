// supabase/functions/generate-words/index.ts
// Deploy: supabase functions deploy generate-words

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
    const { topic, count = 60 } = await req.json();

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_API_KEY) throw new Error('Missing ANTHROPIC_API_KEY');

    const prompt = `You are an English vocabulary expert. Generate exactly ${count} English vocabulary words for the topic "${topic}".

For each word, provide:
1. The word itself
2. IPA phonetic transcription
3. Part of speech (n/v/adj/adv)
4. CEFR level (A1/A2/B1/B2/C1/C2)
5. Vietnamese meaning (concise, all senses if applicable)
6. One natural example sentence using the word (bold the word in the sentence)
7. CEFR order number (1-${count}, sorted easy to hard within each level)

Distribute across CEFR levels approximately:
- A1-A2: 20% (very basic words)
- B1: 25% (elementary)
- B2: 30% (intermediate) 
- C1-C2: 25% (advanced)

Return ONLY a valid JSON array, no markdown, no explanation:
[
  {
    "word": "doctor",
    "ipa": "/ˈdɒk.tər/",
    "part_of_speech": "n",
    "cefr_level": "A1",
    "cefr_order": 1,
    "vietnamese_meaning": "bác sĩ",
    "example_sentence": "The doctor examined the patient carefully."
  }
]`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Claude API error: ${err}`);
    }

    const data = await response.json();
    const text = data.content[0].text;

    // Parse JSON (strip any accidental markdown)
    const clean = text.replace(/```json\n?|\n?```/g, '').trim();
    const words = JSON.parse(clean);

    return new Response(JSON.stringify({ words }), {
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
