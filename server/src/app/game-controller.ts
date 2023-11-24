import { Game, Hand, Player, SocloverMessage } from '@soclover/lib-soclover';
import { makeHand } from './makeHand';
import { cloneDeep } from 'lodash';
export class GameController {
  // codes: Codes[] = [];
  game: Game;
  videoUrl!: string;
  history: Game[] = [];

  constructor() {
    this.newGame();
  }

  reset() {
    null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  newGame(sender?: string) {
    let newGame: Game;

    if (this.game) {
      this.history.push(this.game);
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
    console.log('setPatch', message);
  }

  setClues(message: SocloverMessage) {
    const player = this.playerFromName(message.sender);
    player.clues = message.clues;
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

  // createCode() {
  //   this.code = this.codes[this.codeMaster.team].next();

  //   // while (this.code.length < 3) {
  //   //   const digit: number = Math.floor(Math.random() * 4) + 1;
  //   //   if (!this.code.find(x => x === digit)) {
  //   //     this.code.push(digit);
  //   //   }
  //   // }
  //   this.clues = [];
  //   this.status = GameStatus.WAIT_FOR_CODE_MASTER;
  //   this.addEvent({
  //     event: EventEnum.WAITING_FOR_CODE_MASTER,
  //     team: this.codeMaster.team,
  //   });
  // }

  // addEvent({ event, team }: { event: EventEnum; team: TeamEnum }) {
  //   const e: DecryptoEvent = { event, team, stamp: Date.now() };

  //   this.events.push(e);
  // }

  playerFromName(name: string): Player {
    for (const player of this.game.players) {
      if (player.name === name) {
        return player;
      }
    }
    throw Error(` ${name} was not found in players `);
  }
}
