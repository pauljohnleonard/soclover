import { Leaf, MessageType, SocloverMessage } from '@soclover/lib-soclover';
import { Room } from './room';
import { RoomConnection } from './room-connection';
import { GameController } from './game-controller';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const seedrandom = require('seedrandom');

const videoUrl = `https://us02web.zoom.us/j/708254000`;

export class SocloverRoom extends Room {
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
    const existing = this.gameController.game.leafs.find(
      (leaf) => leaf.playerName === name
    );
  }

  processMessage(message: SocloverMessage, fromConnection: RoomConnection) {
    console.log(JSON.stringify(message));
    try {
      // const sendingPlayerName = this.connections.find(
      //   (c) => c.playerName === message.sender
      // );

      if (message.type === MessageType.SEND_LOGON) {
        console.log('Logon', message.sender);

        if (!fromConnection.playerName) {
          //   const newLeaaf = this.gameController.newLeaf(message.sender);
          //   fromConnection.playerName = newLeaf;
          // } else {
          fromConnection.playerName = message.sender;
        }

        const logonOk: SocloverMessage = {
          sender: 'SYSTEM',
          type: MessageType.LOGON_OK,
          recipient: fromConnection.playerName,
        };

        fromConnection.sendMessage(logonOk);

        this.broadcastAll(this.listActivePlayers());
      }

      switch (message.type) {
        case MessageType.PATCH:
          this.gameController.setPatch(message);
          this.broadcastOthers(message, fromConnection);
          return;

        case MessageType.LIST_ACTIVE:
          {
            fromConnection.sendMessage(this.listActivePlayers());
          }
          return;

        case MessageType.SEND_LOGOUT:
          this.gameController.playerLeave(message.sender);
          this.broadcastAll(this.listActivePlayers());
          break;

        case MessageType.NEW_LEAF: {
          const newLeaf: Leaf = this.gameController.newLeaf(message.sender);
          message.newLeaf = newLeaf;
          message.clientID = null;
          fromConnection.sendMessage(message);
          return;
        }

        case MessageType.NEW_GAME:
          this.gameController.newGame();
          break;

        case MessageType.SELECT_SOLVE:
          this.gameController.setFocusPlayer(message);
          this.broadcastOthers(message, fromConnection);
          return;

        case MessageType.GET_STATE:
          this.broadcastStateToConection(fromConnection);
          break;

        case MessageType.SEND_LEAF_WITH_CLUES:
          this.gameController.addLeafToGame(message);
          break;
      }

      // Fall through if state has changed and you want to broadcast it
      this.broadcastStateToAll();
    } catch (err) {
      console.error(err);
    }
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

  broadcastAll(message) {
    for (const c of this.connections) {
      c.sendMessage(message);
    }
  }

  broadcastOthers(message, fromConnection) {
    for (const c of this.connections) {
      if (c !== fromConnection) {
        c.sendMessage(message);
      }
    }
  }

  closeConnectionImpl() {
    this.broadcastStateToAll();
    console.log('closed');
  }

  getActivePlayers(delta = 1000 * 60 * 60 * 2) {
    const now = Date.now();
    return this.connections
      .filter((c) => now - c.stamp < delta)
      .map((c) => c.playerName);
  }

  listActivePlayers(): SocloverMessage {
    return {
      sender: 'SYSTEM',
      type: MessageType.LIST_ACTIVE,
      activePlayers: this.getActivePlayers(),
    };
  }
}
