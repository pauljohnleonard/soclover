import { Injectable } from '@angular/core';
import {
  Card,
  Game,
  MessageType,
  Leaf,
  SocloverMessage,
  applyPatch,
  cardUImembers,
} from '@soclover/lib-soclover';

import { BehaviorSubject, Subject } from 'rxjs';
import { Router } from '@angular/router';
import { ConnectionService } from './connection.service';
import { cloneDeep } from 'lodash';

@Injectable({ providedIn: 'root' })
export class ModelService {
  lastUpdate = 0;
  timer: any;
  debounce = 500;

  subject$ = new BehaviorSubject<SocloverMessage | null>(null);
  game: Game | undefined;
  mySettingLeaf?: Leaf;
  soloMode = false;
  newleavesubject$ = new Subject<Leaf>();
  activePlayers: string[] | undefined;
  rebuildButtons$ = new Subject<void>();

  constructor(public connection: ConnectionService, public router: Router) {
    this.connection.messageSubject.subscribe((rawMessage) => {
      const message = rawMessage as SocloverMessage;
      if (!rawMessage) {
        return;
      }

      // console.log('message', message);
      switch (rawMessage.type) {
        case MessageType.STATE:
          // console.log('STATE CHANGE', messageTyped.game);
          this.game = message.game;
          this.mySettingLeaf = this.game?.leaves.find(
            (player) => player.playerName === this?.name
          );

          if (!this.soloMode) break;

          this.subject$.next(rawMessage);
          break;

        case MessageType.LOGON_OK:
          if (!message.recipient) {
            throw new Error('No recipient');
          }
          sessionStorage.setItem('userName', this.name);
          this.router.navigateByUrl('/home');
          break;

        case MessageType.PATCH:
          if (this.soloMode) break;
          if (this.game) {
            console.log('PATCH', message);
            applyPatch(message, this.game);
            this.subject$.next(message);
          }
          break;

        case MessageType.LIST_ACTIVE:
          this.activePlayers = message.activePlayers;
          break;

        case MessageType.SELECT_SOLVE:
          if (this.game) {
            console.log('SELECT SOLVE', message);
            this.subject$.next(rawMessage);
          }
          break;

        case MessageType.NEW_LEAF:
          message.newLeaf ? this.newleavesubject$.next(message.newLeaf) : null;
          break;
      }
    });
  }

  selectSolveLeafBroadcast(leaf: Leaf) {
    const mess: SocloverMessage = {
      playerName: leaf.playerName,
      type: MessageType.SELECT_SOLVE,
    };
    this.connection.doSend(mess);
  }

  _updateUI(leaf: Leaf | undefined) {
    if (!leaf || !leaf.playerName) {
      return;
    }

    const cards: Card[] = cloneDeep(leaf.cards);

    for (const card of cards) {
      for (const key of Object.keys(card)) {
        if (!cardUImembers.includes(key)) {
          delete (card as any)[key];
        }
      }
    }

    const patch: SocloverMessage = {
      cards,
      playerName: leaf.playerName,
      type: MessageType.PATCH,
    };

    const now = Date.now();
    // console.log('Send patch:', JSON.stringify(patch, null, 2));
    this.lastUpdate = now;
    clearTimeout(this.timer);
    this.timer = null;
    this.connection.doSend(patch);
  }

  updateLeafUI(leaf: Leaf) {
    if (!leaf || this.soloMode) {
      return;
    }

    const now = Date.now();

    const delta = now - this.lastUpdate;
    // console.log('delta', delta);

    if (delta > this.debounce) {
      // console.log('update');
      this._updateUI(leaf);
    } else if (!this.timer) {
      const wait = now + this.debounce - this.lastUpdate;
      // console.log('deffered update', wait);
      this.timer = setTimeout(() => {
        this._updateUI(leaf);
      }, wait);
    }
  }

  uploadLeaf(leaf: Leaf) {
    const message: SocloverMessage = {
      type: MessageType.SEND_LEAF_WITH_CLUES,
      leaf,
    };
    this.connection.doSend(message);
  }

  newLeaf() {
    const message: SocloverMessage = {
      type: MessageType.NEW_LEAF,
    };
    this.connection.doSend(message);

    return this.newleavesubject$;
  }

  async newGame() {
    const message: SocloverMessage = {
      type: MessageType.NEW_GAME,
    };

    await this.connection.doSend(message);
  }

  get name() {
    return this.connection.name;
  }

  hasSetupLeaf(): boolean {
    return !!this.mySettingLeaf?.clues;
  }

  toggleMode() {
    this.soloMode = !this.soloMode;
    this.rebuildButtons$.next();
  }
}
