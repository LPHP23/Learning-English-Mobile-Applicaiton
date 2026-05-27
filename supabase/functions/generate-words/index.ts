import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

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

    const normalizeSecret = (value: string | undefined, key: string) => {
      if (!value) return '';
      let trimmed = value.trim();
      if (
        (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
      ) {
        trimmed = trimmed.slice(1, -1);
      }
      const prefix = `${key}=`;
      if (trimmed.startsWith(prefix)) {
        return trimmed.slice(prefix.length).trim();
      }
      if (trimmed.includes(prefix)) {
        return trimmed.split(prefix).pop()?.trim() ?? '';
      }
      return trimmed;
    };

    const aiEndpoint = normalizeSecret(Deno.env.get('AI_ENDPOINT'), 'AI_ENDPOINT');
    const aiApiKey = normalizeSecret(Deno.env.get('AI_API_KEY'), 'AI_API_KEY');
    if (!aiEndpoint) {
      throw new Error('AI provider not configured. Set AI_ENDPOINT in Supabase secrets.');
    }
    if (!/^https?:\/\//i.test(aiEndpoint)) {
      throw new Error('AI_ENDPOINT must be a valid URL (do not include "AI_ENDPOINT=").');
    }

    let endpointUrl = aiEndpoint;
    try {
      const url = new URL(aiEndpoint);
      const hasKey = url.searchParams.has('key');
      if (aiApiKey) {
        url.searchParams.set('key', aiApiKey);
      } else if (!hasKey) {
        throw new Error('AI_API_KEY is missing. Set AI_API_KEY in Supabase secrets.');
      }

      if (!url.pathname.includes(':generateContent')) {
        url.pathname = url.pathname.replace(/\/$/, '') + ':generateContent';
      }

      endpointUrl = url.toString();
    } catch (err) {
      throw new Error('AI_ENDPOINT must be a valid URL.');
    }

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
      throw new Error(`AI API error (${response.status}): ${err}`);
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
