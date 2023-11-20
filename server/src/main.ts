import { WaitingRoom } from './app/waitingroom';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const WebSocket = require('ws');

const PORT = 3005;

console.log(' SOCLOVER server --- starting');

const wss = new WebSocket.Server({ port: PORT });

const waitingRoom = new WaitingRoom();
wss.on('connection', (ws) => {
  console.log(' SOCLOVER server --- connection');
  waitingRoom.addConnection(ws); // enter waiting room
});

console.log(` SOCLOVER server --- started server on ${PORT}`);
