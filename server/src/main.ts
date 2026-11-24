/* eslint-disable @typescript-eslint/no-var-requires */
import {
  usersThatHaveLeaves,
  fetchLeavesSummary,
  fetchLeaf,
  generateLeaf,
  features,
} from './app/api';
import { MongoDB } from './app/db/db';
import { WaitingRoom } from './app/waitingroom';
import * as path from 'path';
import * as fs from 'fs';

const cors = require('cors');
const express = require('express');
const ws = require('ws');
const dotenv = require('dotenv');

// Deploy: ~/soclover/.env ; local nx: repo-root .env
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const PORT = Number(process.env.PORT || 3055);
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

app.get('/users-that-have-leaves', usersThatHaveLeaves);
app.get('/fetch-leaves', fetchLeavesSummary);
app.get('/fetch-leaf/:id', fetchLeaf);
app.get('/features', features);
app.post('/generate-leaf', generateLeaf);

// Angular client (ThinkCentre deploy: ../client next to server/)
const clientDir = path.join(__dirname, '../client');
if (fs.existsSync(clientDir)) {
  console.log(` Serving client from ${clientDir}`);
  app.use(express.static(clientDir));
  app.get('*', (req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      return next();
    }
    // Avoid hijacking API-looking paths that missed a handler
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(clientDir, 'index.html'), (err) => {
      if (err) {
        next(err);
      }
    });
  });
} else {
  console.log(` No client dir at ${clientDir} — API/WS only`);
  app.get('/', (req, res) => {
    res.send('soclover api');
  });
}
