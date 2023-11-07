export type Card = {
  words: string[];
  orientation: number;
  slot: number;
};

export type Hand = {
  cards: Card[];
};
