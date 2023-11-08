export type Card = {
  words: string[];
  orientation: number;
  slot: number;

  // UI properties
  dropZone?: boolean;
  heapPos?: number[];
  dragPos?: number[];
  heapSlot?: number;
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
export type Hand = {
  cards: Card[];
};
