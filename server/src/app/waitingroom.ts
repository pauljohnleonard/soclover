import { SocloverMessage, MessageType } from '@soclover/lib-soclover';

import { DecryptoRoom } from './soclover-room';
import { Room } from './room';
import { RoomConnection } from './room-connection';

export class WaitingRoom extends Room {
  decryptorooms: { [name: string]: DecryptoRoom } = {};

  constructor() {
    super();
  }

  processMessage(message: SocloverMessage, fromConnection: RoomConnection) {
    try {
      switch (message.type) {
        case MessageType.SEND_LOGON:
          console.log('Logon', message.sender);
          if (!this.decryptorooms[message.room]) {
            console.log(' NEW ROOM ', message.room);
            this.decryptorooms[message.room] = new DecryptoRoom(message.room);
          }

          fromConnection.room = this.decryptorooms[message.room];

          this.decryptorooms[message.room].connections.push(fromConnection);

          this.cutConnection(fromConnection);

          this.decryptorooms[message.room].processMessage(
            message,
            fromConnection
          );

          break;
      }
    } catch (err) {
      console.error(err);
    }
  }
}
