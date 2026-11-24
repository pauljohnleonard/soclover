import { CardLayout, Game, SocloverMessage } from './classes';

/**
 * Apply a PATCH into leaf.layouts[layoutOwner] only.
 * Clients hydrate card UI from the layout they are viewing.
 */
export function applyPatch(message: SocloverMessage, game: Game) {
  const leaf = game.leaves.find(
    (entry) => entry.playerName === message.playerName
  );

  if (!leaf) {
    return;
  }

  const owner = message.layoutOwner || message.sender;
  if (!owner || !message.cards?.length) {
    return;
  }

  if (!leaf.layouts) {
    leaf.layouts = {};
  }

  let layout: CardLayout[] = leaf.layouts[owner]
    ? leaf.layouts[owner].map((e) => ({ ...e }))
    : leaf.cards.map((c) => ({
        slot: c.slot,
        guessSlot: undefined as number | undefined,
        guessOrientation: 0,
        heapSlot: c.heapSlot,
      }));

  for (const patchCard of message.cards) {
    let entry = layout.find((e) => e.slot === patchCard.slot);
    if (!entry) {
      entry = {
        slot: patchCard.slot,
        guessOrientation: 0,
        heapSlot: patchCard.heapSlot,
      };
      layout.push(entry);
    }

    if ('guessSlot' in patchCard) {
      entry.guessSlot = patchCard.guessSlot;
    }
    if (patchCard.guessOrientation !== undefined) {
      entry.guessOrientation = patchCard.guessOrientation || 0;
    }
    if ('dragPos' in patchCard) {
      entry.dragPos = patchCard.dragPos
        ? { ...patchCard.dragPos }
        : undefined;
    }
    if (patchCard.wrong !== undefined) {
      entry.wrong = !!patchCard.wrong;
    }
    if (patchCard.heapSlot !== undefined) {
      entry.heapSlot = patchCard.heapSlot;
    }
  }

  leaf.layouts[owner] = layout;
  leaf.hasUI = true;
}
