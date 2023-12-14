import { Game, SocloverMessage } from './classes';

export function applyPatch(message: SocloverMessage, game: Game) {
  const player = game.leaves.find(
    (player) => player.playerName === message.playerName
  );

  if (!player) {
    return;
  }

  for (const patchCard of message.cards || []) {
    const card = player.cards.find((card) => card.slot === patchCard.slot);

    if (!card) {
      return;
    }

    for (const key of Object.keys(patchCard || {})) {
      (card as any)[key] = (patchCard as any)[key];
    }
  }

  player.hasUI = true;
}
