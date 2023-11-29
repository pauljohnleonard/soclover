import { Injectable } from '@angular/core';
import { Button } from './components/leaf/leafData';
import { ModelService } from './model/model.service';
import { Card, Player } from '@soclover/lib-soclover';

@Injectable({
  providedIn: 'root',
})
export class UiService {
  focusPetal: number | undefined;
  showButtons = true;
  guessing = false;
  cards: Card[] = [];
  loading = true;
  clues!: string[];
  buttons: Button[] = [];
  focusPlayer?: Player;
  setting = true;
  isFullScreen = false;

  constructor(public modelService: ModelService) {
    this.openFullscreen();
    this.modelService.subject$.subscribe((message) => {
      if (this.modelService.myPlayer) {
        if (this.modelService?.myPlayer?.clues?.length === 4) {
          this.setting = false;
        }
      }

      // Update the focus player
      if (this.focusPlayer) {
        const x = this.modelService.game?.players.find(
          (player) => player.name === this.focusPlayer?.name
        );

        if (x) {
          this.focusPlayer = x;
        }
      }

      if (message?.type === 'STATE' && !this.focusPlayer) {
        this.initMyhand();
      } else if (message?.type === 'PATCH') {
        if (this.focusPlayer && message.playerName === this.focusPlayer?.name) {
          this.initSolve({ player: this.focusPlayer });
        }
      } else if (message?.type === 'SELECT_SOLVE') {
        if (!this.setting && message.playerName !== this.focusPlayer?.name) {
          const realPlayer = this.modelService.game?.players.find(
            (player) => player.name === message.playerName
          );

          if (realPlayer) {
            this.focusPlayer = realPlayer;
            this.initSolve({ player: this.focusPlayer });
          }
        }
      }

      this.makeButtons();
    });
  }

  makeButtons() {
    this.buttons = [];

    if (this.setting) {
      if (this.clues?.filter((c) => !!c).length === 4) {
        this.buttons.push({
          text: 'Submit',
          id: 'upload',
          tag: 'upload',
          player: null,
          click: () => {
            this.modelService.uploadClues(this.clues);
          },
        });
      }

      this.buttons.push({
        text: 'New',
        id: 'refresh',
        tag: 'refresh',
        player: null,
        click: () => {
          this.focusPlayer = undefined;
          this.modelService.newHand();
        },
      });
    } else {
      for (const player of this.modelService.game?.players || []) {
        let id = 'thinking';
        if (player.name === this.focusPlayer?.name) {
          id = 'solving';
        } else if (player?.clues?.filter((c) => !!c).length === 4) {
          id = 'download';
        }
        const click = () => {
          if (!this.focusPlayer || this.focusPlayer.name !== player.name) {
            this.initSolve({ player });
            this.modelService.selectSolve(player);
          } else {
            this.haveAGo();
            console.log(JSON.stringify(this.cards, null, 2));
            this.guessing = true;
          }
        };
        const button: Button = {
          text: player.name || 'Nobody',
          id,
          tag: 'player',
          player: player,
          click,
        };

        this.buttons.push(button);
      }
    }
  }

  initMyhand() {
    this.focusPlayer = undefined;
    if (this.modelService.myPlayer?.hand) {
      this.cards = this.modelService.myPlayer.hand.cards.slice(0, 4);
      this.clues = this.defaultClues(this.cards);
    }
    this.loading = false;

    this.makeButtons();
  }

  initSolve({ player }: { player: Player }) {
    this.focusPlayer = player;

    this.cards = player.hand.cards;

    if (!player.hand.hasUI) {
      for (let i = 0; i < 5; i++) {
        const card = this.cards[i];
        // card.dragPos = cloneDeep(this.heapPos[card.heapSlot]);
        card.guessSlot = -(i + 1);
      }
      player.hand.hasUI = true;
      this.modelService.updateUI(player);
    }

    this.clues = player.clues || [];
    this.makeButtons();
  }

  haveAGo() {
    let count = 0;
    for (const card of this.cards) {
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
    return [
      `${cards[0].words[1]}-${cards[3].words[2]}`,
      `${cards[1].words[1]}-${cards[0].words[2]}`,
      `${cards[1].words[2]}-${cards[2].words[1]}`,
      `${cards[2].words[2]}-${cards[3].words[1]}`,
    ];
  }

  toggleButtons() {
    this.showButtons = !this.showButtons;
  }

  openFullscreen() {
    const dd = document as any;
    const elem = document.getElementById('world') as any;

    if (!this.isFullScreen) {
      console.log(' FULL SCREEN ');
      if (elem.requestFullscreen) {
        elem.requestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        /* Firefox */
        elem.mozRequestFullScreen();
      } else if (elem.webkitRequestFullscreen) {
        /* Chrome, Safari & Opera */
        elem.webkitRequestFullscreen();
      } else if (elem.msRequestFullscreen) {
        /* IE/Edge */
        elem.msRequestFullscreen();
      }

      // added thos because it was not updating the layout.
      // setTimeout(() => {
      //   this.video.resize(this.vidWidth, window.innerHeight);
      //   this.appDiv.nativeElement.style.width =
      //     window.innerWidth -
      //     this.vidWidth -
      //     this.dividerDiv.nativeElement.style.width +
      //     'px';
      // }, 1000);
      this.isFullScreen = true;
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (dd.mozCancelFullScreen) {
        /* Firefox */
        dd.mozCancelFullScreen();
      } else if (dd.webkitExitFullscreen) {
        /* Chrome, Safari and Opera */
        dd.webkitExitFullscreen();
      } else if (dd.msExitFullscreen) {
        /* IE/Edge */
        dd.msExitFullscreen();
      }
      this.isFullScreen = false;
    }
  }

  handleKeyboardEvent(key: string): void {
    console.log('Key pressed globally:', key, this.focusPetal);
    if (this.focusPetal === undefined) {
      return;
    }

    if (key === 'Enter' || key === 'Escape') {
      this.focusPetal = undefined;
    } else if (key === 'Tab') {
      this.focusPetal = (this.focusPetal + 1) % 4;
    } else if (key === 'Delete' || key === 'Backspace') {
      console.log('Delete or Backspace key pressed globally');

      if (this.clues[this.focusPetal].length) {
        this.clues[this.focusPetal] = this.clues[this.focusPetal].slice(0, -1);
      }
    } else if (/^[a-zA-Z0-9\s-]$/.test(key)) {
      console.log('Printable character pressed globally:', key);
      this.clues[this.focusPetal] += key;
    } else {
      return;
    }

    this.makeButtons();
  }
}
