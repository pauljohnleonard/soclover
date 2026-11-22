/* eslint-disable @typescript-eslint/no-var-requires */
import {
  usersThatHaveLeaves,
  fetchLeavesSummary,
  fetchLeaf,
  generateLeaf,
} from './app/api';
import { MongoDB } from './app/db/db';
import { WaitingRoom } from './app/waitingroom';
import * as path from 'path';

const cors = require('cors');
const express = require('express');
const ws = require('ws');
const dotenv = require('dotenv');

// Load repo-root .env (nx may run with cwd = server/)
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 3055;
MongoDB.instance;

const httpServer = app.listen(PORT);

console.log(' SOCLOVER server --- starting');

const wss = new ws.Server({ noServer: true });

const waitingRoom = new WaitingRoom();

httpServer.on('upgrade', (req, socket, head) => {
  wss.handleUpgrade(req, socket, head, (wsConn) => {
    wss.emit('connection', wsConn, req);
  });
});

wss.on('connection', (wsConn) => {
  console.log(' SOCLOVER server --- connection');
  waitingRoom.addConnection(wsConn); // enter waiting room
});

console.log(` SOCLOVER web server --- started server on ${PORT}`);

app.get('/', (req, res) => {
  res.send('hello world');
});

app.get('/users-that-have-leaves', usersThatHaveLeaves);
app.get('/fetch-leaves', fetchLeavesSummary);
app.get('/fetch-leaf/:id', fetchLeaf);
app.post('/generate-leaf', generateLeaf);
