/* eslint-disable @typescript-eslint/no-var-requires */
import 'dotenv/config';
import { mkdirp } from 'mkdirp';

import { Player } from '@soclover/lib-soclover';
const fs = require('fs');

export const CloverStore = {
  saveHand: (player: Player) => {
    const root = process.env.STORE_ROOT;

    mkdirp(root);

    const prefix = new Date().toISOString().substring(0, 19);
    const filename = `${prefix}-${player.name}-hand.json`;

    const hand = { cards: [] };

    for (const card of player.hand.cards) {
      const cardClone = {
        words: card.words,
        slot: card.slot,
        heapSlot: card.heapSlot,
      };
      hand.cards.push(cardClone);
    }

    const payload = JSON.stringify({ hand, clues: player.clues }, null, 2);

    console.log('saveHand', payload);
    fs.writeFileSync(`${root}/${filename}`, payload);
  },
};
