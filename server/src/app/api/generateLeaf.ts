import {
  PetalPair,
  assembleCardsFromPairs,
  cluesFromPairs,
} from '@soclover/lib-soclover';
import axios from 'axios';
import { words } from '../words';

const SYSTEM_PROMPT = `You invent clover-leaf word puzzles for a party game.
Return ONLY valid JSON:
{"pairs":[{"wordA":"...","wordB":"...","clue":"..."},{"wordA":"...","wordB":"...","clue":"..."},{"wordA":"...","wordB":"...","clue":"..."},{"wordA":"...","wordB":"...","clue":"..."}]}

Each petal shows one clue. Solvers arrange cards so the two words touching that petal are linked by the clue.

Hard rules:
- Exactly 4 pairs.
- wordA, wordB, and clue are EACH exactly ONE English word: letters A-Z only (no spaces, hyphens, digits, or punctuation).
- Clue must NOT equal wordA or wordB.
- All eight edge words (wordA/wordB across pairs) must be distinct.
- All four clues must be distinct.
- Common, family-friendly words only.

What makes a good clue (in priority order):
1) Compound / set phrase: the clue + one edge word, or the two edge words together, form a familiar compound or fixed phrase.
2) Shared category: both edge words are clear, equal members of the clue (e.g. TREE + FLOWER → PLANT).
3) Shared property both words obviously have (e.g. TREE + CAR → TRUNK).

Reject vague free-association (e.g. LOVE linking unrelated words).

Good examples:
{"wordA":"MOON","wordB":"LIGHT","clue":"NIGHT"}
{"wordA":"TREE","wordB":"CAR","clue":"TRUNK"}
{"wordA":"BUTTER","wordB":"FLY","clue":"INSECT"}
{"wordA":"RAIN","wordB":"BOW","clue":"ARC"}`;

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

  const singleWord = /^[A-Z]+$/;
  const edgeWords = new Set<string>();
  const clues = new Set<string>();

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
    for (const [label, value] of [
      ['wordA', wordA],
      ['wordB', wordB],
      ['clue', clue],
    ] as const) {
      if (!singleWord.test(value)) {
        throw new Error(
          `Pair ${i} ${label} must be a single word (letters only): "${value}"`
        );
      }
    }
    if (clue === wordA || clue === wordB) {
      throw new Error(`Pair ${i} clue must not reuse wordA/wordB`);
    }
    if (edgeWords.has(wordA) || edgeWords.has(wordB)) {
      throw new Error(`Pair ${i} reuses an edge word`);
    }
    if (clues.has(clue)) {
      throw new Error(`Pair ${i} reuses clue "${clue}"`);
    }
    edgeWords.add(wordA);
    edgeWords.add(wordB);
    clues.add(clue);
    return { wordA, wordB, clue };
  });
}

function hasOpenAIApiKey(): boolean {
  const key = process.env.OPENAI_API_KEY;
  return typeof key === 'string' && key.trim().length > 0;
}

async function callOpenAI(): Promise<PetalPair[]> {
  if (!hasOpenAIApiKey()) {
    throw new Error('OPENAI_API_KEY is not set');
  }
  const apiKey = process.env.OPENAI_API_KEY!.trim();

  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  const response = await axios.post(
    'https://api.openai.com/v1/chat/completions',
    {
      model,
      temperature: 0.55,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content:
            'Generate one clover-leaf puzzle: four pairs, each with a single-word clue that tightly links wordA and wordB. Favour compounds, set phrases, or clear shared categories over vague associations.',
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

export function features(req, res) {
  res.json({
    generateLeaf: hasOpenAIApiKey(),
  });
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
    const openaiStatus = error?.response?.status;
    const missingKey = error?.message?.includes('OPENAI_API_KEY');
    const status =
      openaiStatus === 401 || openaiStatus === 403
        ? openaiStatus
        : missingKey
          ? 503
          : typeof openaiStatus === 'number'
            ? openaiStatus
            : 500;
    res.status(status).json({
      error:
        openaiStatus === 401 || openaiStatus === 403
          ? 'OpenAI rejected the API key'
          : error?.message || 'Failed to generate leaf',
    });
  }
}
