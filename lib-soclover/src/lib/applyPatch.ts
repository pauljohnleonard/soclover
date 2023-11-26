import { Game, SocloverMessage } from './classes';

export function applyPatch(message: SocloverMessage, game: Game) {
  const player = game.players.find(
    (player) => player.name === message.playerName
  );

  if (!player) {
    return;
  }

  for (const patchCard of message.cards || []) {
    const card = player.hand.cards.find((card) => card.slot === patchCard.slot);

    if (!card) {
      return;
    }

    for (const key of Object.keys(patchCard || {})) {
      (card as any)[key] = (patchCard as any)[key];
    }
  }

  player.hand.hasUI = true;
}
