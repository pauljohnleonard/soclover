import { Injectable } from '@angular/core';
import { Button } from './leafData';
import { ModelService } from './model/model.service';
import { Card, Leaf } from '@soclover/lib-soclover';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
export class UiService {
  showButtons = true;
  guessing = false;
  // cards: Card[] = [];
  loading = true;

  homeButtons: Button[] = [];
  private myButtons: Button[] = [];

  focusPetal: number | undefined;
  focusLeaf!: Leaf | undefined;
  setting = true;
  backButton!: Button;

  constructor(public modelService: ModelService, public router: Router) {
    this.modelService.subject$.subscribe((message) => {
      if (this.modelService.myPlayer) {
        if (this.modelService?.myPlayer?.clues?.length === 4) {
          this.setting = false;
        }
      }

      // Update the focus player
      // if (this.focusLeaf) {
      //   const x = this.modelService.game?.leafs.find(
      //     (player) => player.playerName === this.focusLeaf?.playerName
      //   );

      //   if (x) {
      //     this.focusLeaf = x;
      //   }
      // }

      if (message?.type === 'PATCH') {
        if (
          this.focusLeaf &&
          message.playerName === this.focusLeaf?.playerName
        ) {
          this.setSolveLeaf(this.focusLeaf);
        }
      } else if (message?.type === 'SELECT_SOLVE') {
        if (
          !this.setting &&
          message.playerName !== this.focusLeaf?.playerName
        ) {
          // const realPlayer = this.modelService.game?.leafs.find(
          //   (player) => player.playerName === message.playerName
          // );
          // if (realPlayer) {
          //   this.focusLeaf = realPlayer;
          //   this.setSolveLeaf(this.focusLeaf);
          // }
        }
      }

      this.makeButtons();
    });
  }

  initSetting(leaf: Leaf) {
    console.log('initSetting', leaf);
    this.setting = true;
    this.focusLeaf = leaf;
  }

  makeNewLeaf() {
    console.log('makeNewLeaf');
    this.focusLeaf = undefined;
    this.modelService.newLeaf().subscribe((leaf) => {
      this.focusLeaf = leaf;
      this.setting = true;
      this.router.navigateByUrl('/makeleaf');
    });
  }

  // initSolve() {
  //   this.setting = false;
  //   this.focusLeaf = undefined;
  // }

  makeButtons() {
    console.log('makeButtons', this.focusLeaf);
    this.homeButtons = [];
    this.myButtons = [];

    this.backButton = {
      text: '',
      id: 'home',
      click: () => {
        this.router.navigateByUrl('/home');
      },
      player: null,
    };

    this.myButtons = [this.backButton];

    if (this.focusLeaf?.clues?.filter((c) => !!c).length === 4) {
      this.myButtons.push({
        text: 'Submit',
        id: 'upload',
        player: null,
        click: () => {
          this.focusLeaf ? this.modelService.uploadLeaf(this.focusLeaf) : null;
          this.focusLeaf = undefined;
          this.setting = false;
          this.router.navigateByUrl('/home');
        },
      });
    }

    for (const leaf of this.modelService.game?.leafs || []) {
      const click = () => {
        this.setSolveLeaf(leaf);
        this.modelService.selectSolveLeafBroadcast(leaf);
      };
      const button: Button = {
        text: leaf.playerName || 'Nobody',
        id: 'download',
        player: leaf,
        click,
      };

      this.homeButtons.push(button);
    }
    this.myButtons.push({
      text: 'New',
      id: 'refresh',
      player: null,
      click: () => {
        this.makeNewLeaf();
      },
    });

    this.homeButtons.push({
      text: 'New Game',
      id: 'replay',
      player: null,
      right: true,
      click: () => {
        this.modelService.newGame();
      },
    });
  }

  get solveButtons() {
    const buttons: Button[] = [this.backButton];

    const but: Button = {
      text: 'Guess',
      id: 'solving',
      player: null,
      disabled: !this.canGuess(),
      click: () => {
        this.haveAGo();
        // console.log(JSON.stringify(this.focusLeaf.cards, null, 2));
        this.guessing = true;
      },
    };

    buttons.push(but);

    return buttons;
  }

  // initMyhand(leaf:) {

  //   this.loading = false;
  //   this.uiService.focusLeaf) {
  //   this.makeButtons();
  // }

  setSolveLeaf(leaf: Leaf) {
    this.router.navigateByUrl('/solve');
    this.focusLeaf = leaf;
    this.focusPetal = undefined;
    // this.cards = leaf.cards;

    if (!leaf.hasUI) {
      for (let i = 0; i < 5; i++) {
        const card = this.focusLeaf.cards[i];
        // card.dragPos = cloneDeep(this.heapPos[card.heapSlot]);
        card.guessSlot = -(i + 1);
      }
      leaf.hasUI = true;
      this.modelService.updateLeafUI(leaf);
    }

    // this.clues = leaf.clues || [];
    this.makeButtons();
  }

  canGuess(): boolean {
    return (
      this.focusLeaf?.cards.filter(
        (c) => c.guessSlot !== undefined && c.guessSlot >= 0
      ).length === 4
    );
  }

  haveAGo() {
    let count = 0;
    for (const card of this.focusLeaf?.cards || []) {
      card.wrong = false;
      if (card.guessSlot === undefined || card.guessSlot >= 0) {
        card.wrong =
          card.guessSlot !== card.slot || card.guessOrientation !== 0;
        count++;
      }
    }
    console.log('count', count);
  }

  defaultClues(cards: Card[]) {
    return ['', '', '', ''];

    // return [
    //   `${cards[0].words[1]}-${cards[3].words[2]}`,
    //   `${cards[1].words[1]}-${cards[0].words[2]}`,
    //   `${cards[1].words[2]}-${cards[2].words[1]}`,
    //   `${cards[2].words[2]}-${cards[3].words[1]}`,
    // ];
  }

  get leafViewButtons() {
    if (this.setting) {
      return this.myButtons;
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

      if (this.focusLeaf.clues[this.focusPetal].length) {
        this.focusLeaf.clues[this.focusPetal] = this.focusLeaf.clues[
          this.focusPetal
        ].slice(0, -1);
      }
    } else if (/^[a-zA-Z0-9\s-]$/.test(key)) {
      console.log('Printable character pressed globally:', key);
      this.focusLeaf.clues[this.focusPetal] += key;
    } else {
      return;
    }

    this.makeButtons();
  }
}
