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
    orientation: 0,
    slot: 0,
    dropZone: true,
  },
  {
    words: [],
    orientation: 0,
    slot: 1,
    dropZone: true,
  },
  {
    words: [],
    orientation: 0,
    slot: 2,
    dropZone: true,
  },
  {
    words: [],
    orientation: 0,
    slot: 3,
    dropZone: true,
  },
];
