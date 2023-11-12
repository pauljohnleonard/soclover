import { WaitingRoom } from './app/waitingroom';

const WebSocket = require('ws');

const PORT = 3005;

console.log(' DECRYPTO decryto-server --- starting');

const wss = new WebSocket.Server({ port: PORT });

const waitingRoom = new WaitingRoom();
wss.on('connection', ws => {
  waitingRoom.addConnection(ws); // enter waiting room
});

console.log(` DECRYPTO decryto-server --- started server on ${PORT}`);
