import { Injectable } from '@angular/core';
import { Button, StatusEnum } from './leafData';
import { ModelService } from './model.service';
import { Card, Leaf } from '@soclover/lib-soclover';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UiService {
  showButtons = true;
  guessing = false;
  loading = true;

  focusPetal: number | undefined;
  focusLeaf!: Leaf | undefined;
  setting = false;
  backButton!: Button;
  status$ = new Subject<StatusEnum>();

  constructor(public modelService: ModelService, public router: Router) {
    this.music();
    this.backButton = {
      text: '',
      id: 'home',
      click: () => {
        this.router.navigateByUrl('/home');
      },
    };

    this.modelService.subject$.subscribe((message) => {
      if (this.modelService.mySettingLeaf) {
        if (this.modelService?.mySettingLeaf?.clues?.length === 4) {
          this.setting = false;
        }
      }

      if (!message) {
        return;
      }

      // Re-bind focusLeaf to the live game copy after full STATE snapshots
      if (message.type === 'STATE' && this.focusLeaf && !this.setting) {
        const live =
          (this.focusLeaf._id &&
            this.modelService.game?.leaves.find(
              (l) => l._id === this.focusLeaf?._id
            )) ||
          this.modelService.leafByAuthor(this.focusLeaf.playerName || '');
        if (live) {
          if (this.focusLeaf.hasUI && this.focusLeaf !== live) {
            this.mergeSolveUi(this.focusLeaf, live);
          }
          this.focusLeaf = live;
        }
      }

      if (message.type === 'PATCH') {
        if (
          this.focusLeaf &&
          message.playerName === this.focusLeaf?.playerName
        ) {
          // focusLeaf already mutated by applyPatch when it is the live copy
          this.focusLeaf = this.modelService.leafByAuthor(
            message.playerName || ''
          ) || this.focusLeaf;
        }
      } else if (message.type === 'SELECT_SOLVE') {
        // Only auto-follow if already solving (not creating); join via Home otherwise
        if (
          !this.setting &&
          this.focusLeaf &&
          message.playerName !== this.focusLeaf?.playerName
        ) {
          const realPlayer = this.modelService.leafByAuthor(
            message.playerName || ''
          );
          if (realPlayer) {
            this.setSolveLeaf(realPlayer);
          }
        }
      }
    });
  }

  initSetting(leaf: Leaf) {
    console.log('initSetting', leaf);
    this.setting = true;
    this.guessing = false;
    this.focusLeaf = leaf;
  }

  makeNewLeaf() {
    console.log('makeNewLeaf');
    this.focusLeaf = undefined;
    this.modelService.newLeaf().subscribe((leaf) => {
      this.focusLeaf = leaf;
      this.setting = true;
      this.guessing = false;
      this.router.navigateByUrl('/makeleaf');
    });
  }

  /** Open make-leaf with an AI-generated (or otherwise ready) leaf for review. */
  openGeneratedLeaf(leaf: Leaf) {
    leaf.playerName = this.modelService.name;
    leaf.submitted = false;
    this.focusLeaf = leaf;
    this.focusPetal = undefined;
    this.setting = true;
    this.guessing = false;
    this.router.navigateByUrl('/makeleaf');
  }

  get solveButtons() {
    const buttons: Button[] = [this.backButton];

    const but: Button = {
      text: '',
      id: 'question_mark',
      leaf: null,
      disabled: !this.canGuess(),
      click: () => {
        this.haveAGo();
        this.guessing = true;
      },
    };

    buttons.push(but);

    return buttons;
  }

  get settingButtons() {
    const buttons: Button[] = [this.backButton];
    buttons.push({
      text: '',
      id: 'compost',
      leaf: null,
      click: () => {
        this.setting = true;
        this.makeNewLeaf();
      },
    });

    if (this.focusLeaf?.clues?.filter((c) => !!c).length === 4) {
      buttons.push({
        text: '',
        id: 'upload',
        leaf: null,
        click: () => {
          this.focusLeaf ? this.modelService.uploadLeaf(this.focusLeaf) : null;
          this.focusLeaf = undefined;
          this.setting = false;
          this.router.navigateByUrl('/home');
        },
      });
    }
    return buttons;
  }

  /** Copy drag/guess UI fields onto the shared room leaf after STATE refresh */
  private mergeSolveUi(from: Leaf, to: Leaf) {
    for (const card of from.cards || []) {
      const target = to.cards.find((c) => c.slot === card.slot);
      if (!target) {
        continue;
      }
      target.guessSlot = card.guessSlot;
      target.guessOrientation = card.guessOrientation || 0;
      target.dragPos = card.dragPos;
      target.draggee = card.draggee;
      target.wrong = card.wrong;
    }
    to.hasUI = true;
    to.solved = from.solved;
  }

  setSolveLeaf(leaf: Leaf) {
    this.router.navigateByUrl('/solve');
    this.focusLeaf = leaf;
    this.focusPetal = undefined;
    this.setting = false;

    // Prefer the live room copy so patches stay shared
    const live =
      (leaf._id &&
        this.modelService.game?.leaves.find((l) => l._id === leaf._id)) ||
      this.modelService.leafByAuthor(leaf.playerName || '');
    if (live) {
      this.focusLeaf = live;
      leaf = live;
    }

    // Cards from MongoDB omit UI fields; missing guessOrientation
    // becomes rotate(NaN) and stacks all four words on each card.
    if (!leaf.hasUI) {
      for (let i = 0; i < leaf.cards.length; i++) {
        const card = leaf.cards[i];
        card.guessSlot = -(i + 1);
        card.guessOrientation = card.guessOrientation || 0;
        card.wrong = false;
        card.draggee = undefined;
        card.dragPos = undefined;
      }
      leaf.hasUI = true;
      this.modelService.updateLeafUI(leaf);
    } else {
      for (const card of leaf.cards) {
        card.guessOrientation = card.guessOrientation || 0;
      }
    }
  }

  canGuess(): boolean {
    return (
      this.focusLeaf?.cards.filter(
        (c) => c.guessSlot !== undefined && c.guessSlot >= 0
      ).length === 4
    );
  }

  haveAGo() {
    if (!this.focusLeaf) return;
    let success = true;
    for (const card of this.focusLeaf.cards || []) {
      card.wrong = false;
      if (card.guessSlot === undefined || card.guessSlot >= 0) {
        card.wrong =
          card.guessSlot !== card.slot || card.guessOrientation !== 0;
        success = success && !card.wrong;
      }
    }

    this.focusLeaf.solved = success;
    this.modelService.updateLeafUI(this.focusLeaf as Leaf);

    if (success) {
      this.modelService.reportSolved(this.focusLeaf);
      this.status$.next(StatusEnum.SOLVED);
      this.right();
    } else {
      this.status$.next(StatusEnum.WRONG);
      this.wrong();
    }
  }

  defaultClues(cards: Card[]) {
    return ['', '', '', ''];
  }

  get leafViewButtons() {
    if (this.setting) {
      return this.settingButtons;
    } else {
      return this.solveButtons;
    }
  }
  toggleButtons() {
    this.showButtons = !this.showButtons;
  }

  handleKeyboardEvent(key: string): void {
    console.log('Key pressed globally:', key, this.focusPetal);
    if (
      this.focusPetal === undefined ||
      this.focusLeaf === undefined ||
      !this.setting
    ) {
      return;
    }

    if (key === 'Enter' || key === 'Escape') {
      this.focusPetal = undefined;
    } else if (key === 'Tab') {
      this.focusPetal = (this.focusPetal + 1) % 4;
    } else if (key === 'Delete' || key === 'Backspace') {
      console.log('Delete or Backspace key pressed globally');

      if (
        this.focusLeaf.clues &&
        this.focusLeaf?.clues[this.focusPetal].length
      ) {
        this.focusLeaf.clues[this.focusPetal] = this.focusLeaf.clues[
          this.focusPetal
        ].slice(0, -1);
      }
    } else if (/^[a-zA-Z0-9\s-]$/.test(key) && this.focusLeaf.clues) {
      console.log('Printable character pressed globally:', key);
      this.focusLeaf.clues[this.focusPetal] += key;
    } else {
      return;
    }
  }

  music() {
    const audioFile = 'assets/sounds/cheese.mp3';
    // Create an Audio object
    const audio = new Audio(audioFile);
    // Play the audio
    audio.volume = 0.2;
    audio.play();
  }

  wrong() {
    const audioFile = 'assets/sounds/wrong.mp3';
    // Create an Audio object
    const audio = new Audio(audioFile);
    // Play the audio
    audio.volume = 0.1;
    audio.play();
  }

  right() {
    const audioFile = 'assets/sounds/right.mp3';
    // Create an Audio object
    const audio = new Audio(audioFile);
    // Play the audio
    audio.volume = 0.1;
    audio.play();
  }
}
