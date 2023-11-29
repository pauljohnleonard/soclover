import { Injectable } from '@angular/core';
import {
  Card,
  Game,
  MessageType,
  Player,
  SocloverMessage,
  User,
  applyPatch,
  cardUImembers,
} from '@soclover/lib-soclover';

import { BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { ConnectionService } from '../connection.service';
import { cloneDeep } from 'lodash';

@Injectable({ providedIn: 'root' })
export class ModelService {
  lastUpdate = 0;
  timer: any;
  debounce = 200;
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
          // console.log('STATE CHANGE', messageTyped.game);
          this.game = messageTyped.game;
          this.myPlayer = this.game?.players.find(
            (player) => player.name === this.user?.name
          );

          this.subject$.next(message);
          break;

        case MessageType.LOGON_OK:
          this.user = { name: messageTyped.recipient };
          sessionStorage.setItem('user', JSON.stringify(this.user));
          this.router.navigateByUrl('/board');
          break;

        case MessageType.PATCH:
          if (this.game) {
            console.log('PATCH', messageTyped);
            applyPatch(messageTyped, this.game);
            this.subject$.next(message);
          }
          break;

        case MessageType.SELECT_SOLVE:
          if (this.game) {
            console.log('SELECT SOLVE', messageTyped);
            this.subject$.next(message);
          }
          break;
      }
    });
  }

  selectSolve(player: Player) {
    const mess: SocloverMessage = {
      playerName: player.name,
      type: MessageType.SELECT_SOLVE,
    };
    this.connection.doSend(mess);
  }

  _updateUI(player: Player | undefined) {
    if (!player || !player.name) {
      return;
    }

    const cards: Card[] = cloneDeep(player.hand.cards);

    for (const card of cards) {
      for (const key of Object.keys(card)) {
        if (!cardUImembers.includes(key)) {
          delete (card as any)[key];
        }
      }
    }

    const patch: SocloverMessage = {
      cards,
      playerName: player.name,
      type: MessageType.PATCH,
    };

    const now = Date.now();
    // console.log('Send patch:', JSON.stringify(patch, null, 2));
    this.lastUpdate = now;
    clearTimeout(this.timer);
    this.timer = null;
    this.connection.doSend(patch);
  }

  updateUI(player: Player) {
    if (!player) {
      return;
    }

    const now = Date.now();

    const delta = now - this.lastUpdate;
    // console.log('delta', delta);

    if (delta > this.debounce) {
      // console.log('update');
      this._updateUI(player);
    } else if (!this.timer) {
      const wait = now + this.debounce - this.lastUpdate;
      // console.log('deffered update', wait);
      this.timer = setTimeout(() => {
        this._updateUI(player);
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
