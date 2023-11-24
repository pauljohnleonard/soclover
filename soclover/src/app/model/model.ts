import { Card } from '@soclover/lib-soclover';

export type CardUpdate = {
  orientation: number;
  slot: number;
  dragPos?: { x: number; y: number };
};

export type HandUpdate = {
  cards: CardUpdate[];
};

export const dropZones: Card[] = [
  {
    words: [],
    slot: 0,
    displaySlot: 0,
    orientation: 0,
    dropZone: true,
    guessSlot: 0,
  },
  {
    words: [],
    slot: 1,
    displaySlot: 1,
    orientation: 0,
    dropZone: true,
    guessSlot: 1,
  },
  {
    words: [],
    slot: 2,
    orientation: 0,
    displaySlot: 2,
    dropZone: true,
    guessSlot: 2,
  },
  {
    words: [],
    slot: 3,
    displaySlot: 3,
    orientation: 0,
    dropZone: true,
    guessSlot: 3,
  },
];
