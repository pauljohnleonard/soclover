import { SocloverMessage } from '@soclover/lib-soclover';
import { RoomConnection } from './room-connection';

export abstract class Room {
  connections: RoomConnection[] = [];

  abstract processMessage(message: SocloverMessage, connection: RoomConnection);

  addConnection(ws): RoomConnection {
    const newConnection = new RoomConnection(ws, this);
    this.connections.push(newConnection);
    return newConnection;
  }

  cutConnection(c: RoomConnection) {
    this.connections = this.connections.filter((x) => x !== c);
  }
}
