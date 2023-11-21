import { Card, Hand } from '@soclover/lib-soclover';

import { words } from './words';

export function makeHand(): Hand {
  const hand: Hand = {
    cards: [],
  };

  for (let i = 0; i < 4; i++) {
    const card = makeCard(i);
    hand.cards.push(card);
  }

  return hand;
}

export function makeCard(slot): Card {
  const card: Card = {
    words: [],
    slot,
  };

  for (let i = 0; i < 4; i++) {
    const word = words.random();
    card.words.push(word);
  }
  return card;
}
