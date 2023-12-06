import {
  Card,
  Game,
  Leaf,
  SocloverMessage,
  applyPatch,
} from '@soclover/lib-soclover';
import { makeHand } from './makeHand';
import { cloneDeep } from 'lodash';
import { MongoDB } from './db/db';

export class GameController {
  game: Game;
  videoUrl!: string;
  constructor() {
    this.newGame();
  }

  setFocusPlayer(message: SocloverMessage) {
    this.game.focusPlayerName = message.playerName;
  }

  reset() {
    null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  newGame() {
    this.game = { leafs: [] };
  }

  setPatch(message: SocloverMessage) {
    applyPatch(message, this.game);
    console.log('setPatch', message);
  }

  async addLeafToGame(message: SocloverMessage) {
    message.leaf.submitted = true;
    this.game.leafs.push(message.leaf);

    await MongoDB.instance.saveHand(message.leaf);
  }

  playerLeave(name: string) {
    this.game.leafs = this.game.leafs.filter(
      (item) => item.playerName !== name
    );
  }

  newLeaf(playerName: string): Leaf {
    const cards: Card[] = makeHand();
    const newLeaf: Leaf = {
      playerName,
      cards,
      clues: ['', '', '', ''],
      submitted: false,
    };

    return newLeaf;
  }

  leafFromPlayerName(name: string): Leaf {
    for (const leaf of this.game.leafs) {
      if (leaf.playerName === name) {
        return leaf;
      }
    }
    throw Error(` ${name} was not found in players `);
  }
}
