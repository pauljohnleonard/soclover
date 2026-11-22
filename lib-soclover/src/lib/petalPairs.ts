import { Card } from './classes';

/**
 * Board geometry (orientation 0, cards in slots 0..3):
 * Petal p sits between card p and card (p+1)%4.
 * - Card p contributes its clockwise face: words[1]
 * - Card (p+1)%4 contributes its counter-clockwise face: words[3]
 *
 * Word indices on a card (local): 0 top, 1 right/CW, 2 bottom, 3 left/CCW.
 */

export type PetalPair = {
  wordA: string;
  wordB: string;
  clue?: string;
};

/** Facing word pair for each petal from a correctly placed leaf. */
export function petalWordPairs(cards: Card[]): [string, string][] {
  const ring = cards
    .filter((c) => c.slot >= 0 && c.slot < 4)
    .sort((a, b) => a.slot - b.slot);

  if (ring.length < 4) {
    throw new Error('Need 4 ring cards to read petal pairs');
  }

  const pairs: [string, string][] = [];
  for (let p = 0; p < 4; p++) {
    const a = ring[p].words[1];
    const b = ring[(p + 1) % 4].words[3];
    pairs.push([a, b]);
  }
  return pairs;
}

/**
 * Build 4 ring cards (+ optional decoy as 5th) from petal pairs.
 * pairs[p] = { wordA, wordB } for petal p (between card p and p+1).
 * fillerWords supplies words[0] and words[2] on each ring card (length >= 8),
 * and optionally the 4 decoy words for slot 4 (length >= 12).
 */
export function assembleCardsFromPairs(
  pairs: PetalPair[],
  fillerWords: string[]
): Card[] {
  if (pairs.length !== 4) {
    throw new Error('Need exactly 4 petal pairs');
  }

  const fillers = [...fillerWords];
  const nextFiller = () => fillers.shift() || 'WORD';

  const ringWords: string[][] = [
    [nextFiller(), '', nextFiller(), ''],
    [nextFiller(), '', nextFiller(), ''],
    [nextFiller(), '', nextFiller(), ''],
    [nextFiller(), '', nextFiller(), ''],
  ];

  for (let p = 0; p < 4; p++) {
    ringWords[p][1] = pairs[p].wordA;
    ringWords[(p + 1) % 4][3] = pairs[p].wordB;
  }

  const heapSlots = [0, 1, 2, 3, 4];
  // mild shuffle of heap positions
  for (let i = heapSlots.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [heapSlots[i], heapSlots[j]] = [heapSlots[j], heapSlots[i]];
  }

  const cards: Card[] = [];
  for (let slot = 0; slot < 4; slot++) {
    cards.push({
      words: ringWords[slot],
      slot,
      heapSlot: heapSlots[slot],
      guessOrientation: 0,
      guessSlot: slot,
      wrong: false,
    });
  }

  // Decoy fifth card
  cards.push({
    words: [nextFiller(), nextFiller(), nextFiller(), nextFiller()],
    slot: 4,
    heapSlot: heapSlots[4],
    guessOrientation: 0,
    guessSlot: -1,
    wrong: false,
  });

  return cards;
}

export function cluesFromPairs(pairs: PetalPair[]): string[] {
  return pairs.map((p) => (p.clue || '').trim());
}
