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
    const uri =
      process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/soclover';
    mongoose.connect(uri);

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
    leaf._id = res._id.toString();
    if (!leaf.solvers) {
      leaf.solvers = [];
    }
    console.log(res);
    return res;
  }

  async addSolvers(leafId: string, solvers: string[]) {
    if (!leafId || !solvers.length) {
      return;
    }
    await this.ready$.toPromise();
    await HandModel.updateOne(
      { _id: leafId },
      { $addToSet: { solvers: { $each: solvers } } }
    );
  }

  async setGuesses(leafId: string, guesses: { [name: string]: number }) {
    if (!leafId || !guesses) {
      return;
    }
    await this.ready$.toPromise();
    await HandModel.updateOne({ _id: leafId }, { $set: { guesses } });
  }
}
