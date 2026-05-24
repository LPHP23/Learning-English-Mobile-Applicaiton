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

    const aiEndpoint = Deno.env.get('AI_ENDPOINT');
    const aiApiKey = Deno.env.get('AI_API_KEY');
    if (!aiEndpoint || !aiApiKey) {
      throw new Error('AI provider not configured. Set AI_ENDPOINT and AI_API_KEY in Supabase secrets.');
    }
    const endpointUrl = aiEndpoint.includes('?')
      ? `${aiEndpoint}&key=${aiApiKey}`
      : `${aiEndpoint}?key=${aiApiKey}`;

    const prompt = `You are an English vocabulary expert. Generate exactly ${count} English vocabulary words for the topic "${topic}".

For each word, provide:
1. The word itself
2. IPA phonetic transcription
3. Part of speech (n/v/adj/adv)
4. CEFR level (A1/A2/B1/B2/C1/C2)
5. Vietnamese meaning (concise, all senses if applicable) in one string, separated by semicolons if multiple meanings.
6. Two or three natural example sentence using the word (bold the word in the sentence)
7. CEFR order number (1-${count}, sorted easy to hard within each level)
8. Write grammar notes if the word has any special usage or common collocations (optional, can be empty string)

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
    "example_sentences": [
      "The doctor examined the patient carefully."
    ],
    "grammar_notes": ""
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
          maxOutputTokens: 4096,
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`AI API error: ${err}`);
    }

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
