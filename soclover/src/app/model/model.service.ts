import { Injectable } from '@angular/core';
import {
  Game,
  MessageType,
  SocloverMessage,
  User,
} from '@soclover/lib-soclover';

import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { ConnectionService } from '../connection.service';

@Injectable({ providedIn: 'root' })
export class ModelService {
  lastUpdate = 0;
  timer: any;
  debounce = 500;
  user?: User;

  subject$ = new BehaviorSubject<any>(null);
  game: Game | undefined;

  constructor(public connection: ConnectionService, public router: Router) {
    this.connection.messageSubject.subscribe((message) => {
      const messageTyped = message as SocloverMessage;
      if (!message) {
        return;
      }

      console.log('message', message);
      switch (message.type) {
        case MessageType.STATE:
          this.game = messageTyped.game;
          this.subject$.next(message.type);
          break;
        case MessageType.LOGON_OK:
          this.user = { name: messageTyped.recipient };
          sessionStorage.setItem('user', JSON.stringify(this.user));
          this.router.navigateByUrl('/leaf');
          break;
      }
    });
  }

  _update() {
    // const patchArray: { index: number; patch: Patch }[] = [];
    // for (let i = 0; i < 5; i++) {
    //   const patch: Patch = {};
    //   const currentCard = this.currentHand.cards[i];
    //   const guessCard = this.guessHand.cards[i];
    //   if (currentCard.slot !== guessCard.slot) {
    //     patch.slot = guessCard.slot;
    //   }
    //   if (currentCard.orientation !== guessCard.orientation) {
    //     patch.orientation = guessCard.orientation;
    //   }
    //   if (
    //     currentCard.dragPos?.x !== guessCard.dragPos?.x ||
    //     currentCard.dragPos?.y !== guessCard.dragPos?.y
    //   ) {
    //     patch.dragPos = guessCard.dragPos;
    //   }
    //   if (Object.keys(patch).length > 0) {
    //     patchArray.push({ index: i, patch });
    //   }
    // }
    // if (patchArray.length === 0) {
    //   return;
    // }
    // const now = Date.now();
    // console.log(JSON.stringify(patchArray, null, 2));
    // this.currentHand = cloneDeep(this.guessHand);
    // this.lastUpdate = now;
    // clearTimeout(this.timer);
    // this.timer = null;
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

  uploadClues(clues: string[]) {
    const message: SocloverMessage = {
      type: MessageType.SEND_CLUES,
      clues,
    };
    this.connection.doSend(message);
  }
}
