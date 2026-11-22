import {
  PetalPair,
  assembleCardsFromPairs,
  cluesFromPairs,
} from '@soclover/lib-soclover';
import axios from 'axios';
import { words } from '../words';

const SYSTEM_PROMPT = `You invent clover-leaf word puzzles.
Return ONLY valid JSON with this shape:
{"pairs":[{"wordA":"...","wordB":"...","clue":"..."},{"wordA":"...","wordB":"...","clue":"..."},{"wordA":"...","wordB":"...","clue":"..."},{"wordA":"...","wordB":"...","clue":"..."}]}

Rules:
- Exactly 4 pairs.
- wordA, wordB, and clue are short English tokens (prefer a single word; clue may be 1-3 words).
- The clue must connect wordA and wordB (association, compound, category, or shared phrase).
- Do not reuse wordA or wordB as the clue.
- Family-friendly; no proper nouns that need obscure knowledge.
- Prefer common words that fit on a small card (uppercase is fine).
- All eight edge words across the four pairs should be distinct.`;

function fillerWords(count: number, avoid: Set<string>): string[] {
  const out: string[] = [];
  const used = new Set<string>([...avoid].map((w) => w.toUpperCase()));
  let guard = 0;
  while (out.length < count && guard < count * 40) {
    guard++;
    const w = words.random();
    const key = w.toUpperCase();
    if (used.has(key)) {
      continue;
    }
    used.add(key);
    out.push(w);
  }
  while (out.length < count) {
    out.push(`X${out.length}`);
  }
  return out;
}

function normalizePairs(raw: unknown): PetalPair[] {
  const obj = raw as { pairs?: PetalPair[] };
  if (!obj?.pairs || !Array.isArray(obj.pairs) || obj.pairs.length !== 4) {
    throw new Error('Model did not return exactly 4 pairs');
  }

  return obj.pairs.map((p, i) => {
    const wordA = String(p.wordA || '')
      .trim()
      .toUpperCase();
    const wordB = String(p.wordB || '')
      .trim()
      .toUpperCase();
    const clue = String(p.clue || '')
      .trim()
      .toUpperCase();
    if (!wordA || !wordB || !clue) {
      throw new Error(`Pair ${i} missing wordA, wordB, or clue`);
    }
    return { wordA, wordB, clue };
  });
}

async function callOpenAI(): Promise<PetalPair[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model,
      temperature: 0.9,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content:
            'Generate one fresh clover-leaf puzzle with four creative pairs and clues.',
        },
      ],
    },
    {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 60000,
    }
  );

  const content = response.data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Empty response from OpenAI');
  }

  return normalizePairs(JSON.parse(content));
}

export async function generateLeaf(req, res) {
  try {
    const pairs = await callOpenAI();
    const avoid = new Set<string>();
    for (const p of pairs) {
      avoid.add(p.wordA);
      avoid.add(p.wordB);
      avoid.add(p.clue || '');
    }
    const cards = assembleCardsFromPairs(pairs, fillerWords(16, avoid));
    const clues = cluesFromPairs(pairs);

    res.json({
      cards,
      clues,
      submitted: false,
      solvers: [],
    });
  } catch (error: any) {
    console.error('generateLeaf', error?.response?.data || error);
    const status = error?.message?.includes('OPENAI_API_KEY') ? 503 : 500;
    res.status(status).json({
      error: error?.message || 'Failed to generate leaf',
    });
  }
}
