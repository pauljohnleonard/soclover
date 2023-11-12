import { DecryptoMessage, Player } from '@games/lib-decrypto';
import { Room } from './room';

export class RoomConnection {
  player: Player;
  ws: any;
  room: Room;
  constructor(ws, room: Room) {
    this.ws = ws;
    this.room = room;

    ws.on('message', (str: string) => {
      try {
        const message: DecryptoMessage = JSON.parse(str);
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

  sendMessage(mess: DecryptoMessage) {
    try {
      const str = JSON.stringify(mess, null, 2);
      this.ws.send(str);
    } catch (err) {
      console.error(err);
    }
  }
}
