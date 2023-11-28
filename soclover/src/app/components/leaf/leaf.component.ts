import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ModelService } from '../../model/model.service';
import { Player, SocloverState, Card } from '@soclover/lib-soclover';
import { NgxSpinnerService } from 'ngx-spinner';

import { cloneDeep } from 'lodash';

import { Button, LeafData } from './leafData';
import {
  animate,
  keyframes,
  style,
  transition,
  trigger,
} from '@angular/animations';

@Component({
  selector: 'soclover-leaf',
  templateUrl: './leaf.component.html',
  styleUrls: ['./leaf.component.scss'],
  animations: [
    trigger('transformAnimation0', [
      transition(
        '* => *',
        animate(
          '500ms',
          keyframes([
            style({ transform: '{{ previousTransform0 }}', offset: 0 }),
            style({ transform: '{{ newTransform0 }}', offset: 1.0 }),
          ])
        )
      ),
    ]),
  ],
})
export class LeafComponent extends LeafData implements OnInit, OnDestroy {
  loading = true;
  setting = true;

  dragCard!: Card | null;
  cards: Card[] = [];
  isDragging = false;
  initialX!: number;
  initialY!: number;

  dragElement: any;
  focusPetal: number | undefined;
  textCursor = '|';
  timer: any;
  focusPlayer?: Player;

  clues!: string[];
  guessing = false;

  constructor(
    public modelService: ModelService,
    public elRef: ElementRef,
    private spinner: NgxSpinnerService
  ) {
    super();
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

  ngOnInit() {
    this.setViewportDimensions();
    this.spinner.show();
    // this.init();
  }

  private setViewportDimensions() {
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const scaleFactor = Math.min(viewportHeight, viewportWidth) / 350;
    this.transform = `scale(${scaleFactor})`;
    // console.log('scale', scaleFactor);
    this.dragScaleFactor = 1.0 / scaleFactor;
  }

  ngOnDestroy() {
    null;
    // clearTimeout(this.timer);
  }

  initMyhand() {
    console.log(' INIT MY HAND ');
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
        card.dragPos = cloneDeep(this.heapPos[card.heapSlot]);
        card.guessSlot = -(i + 1);
      }
      player.hand.hasUI = true;
      this.modelService.updateUI(player);
    }

