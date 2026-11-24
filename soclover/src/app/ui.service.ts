import { Injectable } from '@angular/core';
import { Button, StatusEnum } from './leafData';
import { ModelService } from './model.service';
import {
  Card,
  Leaf,
  applyLayoutToCards,
  saveLayoutForOwner,
} from '@soclover/lib-soclover';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';

export type SetSolveOpts = {
  /** Join this player's shared board (collaborative). */
  joinHost?: string;
};

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
  /** Whose layouts[] entry is shown / patched while solving. */
  layoutOwner = '';
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
          this.focusLeaf = live;
          this.hydrateActiveLayout();
        }
      }

      if (message.type === 'PATCH') {
        if (
          this.focusLeaf &&
          message.playerName === this.focusLeaf?.playerName
        ) {
          this.focusLeaf =
            this.modelService.leafByAuthor(message.playerName || '') ||
            this.focusLeaf;
          const owner = message.layoutOwner || message.sender;
          if (owner && owner === this.layoutOwner) {
            this.hydrateActiveLayout();
          }
        }
      } else if (message.type === 'SELECT_SOLVE') {
        // Auto-follow = join that player's board while already solving
        if (
          !this.setting &&
          this.focusLeaf &&
          message.playerName !== this.focusLeaf?.playerName
        ) {
          const realPlayer = this.modelService.leafByAuthor(
            message.playerName || ''
          );
          if (realPlayer) {
            this.setSolveLeaf(realPlayer, {
              joinHost: message.sender || undefined,
            });
          }
        }
      }
    });
  }

  /** Push current card UI into layouts[layoutOwner] and PATCH. */
  syncLeafUI() {
    if (!this.focusLeaf) {
      return;
    }
    if (!this.setting && this.layoutOwner) {
      saveLayoutForOwner(this.focusLeaf, this.layoutOwner);
      this.modelService.updateLeafUI(this.focusLeaf, this.layoutOwner);
    } else {
      this.modelService.updateLeafUI(this.focusLeaf);
    }
  }

  /** Apply layouts[layoutOwner] onto focusLeaf.cards for the SVG board. */
  hydrateActiveLayout() {
    if (!this.focusLeaf || this.setting || !this.layoutOwner) {
      return;
    }
    const layout = this.focusLeaf.layouts?.[this.layoutOwner];
    if (layout?.length) {
      applyLayoutToCards(this.focusLeaf, layout);
    }
  }

  /** Put all cards on the heap for arrange (solve). */
  putCardsOnHeap(leaf: Leaf) {
    // Always reassign unique pads — setting-time parking can leave duplicates,
    // which stacks cards and makes the 5th look "missing".
    const pads = leaf.cards.map((_, i) => i);
    this.shuffleInPlace(pads);

    for (let i = 0; i < leaf.cards.length; i++) {
      const card = leaf.cards[i];
      card.heapSlot = pads[i];
      card.guessSlot = -(i + 1);
      card.guessOrientation = 0;
      card.wrong = false;
      card.draggee = undefined;
      card.dragPos = undefined;
    }
    leaf.hasUI = true;
    leaf.solved = false;
  }

  /** Setting start: ring cards (slot 0–3) on the leaf, decoy on the heap. */
  putRingCardsOnLeaf(leaf: Leaf) {
    let heapIndex = 0;
    for (const card of leaf.cards) {
      if (card.slot >= 0 && card.slot < 4) {
        card.guessSlot = card.slot;
        card.guessOrientation = 0;
      } else {
        heapIndex += 1;
        card.guessSlot = -heapIndex;
        card.guessOrientation = 0;
      }
      card.wrong = false;
      card.draggee = undefined;
      card.dragPos = undefined;
    }
    leaf.hasUI = true;
    leaf.solved = false;
  }

  /** Random 4 of 5 cards onto the leaf slots with random rotations (setting). */
  randomizeSettingCards() {
    if (!this.setting || !this.focusLeaf?.cards?.length) {
      return;
    }

    const cards = [...this.focusLeaf.cards];
    this.shuffleInPlace(cards);

    const ring = cards.slice(0, 4);
    const decoy = cards.slice(4);
    const slots = [0, 1, 2, 3];
    this.shuffleInPlace(slots);

    for (let i = 0; i < ring.length; i++) {
      const card = ring[i];
      card.guessSlot = slots[i];
      card.guessOrientation = Math.floor(Math.random() * 4);
      card.wrong = false;
      card.draggee = undefined;
      card.dragPos = undefined;
    }

    for (let i = 0; i < decoy.length; i++) {
      const card = decoy[i];
      card.guessSlot = -(i + 1);
      card.guessOrientation = 0;
      card.wrong = false;
      card.draggee = undefined;
      card.dragPos = undefined;
    }

    this.focusLeaf.solved = false;
  }

  private shuffleInPlace<T>(arr: T[]): void {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  /**
   * Bake the creator's arrangement into canonical slot/words so solvers
   * match against guessSlot === slot and guessOrientation === 0.
   */
  canonicalizeLeafForSubmit(leaf: Leaf): Leaf {
    const placed = leaf.cards.filter(
      (c) => c.guessSlot !== undefined && c.guessSlot >= 0
    );
    const onHeap = leaf.cards.filter(
      (c) => c.guessSlot === undefined || c.guessSlot < 0
    );

    for (const card of placed) {
      const o = (card.guessOrientation || 0) % 4;
      if (o) {
        const w = card.words;
        card.words = [0, 1, 2, 3].map((j) => w[(j - o + 4) % 4]);
      }
      card.slot = card.guessSlot as number;
      card.guessOrientation = 0;
      card.guessSlot = undefined;
      card.dragPos = undefined;
      card.draggee = undefined;
      card.wrong = false;
    }

    for (let i = 0; i < onHeap.length; i++) {
      const card = onHeap[i];
      card.slot = 4 + i;
      card.guessOrientation = 0;
      card.guessSlot = undefined;
      card.dragPos = undefined;
      card.draggee = undefined;
      card.wrong = false;
    }

    // Unique heap pads for solvers (avoids stacked/missing decoy)
    const pads = leaf.cards.map((_, i) => i);
    this.shuffleInPlace(pads);
    for (let i = 0; i < leaf.cards.length; i++) {
      leaf.cards[i].heapSlot = pads[i];
    }

    leaf.hasUI = false;
    leaf.solved = false;
    return leaf;
  }

  initSetting(leaf: Leaf) {
    console.log('initSetting', leaf);
    this.setting = true;
    this.guessing = false;
    this.layoutOwner = '';
    this.putRingCardsOnLeaf(leaf);
    this.focusLeaf = leaf;
  }

  makeNewLeaf() {
    console.log('makeNewLeaf');
    this.focusLeaf = undefined;
    this.layoutOwner = '';
    this.modelService.newLeaf().subscribe((leaf) => {
      this.putRingCardsOnLeaf(leaf);
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
    this.layoutOwner = '';
    this.putRingCardsOnLeaf(leaf);
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
      id: 'guess',
      label: 'Guess',
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

    const cluesReady =
      this.focusLeaf?.clues?.filter((c) => !!c).length === 4;
    buttons.push({
      text: '',
      id: 'upload',
      leaf: null,
      disabled: !(cluesReady && this.canGuess()),
      click: () => {
        if (!this.focusLeaf || !cluesReady || !this.canGuess()) {
          return;
        }
        this.canonicalizeLeafForSubmit(this.focusLeaf);
        this.modelService.uploadLeaf(this.focusLeaf);
        this.focusLeaf = undefined;
        this.setting = false;
        this.router.navigateByUrl('/home');
      },
    });
    return buttons;
  }

  /**
   * Open a leaf for solving.
   * - Default: personal layout (resume layouts[me] or fresh heap).
   * - joinHost: collaborative board sharing that player's layout.
   */
  setSolveLeaf(leaf: Leaf, opts?: SetSolveOpts) {
    this.router.navigateByUrl('/solve');
    this.focusLeaf = leaf;
    this.focusPetal = undefined;
    this.setting = false;

    const live =
      (leaf._id &&
        this.modelService.game?.leaves.find((l) => l._id === leaf._id)) ||
      this.modelService.leafByAuthor(leaf.playerName || '');
    if (live) {
      this.focusLeaf = live;
      leaf = live;
    }

    if (!leaf.layouts) {
      leaf.layouts = {};
    }

    const me = this.modelService.name || '';
    this.layoutOwner = opts?.joinHost || me;

    const existing = this.layoutOwner
      ? leaf.layouts[this.layoutOwner]
      : undefined;

    if (existing?.length) {
      applyLayoutToCards(leaf, existing);
      for (const card of leaf.cards) {
        card.guessOrientation = card.guessOrientation || 0;
      }
    } else {
      this.putCardsOnHeap(leaf);
      if (this.layoutOwner) {
        saveLayoutForOwner(leaf, this.layoutOwner);
        this.modelService.updateLeafUI(leaf, this.layoutOwner);
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

    // Optimistic local tally; server REPORT_GUESS is source of truth after STATE
    const me = this.modelService.name;
    if (me) {
      if (!this.focusLeaf.guesses) {
        this.focusLeaf.guesses = {};
      }
      this.focusLeaf.guesses[me] = (this.focusLeaf.guesses[me] || 0) + 1;
    }
    this.modelService.reportGuess(this.focusLeaf);

    this.focusLeaf.solved = success;
    this.syncLeafUI();

    if (success) {
      this.modelService.reportSolved(this.focusLeaf);
      this.status$.next(StatusEnum.SOLVED);
      this.right();
    } else {
      this.status$.next(StatusEnum.WRONG);
      this.wrong();
    }
  }

  /** Players who have guessed on the focused leaf, highest count first. */
  get guessScoreboard(): { name: string; count: number }[] {
    const guesses = this.focusLeaf?.guesses;
    if (!guesses) {
      return [];
    }
    return Object.keys(guesses)
      .map((name) => ({ name, count: guesses[name] || 0 }))
      .filter((row) => row.count > 0)
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
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
