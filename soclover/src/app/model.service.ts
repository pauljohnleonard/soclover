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
  newleavesubject$ = new Subject<Leaf>();
  activePlayers: string[] | undefined;
  rebuildButtons$ = new Subject<void>();

  constructor(public connection: ConnectionService, public router: Router) {
    this.connection.messageSubject.subscribe((rawMessage) => {
      const message = rawMessage as SocloverMessage;
      if (!rawMessage) {
        return;
      }

      switch (rawMessage.type) {
        case MessageType.STATE:
          this.game = message.game;
          this.mySettingLeaf = this.game?.leaves.find(
            (player) => player.playerName === this?.name
          );
          this.subject$.next(rawMessage);
          this.rebuildButtons$.next();
          break;

        case MessageType.LOGON_OK:
          if (!message.recipient) {
            throw new Error('No recipient');
          }
          sessionStorage.setItem('userName', this.name);
          this.router.navigateByUrl('/home');
          break;

        case MessageType.PATCH:
          if (this.game) {
            console.log('PATCH', message);
            applyPatch(message, this.game);
            this.subject$.next(message);
          }
          break;

        case MessageType.LIST_ACTIVE:
          this.activePlayers = message.activePlayers;
          this.rebuildButtons$.next();
          break;

        case MessageType.SELECT_SOLVE:
          if (this.game) {
            console.log('SELECT SOLVE', message);
            if (message.sender && message.playerName) {
              if (!this.game.playerFocus) {
                this.game.playerFocus = {};
              }
              this.game.playerFocus[message.sender] = message.playerName;
            }
            this.game.focusPlayerName = message.playerName;
            this.subject$.next(rawMessage);
            this.rebuildButtons$.next();
          }
          break;

        case MessageType.NEW_LEAF:
          message.newLeaf ? this.newleavesubject$.next(message.newLeaf) : null;
          break;
      }
    });
  }

  /** Leaf author name the given player is currently solving, if any */
  solvingLeafAuthor(playerName: string): string | undefined {
    return this.game?.playerFocus?.[playerName];
  }

  leafByAuthor(authorName: string): Leaf | undefined {
    return this.game?.leaves.find((l) => l.playerName === authorName);
  }

  /** Keep a local copy in game.leaves so solve/join work before STATE returns */
  ensureLocalLeaf(leaf: Leaf): Leaf {
    if (!this.game) {
      this.game = { leaves: [], playerFocus: {} };
    }

    const existing =
      (leaf._id && this.game.leaves.find((l) => l._id === leaf._id)) ||
      this.game.leaves.find((l) => l.playerName === leaf.playerName);

    if (existing) {
      return existing;
    }

    if (!leaf.layouts) {
      leaf.layouts = {};
    }
    if (!leaf.guesses) {
      leaf.guesses = {};
    }
    this.game.leaves.push(leaf);
    return leaf;
  }

  selectSolveLeafBroadcast(leaf: Leaf) {
    const local = this.ensureLocalLeaf(leaf);

    const mess: SocloverMessage = {
      playerName: local.playerName,
      leaf: local,
      type: MessageType.SELECT_SOLVE,
    };
    this.connection.doSend(mess);

    // Optimistic local presence so Join shows immediately for self
    if (this.name && local.playerName && this.game) {
      if (!this.game.playerFocus) {
        this.game.playerFocus = {};
      }
      this.game.playerFocus[this.name] = local.playerName;
      this.game.focusPlayerName = local.playerName;
      this.rebuildButtons$.next();
    }

    return local;
  }

  /**
   * Open a leaf for solving (from library or session).
   * Promotes library leaves into the live room so peers can join.
   */
  openLeafForSolve(leaf: Leaf): Leaf {
    return this.selectSolveLeafBroadcast(leaf);
  }

  _updateUI(leaf: Leaf | undefined, layoutOwner?: string) {
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
      layoutOwner: layoutOwner || this.name,
      type: MessageType.PATCH,
    };

    const now = Date.now();
    this.lastUpdate = now;
    clearTimeout(this.timer);
    this.timer = null;
    this.connection.doSend(patch);
  }

  pendingLayoutOwner?: string;

  updateLeafUI(leaf: Leaf, layoutOwner?: string) {
    if (!leaf) {
      return;
    }

    if (layoutOwner !== undefined) {
      this.pendingLayoutOwner = layoutOwner;
    }

    const now = Date.now();
    const delta = now - this.lastUpdate;
    const owner = this.pendingLayoutOwner;

    if (delta > this.debounce) {
      this._updateUI(leaf, owner);
    } else if (!this.timer) {
      const wait = now + this.debounce - this.lastUpdate;
      this.timer = setTimeout(() => {
        this._updateUI(leaf, this.pendingLayoutOwner);
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

  reportGuess(leaf: Leaf) {
    const message: SocloverMessage = {
      type: MessageType.REPORT_GUESS,
      playerName: leaf.playerName,
      leaf,
    };
    this.connection.doSend(message);
  }

  reportSolved(leaf: Leaf) {
    const message: SocloverMessage = {
      type: MessageType.REPORT_SOLVED,
      playerName: leaf.playerName,
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
    return !!this.mySettingLeaf?.submitted || !!this.mySettingLeaf?.clues;
  }
}