    this.clues = player.clues || [];
    this.makeButtons();
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
        });
      }

      this.buttons.push({
        text: 'New',
        id: 'refresh',
        tag: 'refresh',
        player: null,
      });
    } else {
      for (const player of this.modelService.game?.players || []) {
        let id = 'thinking';
        if (player.name === this.focusPlayer?.name) {
          id = 'solving';
        } else if (player?.clues?.filter((c) => !!c).length === 4) {
          id = 'download';
        }

        this.buttons.push({
          text: player.name || 'Nobody',
          id,
          tag: 'player',
          player: player,
        });
      }
    }
  }

  @HostListener('window:resize', ['$event'])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onResize(event: Event) {
    this.setViewportDimensions();
  }

  selectPetal(petal: number, event: any) {
    this.focusPetal = petal;
    console.log('petal', petal);
    console.log('event', event.target);
    // if (event.target instanceof HTMLElement) {
    //   console.log('focus');

    event.target.focus();
    // }

    event.preventDefault();
    event.stopPropagation();
  }

  catchAllClick(event: any) {
    console.log('catchAllClick', event);
    this.focusPetal = undefined;
  }

  toolClick(card: Card, cmd: 'bin' | 'spin') {
    if (!this.focusPlayer) {
      return;
    }
    if (card && cmd === 'bin') {
      card.guessSlot = -1;
      card.dragPos = this.heapPos[card.heapSlot];
      card.wrong = false;
      this.modelService.updateUI(this.focusPlayer);
    } else if (card && cmd === 'spin') {
      console.log('spin', card);
      card.wrong = false;
      card.guessOrientation = (card.guessOrientation + 1) % 4;
      this.modelService.updateUI(this.focusPlayer);
    }
  }

  cardTransformPosition(card: Card): string {
    if (this.focusPlayer) {
      if (card.draggee) {
        return 'translate(' + card.dragPos?.x + ',' + card.dragPos?.y + ')';
      } else if (card.guessSlot !== undefined && card.guessSlot >= 0) {
        return '';
      } else {
        return (
          'translate(' +
          this.heapPos[card.heapSlot].x +
          ',' +
          this.heapPos[card.heapSlot].y +
          ')'
        );
      }
    }

    return '';
  }

  wordTransformFlip(card: Card, word_i: number): string {
    let slot = 0;

    if (this.focusPlayer) {
      if (card.guessSlot !== undefined && card.guessSlot >= 0) {
        slot = card.guessSlot;
      }
    } else {
      slot = card.slot;
    }

    return (word_i + slot + 1 + card.guessOrientation) % 4 > 1
      ? 'rotate( 180 0 -1)'
      : '';
  }

  cardTransformSpin(card: Card): string {
    if (!this.focusPlayer) {
      return 'rotate(' + card.slot * 90 + ')';
    } else {
      if (!card.draggee) {
        if (card.guessSlot && card.guessSlot >= 0) {
          return 'rotate(' + card.guessSlot * 90 + ')';
        }
      }
    }
    return '';
  }

  zoneTransformSpin(slot: number): string {
    return 'rotate(' + slot * 90 + ')';
  }

  // --- drag and drop ---
  mouseDownCard(event: any, card: Card) {
    if (this.focusPlayer) {
      if (card.guessSlot !== undefined && card.guessSlot >= 0) {
        return;
      }
      console.log('downCard', event, card);
      this.dragCard = card;
      card.draggee = this.modelService.myPlayer?.name || '';
      this.dragElement = event.target;
      this.dragElement.style.pointerEvents = 'none';
      this.isDragging = true;
      this.initialX = event.clientX;
      this.initialY = event.clientY;
      this.setDragDelta(event.clientX, event.clientY);
      this.modelService.updateUI(this.focusPlayer);
      event.preventDefault();
      event.stopPropagation();
    }
  }

  mouseDown(event: any) {
    console.log('down', event);
    event.preventDefault();
    event.stopPropagation();
  }

  // dragStart(event: any) {}

  mouseUp(event: any) {
    if (this.focusPlayer) {
      console.log('up', event);

      if (this.dragElement) {
        this.dragElement.style.pointerEvents = 'auto';
      }

      if (this.dragCard) {
        this.dragCard.draggee = '';
        this.dragCard.dragPos = this.heapPos[this.dragCard.heapSlot];
        this.modelService.updateUI(this.focusPlayer);
      }
    }
    this.dragElement = null;
    this.isDragging = false;

    this.dragCard = null;
    event.preventDefault();
    event.stopPropagation();
  }

  mouseUpCard(event: any, card: Card) {
    console.log('upCard', event);

    if (this.dragCard && this.focusPlayer) {
      this.dragCard.draggee = '';
      this.modelService.updateUI(this.focusPlayer);
    }
    this.isDragging = false;
    this.dragCard = null;
  }

  mouseUpDrop(event: any, zone: number) {
    console.log('upDrop', event);

    if (this.dragCard && this.focusPlayer) {
      console.log('upDrop 2');

      this.dragCard.guessSlot = zone;
      this.dragCard.guessOrientation -= zone || 0;
      this.dragCard.guessOrientation = (this.dragCard.guessOrientation + 4) % 4;
      const bin = this.tools.find((bin) => bin.card === this.dragCard);
      if (bin) {
        bin.card = null;
      }

      this.tools[this.dragCard.guessSlot].card = this.dragCard;
      this.dragCard.draggee = '';
      this.modelService.updateUI(this.focusPlayer);
    }
    this.isDragging = false;
    this.dragCard = null;
  }

  mouseLeave(evt: any) {
    // console.log('leave', evt);
  }

  setDragDelta(newX: number, newY: number) {
    const deltaX = newX - this.initialX;
    const deltaY = newY - this.initialY;
    if (this.dragCard && this.focusPlayer) {
      this.dragCard.dragPos = {
        x:
          (this.heapPos[this.dragCard.heapSlot]?.x || 0) +
          deltaX * this.dragScaleFactor,
        y:
          (this.heapPos[this.dragCard.heapSlot].y || 0) +
          deltaY * this.dragScaleFactor,
      };
      this.modelService.updateUI(this.focusPlayer);
    }
  }

  mouseMove(event: any) {
    if (this.isDragging) {
      console.log('Move', event);
      this.setDragDelta(event.clientX, event.clientY);
    }
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    console.log('Key pressed globally:', event.key, this.focusPetal);
    if (this.focusPetal === undefined) {
      return;
    }

    if (event.key === 'Enter' || event.key === 'Escape') {
      this.focusPetal = undefined;
    } else if (event.key === 'Tab') {
      this.focusPetal = (this.focusPetal + 1) % 4;
    } else if (event.key === 'Delete' || event.key === 'Backspace') {
      console.log('Delete or Backspace key pressed globally');

      if (this.clues[this.focusPetal].length) {
        this.clues[this.focusPetal] = this.clues[this.focusPetal].slice(0, -1);
      }
    } else if (/^[a-zA-Z0-9\s-]$/.test(event.key)) {
      console.log('Printable character pressed globally:', event.key);
      this.clues[this.focusPetal] += event.key;
    } else {
      return;
    }

    this.makeButtons();
    event.preventDefault();
    event.stopPropagation();
  }

  buttonClick(event: unknown, button: Button) {
    console.log('buttonClick', button);
    if (this.setting && button.tag === 'upload') {
      this.modelService.uploadClues(this.clues);
    } else if (this.setting && button.tag === 'refresh') {
      this.focusPlayer = undefined;
      this.modelService.newHand();
    } else if (button.player) {
      if (!this.focusPlayer || this.focusPlayer.name !== button.player.name) {
        this.initSolve({ player: button.player });
        this.modelService.selectSolve(button.player);
      } else {
        this.haveAGo();
        console.log(JSON.stringify(this.cards, null, 2));
        this.guessing = true;
      }
    }
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

  newGame() {
    this.modelService.newHand();
  }
}
