import { Injectable } from '@angular/core';
import {
  Card,
  Game,
  MessageType,
  Patch,
  Player,
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

  subject$ = new BehaviorSubject<SocloverMessage | null>(null);
  game: Game | undefined;
  myPlayer?: Player;

  constructor(public connection: ConnectionService, public router: Router) {
    this.connection.messageSubject.subscribe((message) => {
      const messageTyped = message as SocloverMessage;
      if (!message) {
        return;
      }

      // console.log('message', message);
      switch (message.type) {
        case MessageType.STATE:
          console.log('GAME', messageTyped.game);
          this.game = messageTyped.game;
          this.myPlayer = this.game?.players.find(
            (player) => player.name === this.user?.name
          );

          this.subject$.next(message);
          break;
        case MessageType.LOGON_OK:
          this.user = { name: messageTyped.recipient };
          sessionStorage.setItem('user', JSON.stringify(this.user));
          this.router.navigateByUrl('/leaf');
          break;

        case MessageType.PATCH:
          console.log('PATCH', messageTyped);
          break;
      }
    });
  }

  _updateUI(card: Card, player: Player | undefined) {
    if (!player || !player.name) {
      return;
    }

    const patch: SocloverMessage = {
      card,
      playerName: player.name,
      type: MessageType.PATCH,
    };

    const now = Date.now();
    console.log(JSON.stringify(patch, null, 2));
    this.lastUpdate = now;
    clearTimeout(this.timer);
    this.timer = null;
    this.connection.doSend(patch);
  }

  updateUI(card: Card, player: Player | undefined) {
    if (!player) {
      return;
    }
    const now = Date.now();
    const delta = now - this.lastUpdate;
    // console.log('delta', delta);

    if (delta > this.debounce) {
      // console.log('update');
      this._updateUI(card, player);
    } else if (!this.timer) {
      const wait = now + this.debounce - this.lastUpdate;
      // console.log('deffered update', wait);
      this.timer = setTimeout(() => {
        this._updateUI(card, player);
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

  newHand() {
    const message: SocloverMessage = {
      type: MessageType.NEW_HAND,
    };
    this.connection.doSend(message);
  }
}
