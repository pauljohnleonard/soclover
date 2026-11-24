import { Card, CardLayout, Leaf } from './classes';

/** Snapshot placement UI from cards into a layout array. */
export function cardsToLayout(cards: Card[]): CardLayout[] {
  return (cards || []).map((card) => ({
    slot: card.slot,
    guessSlot: card.guessSlot,
    guessOrientation: card.guessOrientation || 0,
    dragPos: card.dragPos ? { ...card.dragPos } : undefined,
    wrong: !!card.wrong,
    heapSlot: card.heapSlot,
  }));
}

/** Apply a saved layout onto leaf.cards (mutates cards). */
export function applyLayoutToCards(leaf: Leaf, layout: CardLayout[]): void {
  if (!leaf?.cards?.length || !layout?.length) {
    return;
  }

  for (const entry of layout) {
    const card = leaf.cards.find((c) => c.slot === entry.slot);
    if (!card) {
      continue;
    }
    card.guessSlot = entry.guessSlot;
    card.guessOrientation = entry.guessOrientation || 0;
    card.dragPos = entry.dragPos ? { ...entry.dragPos } : undefined;
    card.wrong = !!entry.wrong;
    if (entry.heapSlot !== undefined) {
      card.heapSlot = entry.heapSlot;
    }
  }
}

/** Persist current card UI into leaf.layouts[owner]. */
export function saveLayoutForOwner(leaf: Leaf, owner: string): void {
  if (!leaf || !owner) {
    return;
  }
  if (!leaf.layouts) {
    leaf.layouts = {};
  }
  leaf.layouts[owner] = cardsToLayout(leaf.cards);
}
