import { SocloverMessage } from '@soclover/lib-soclover';
import { Room } from './room';

export class RoomConnection {
  playerName: string;
  ws: any;
  room: Room;
  constructor(ws, room: Room) {
    this.ws = ws;
    this.room = room;

    ws.on('message', (str: string) => {
      try {
        const message: SocloverMessage = JSON.parse(str);
        console.log('received: %s', str);
        this.room.processMessage(message, this);
      } catch (err) {
        console.error(err);
      }
    });

    ws.on('close', () => {
      console.log('CLOSING ----------------------------------------------- ');
      this.room.cutConnection(this);
    });

    ws.on('error', () => {
      console.log(' ERROR ----------------------------------------------- ');
      this.room.cutConnection(this);
    });
  }

  sendMessage(mess: SocloverMessage) {
    try {
      const str = JSON.stringify(mess, null, 2);
      this.ws.send(str);
    } catch (err) {
      console.error(err);
    }
  }

  getPlayerNames() {
    return this.room.connections.map((c) => c.playerName);
  }
}
