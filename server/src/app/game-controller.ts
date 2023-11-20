import { Game, Player } from '@soclover/lib-soclover';

export class GameController {
  // codes: Codes[] = [];
  game: Game;
  videoUrl!: string;

  constructor() {
    this.newGame();
  }

  reset() {
    null;
  }

  newGame() {
    const game: Game = {
      players: [],
    };

    this.game = game;
  }

  playerReady() {
    // this.chooseFirstMasterIfNone();
  }

  playerLeave(name: string) {
    this.game.players = this.game.players.filter((item) => item.name !== name);
  }

  newPlayer(name: string): Player {
    const newPlayer = new Player(name);
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
