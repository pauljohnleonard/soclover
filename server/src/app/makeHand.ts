import { Card } from '@soclover/lib-soclover';

import { words } from './words';

export function makeHand(): Card[] {
  const heapSlots = [0, 1, 2, 3, 4];
  const cards: Card[] = [];
  shuffleArray(heapSlots);

  // Fresh without-replacement draw so a hand never repeats a physical card
  words.makeAvailable();

  for (let i = 0; i < 5; i++) {
    const card = makeCard(i);
    card.heapSlot = heapSlots[i];
    card.guessSlot = -(i + 1);
    cards.push(card);
  }

  return cards;
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

export function makeCard(slot): Card {
  return {
    words: words.randomCard(),
    slot,
    heapSlot: slot,
    guessOrientation: 0,
    guessSlot: -(slot + 1),
    wrong: false,
  } as Card;
}
