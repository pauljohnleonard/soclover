import { MessageType, SocloverMessage } from '@soclover/lib-soclover';
import { Room } from './room';
import { RoomConnection } from './room-connection';
import { GameController } from './game-controller';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const seedrandom = require('seedrandom');

const videoUrl = `https://us02web.zoom.us/j/708254000`;

export class DecryptoRoom extends Room {
  gameController: GameController;
  name: string;

  constructor(name) {
    super();
    this.name = name;
    this.gameController = new GameController();
    // this.game.videoUrl = `https://meet.jit.si/decryptoclub-room1`;
    this.gameController.videoUrl = videoUrl;
  }

  playerInRoom(name: string) {
    const existing = this.gameController.game.players.find(
      (player) => player.name === name
    );
  }

  processMessage(message: SocloverMessage, fromConnection: RoomConnection) {
    console.log(JSON.stringify(message));
    try {
      const sendingPlayer = this.gameController.game.players.find(
        (user) => user.name === message.sender
      );

      switch (message.type) {
        case MessageType.SEND_READY:
          sendingPlayer.ready = true;
          this.gameController.playerReady();
          break;

        case MessageType.SEND_LOGOUT:
          this.gameController.playerLeave(message.sender);
          break;

        case MessageType.SEND_LOGON:
          {
            console.log('Logon', message.sender);
            if (!sendingPlayer) {
              const newPlayer = this.gameController.newPlayer(message.sender);
              fromConnection.player = newPlayer;
            } else {
              fromConnection.player = sendingPlayer;
            }

            const logonOk: SocloverMessage = {
              sender: 'SYSTEM',
              type: MessageType.LOGON_OK,
              user: { name: fromConnection.player.name },
            };

            fromConnection.sendMessage(logonOk);
          }
          break;

        case MessageType.GET_STATE:
          this.broadcastStateToConection(fromConnection);
          break;

        // case MessageType.JOIN_TEAM:
        //   sendingPlayer.team = message.team;
        //   break;

        // case MessageType.SEND_GUESS:
        //   this.game.addGuess(message);
        //   break;

        // case MessageType.SEND_CLUES:
        //   this.game.setClues(message);
        //   break;

        // case MessageType.ALL_CHAT:
        //   this.broadcastAll(message);
        //   return;

        // case MessageType.TEAM_CHAT:
        //   this.broadcastTeam(message);
        //   return;

        // case MessageType.SEND_CONTINUE:
        //   this.game.continue(message);
        //   break;

        case MessageType.SEED:
          seedrandom(message.seed, { global: true });
          console.log(
            ' ---------------------------------------------------------------------  SEED>',
            message.seed,
            '<'
          );

          break;

        case MessageType.RESET:
          this.reset();
          break;
      }

      this.broadcastStateToAll();
    } catch (err) {
      console.error(err);
    }
  }

  reset() {
    const reset: SocloverMessage = {
      sender: 'SYSTEM',
      type: MessageType.RESET,
      // seed: Math.random(),
    };

    this.broadcastAll(reset);

    this.connections.forEach((c) => {
      c.player = undefined;
    });

    console.log(' NEW GAME -----------------------------------------------  ');
    this.gameController.newGame();
  }

  broadcastStateToAll() {
    for (const c of this.connections) {
      this.broadcastStateToConection(c);
    }
  }

  broadcastStateToConection(connection: RoomConnection) {
    const message: SocloverMessage = {
      sender: 'SYSTEM',
      type: MessageType.STATE,
      game: this.gameController.game,
    };

    if (connection) {
      connection.sendMessage(message);
    }
  }

  // broadcastTeam(message) {
  //   const me = this.game.playerFromName(message.sender);
  //   for (const c of this.connections) {
  //     if (c.player && c.player.team === me.team) c.sendMessage(message);
  //   }
  // }

  broadcastAll(message) {
    for (const c of this.connections) {
      c.sendMessage(message);
    }
  }

  closeConnectionImpl() {
    this.broadcastStateToAll();
    console.log('closed');
  }
}
