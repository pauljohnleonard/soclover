import { UICard } from '@soclover/lib-soclover';

export type CardUpdate = {
  orientation: number;
  slot: number;
  dragPos?: { x: number; y: number };
};

export type HandUpdate = {
  cards: CardUpdate[];
};

export const dropZones: UICard[] = [
  {
    card: { words: [], slot: 0 },
    orientation: 0,
    dropZone: true,
    guessSlot: 0,
  },
  {
    card: { words: [], slot: 1 },
    orientation: 0,
    dropZone: true,
    guessSlot: 1,
  },
  {
    card: { words: [], slot: 2 },
    orientation: 0,
    dropZone: true,
    guessSlot: 2,
  },
  {
    card: { words: [], slot: 3 },
    orientation: 0,
    dropZone: true,
    guessSlot: 3,
  },
];
