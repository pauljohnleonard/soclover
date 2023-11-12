import { Injectable } from '@angular/core';
import { Hand, Patch } from '@soclover/lib-soclover';

import { cloneDeep } from 'lodash';

@Injectable({ providedIn: 'root' })
export class ModelService {
  currentHand!: Hand;
  guessHand!: Hand;
  lastUpdate = 0;
  timer: any;
  debounce = 500;
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

  _update() {
    let patchArray: { index: number; patch: Patch }[] = [];
    for (let i = 0; i < 5; i++) {
      const patch: Patch = {};

      const currentCard = this.currentHand.cards[i];
      const guessCard = this.guessHand.cards[i];

      if (currentCard.slot !== guessCard.slot) {
        patch.slot = guessCard.slot;
      }

      if (currentCard.orientation !== guessCard.orientation) {
        patch.orientation = guessCard.orientation;
      }
      if (
        currentCard.dragPos?.x !== guessCard.dragPos?.x ||
        currentCard.dragPos?.y !== guessCard.dragPos?.y
      ) {
        patch.dragPos = guessCard.dragPos;
      }
      if (Object.keys(patch).length > 0) {
        patchArray.push({ index: i, patch });
      }
    }

    if (patchArray.length === 0) {
      return;
    }

    const now = Date.now();
    console.log(JSON.stringify(patchArray, null, 2));

    this.currentHand = cloneDeep(this.guessHand);

    this.lastUpdate = now;
    clearTimeout(this.timer);
    this.timer = null;
  }

  update() {
    const now = Date.now();
    const delta = now - this.lastUpdate;
    // console.log('delta', delta);

    if (delta > this.debounce) {
      // console.log('update');
      this._update();
    } else if (!this.timer) {
      const wait = now + this.debounce - this.lastUpdate;
      // console.log('deffered update', wait);
      this.timer = setTimeout(() => {
        this._update();
      }, wait);
    }
  }
}
