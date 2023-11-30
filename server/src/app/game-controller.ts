import {
  Game,
  Hand,
  Player,
  SocloverMessage,
  applyPatch,
} from '@soclover/lib-soclover';
import { makeHand } from './makeHand';
import { cloneDeep } from 'lodash';
import { CloverStore } from './cloverStore';
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
  newGame(sender?: string) {
    let newGame: Game;

    if (this.game) {
      newGame = cloneDeep(this.game);
      newGame.players.forEach((player) => {
        if (!sender || player.name === sender) {
          player.hand = makeHand();
          player.clues = ['', '', '', '', ''];
        }
      });
    } else {
      newGame = {
        players: [],
      };
    }

    this.game = newGame;
  }

  setPatch(message: SocloverMessage) {
    applyPatch(message, this.game);
    console.log('setPatch', message);
  }

  setClues(message: SocloverMessage) {
    const player = this.playerFromName(message.sender);
    player.clues = message.clues;
    CloverStore.saveHand(player);
  }

  playerLeave(name: string) {
    this.game.players = this.game.players.filter((item) => item.name !== name);
  }

  newPlayer(name: string): Player {
    const hand: Hand = makeHand();
    const newPlayer: Player = { name, hand };

    this.game.players.push(newPlayer);
    return newPlayer;
  }

  playerFromName(name: string): Player {
    for (const player of this.game.players) {
      if (player.name === name) {
        return player;
      }
    }
    throw Error(` ${name} was not found in players `);
  }
}
