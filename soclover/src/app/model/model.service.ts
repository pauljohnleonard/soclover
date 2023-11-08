import { Injectable } from '@angular/core';
import { Hand } from './model';

import { cloneDeep } from 'lodash';

@Injectable({ providedIn: 'root' })
export class ModelService {
  currentHand!: Hand;
  guessHand!: Hand;

  getNewHand(): Hand {
    const hand: Hand = {
      cards: [
        {
          words: ['0a', '0b', '0c', '0d'],
          orientation: 0,
          slot: -5,
        },
        {
          words: ['1a', '1b', '1c', '1d'],
          orientation: 0,
          slot: -4,
        },
        {
          words: ['2a', '2b', '2c', '2d'],
          orientation: 0,
          slot: -2,
        },
        {
          words: ['3a', '3b', '3c', '3d'],
          orientation: 0,
          slot: -3,
        },
        {
          words: ['4a', '4b', '4c', '4d'],
          orientation: 0,
          slot: -1,
        },
      ],
    };
    return hand;
  }

  setPuzzle() {
    this.currentHand = this.getNewHand();
    this.guessHand = cloneDeep(this.currentHand);
  }

  getPuzzle() {
    if (!this.guessHand) {
      this.setPuzzle();
    }
    return this.guessHand;
  }
}
