/* eslint-disable @typescript-eslint/no-var-requires */
// eslint-disable-next-line @typescript-eslint/no-var-requires

import { usersThatHaveLeaves, fetchLeavesSummary, fetchLeaf } from './app/api';
import { MongoDB } from './app/db/db';
import { WaitingRoom } from './app/waitingroom';
const cors = require('cors');

const express = require('express');

const ws = require('ws');

const app = express();

app.use(cors());

const PORT = 3055;
MongoDB.instance;

const httpServer = app.listen(PORT);

console.log(' SOCLOVER server --- starting');

const wss = new ws.Server({ noServer: true });

const waitingRoom = new WaitingRoom();

httpServer.on('upgrade', (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req);
  });
});

wss.on('connection', (ws) => {
  console.log(' SOCLOVER server --- connection');
  waitingRoom.addConnection(ws); // enter waiting room
});

console.log(` SOCLOVER web server --- started server on ${PORT}`);

app.get('/', (req, res) => {
  res.send('hello world');
});

app.get('/users-that-have-leaves', usersThatHaveLeaves);
app.get('/fetch-leaves', fetchLeavesSummary);
app.get('/fetch-leaf/:id', fetchLeaf);
