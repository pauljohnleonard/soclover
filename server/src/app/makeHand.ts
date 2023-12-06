import { Card } from '@soclover/lib-soclover';

import { words } from './words';

export function makeHand(): Card[] {
  const heapSlots = [0, 1, 2, 3, 4];
  const cards: Card[] = [];
  shuffleArray(heapSlots);

  for (let i = 0; i < 5; i++) {
    const card = makeCard(i);
    card.heapSlot = heapSlots[i];
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
  const card: Card = {
    words: [],
    slot,
    guessOrientation: 0,
    guessSlot: 0,
  } as Card;

  for (let i = 0; i < 4; i++) {
    const word = words.random();
    card.words.push(word);
  }
  return card;
}
