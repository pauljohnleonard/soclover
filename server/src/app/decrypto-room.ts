import { Player, DecryptoMessage, MessageType } from '@games/lib-decrypto';
import { Game } from './game';
import { Room } from './room';
import { RoomConnection } from './room-connection';
const seedrandom = require('seedrandom');

const videoUrl = `https://us02web.zoom.us/j/708254000`;

export class DecryptoRoom extends Room {
  game: Game;
  name: string;

  constructor(name) {
    super();
    this.name = name;
    this.game = new Game();
    // this.game.videoUrl = `https://meet.jit.si/decryptoclub-room1`;
    this.game.videoUrl = videoUrl;
  }

  playerInRoom(name: string) {
    const existing = this.game.players.find(player => player.name === name);
  }

  processMessage(message: DecryptoMessage, fromConnection: RoomConnection) {
    console.log(JSON.stringify(message));
    try {
      const sendingPlayer = this.game.players.find(
        user => user.name === message.sender
      );

      switch (message.type) {
        case MessageType.SEND_READY:
          sendingPlayer.ready = true;
          this.game.playerReady();
          break;

        case MessageType.SEND_LOGOUT:
          this.game.playerLeave(message.sender);
          break;

        case MessageType.SEND_LOGON:
          console.log('Logon', message.sender);
          if (!sendingPlayer) {
            const newPlayer = this.game.newPlayer(message.sender);
            fromConnection.player = newPlayer;
          } else {
            fromConnection.player = sendingPlayer;
          }
          break;

        case MessageType.GET_STATE:
          this.broadcastStateToConection(fromConnection);
          break;

        case MessageType.JOIN_TEAM:
          sendingPlayer.team = message.team;
          break;

        case MessageType.SEND_GUESS:
          this.game.addGuess(message);
          break;

        case MessageType.SEND_CLUES:
          this.game.setClues(message);
          break;

        case MessageType.ALL_CHAT:
          this.broadcastAll(message);
          return;

        case MessageType.TEAM_CHAT:
          this.broadcastTeam(message);
          return;

        case MessageType.SEND_CONTINUE:
          this.game.continue(message);
          break;
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
    const reset: DecryptoMessage = {
      sender: 'SYSTEM',
      type: MessageType.RESET
    };

    this.broadcastAll(reset);

    this.connections.forEach(c => {
      c.player = undefined;
    });

    console.log(' NEW GAME -----------------------------------------------  ');
    this.game = new Game();
    this.game.videoUrl = videoUrl;
  }

  broadcastStateToAll() {
    for (const c of this.connections) {
      this.broadcastStateToConection(c);
    }
  }

  broadcastStateToConection(connection: RoomConnection) {
    const message: DecryptoMessage = {
      sender: 'SYSTEM',
      type: MessageType.STATE,
      game: this.game
    };

    if (!connection) {
    } else {
      connection.sendMessage(message);
    }
  }

  broadcastTeam(message) {
    const me = this.game.playerFromName(message.sender);
    for (const c of this.connections) {
      if (c.player && c.player.team === me.team) c.sendMessage(message);
    }
  }

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
