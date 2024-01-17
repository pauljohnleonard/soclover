import { Leaf } from '@soclover/lib-soclover';
import { AsyncSubject } from 'rxjs';
import { HandModel } from '../models/hand.model';
/* eslint-disable @typescript-eslint/no-var-requires */
const mongoose = require('mongoose');

export class MongoDB {
  static _instance: MongoDB;
  static get instance() {
    if (!MongoDB._instance) {
      MongoDB._instance = new MongoDB();
    }
    return MongoDB._instance;
  }

  ready$ = new AsyncSubject<boolean>();

  constructor() {
    // Connect to MongoDB
    mongoose.connect('mongodb://localhost:27017/soclover', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Check the connection
    const db = mongoose.connection;
    db.on('error', console.error.bind(console, 'Connection error:'));
    db.once('open', () => {
      console.log('Connected to the database!');
      // Your Mongoose-related code goes here
      this.ready$.next(true);
      this.ready$.complete();
    });
  }

  async saveHand(leaf: Leaf) {
    await this.ready$.toPromise();
    const res = await HandModel.create(leaf);
    console.log(res);
  }
}
