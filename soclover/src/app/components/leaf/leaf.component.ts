import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ModelService } from '../../model/model.service';
import { Player, SocloverState, Card, Hand } from '@soclover/lib-soclover';
import { NgxSpinnerService } from 'ngx-spinner';

import { cloneDeep } from 'lodash';
import { dropZones } from '../../model/model';
import { Button, LeafData, Tool } from './leafData';
import {
  animate,
  keyframes,
  style,
  transition,
  trigger,
} from '@angular/animations';
// enum State {
//   Setup = 'Setup',
//   Solve = 'Solve',
// }

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
  state: SocloverState | null = null;

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

  constructor(
    public modelService: ModelService,
    public elRef: ElementRef,
    private spinner: NgxSpinnerService
  ) {
    super();
    this.modelService.subject$.subscribe((message) => {
      if (message?.type === 'STATE' && !this.focusPlayer) {
        this.initMyhand();
      } else if (message?.type === 'PATCH') {
        if (this.focusPlayer && message.playerName === this.focusPlayer?.name) {
          this.initSolve({ player: this.focusPlayer, patching: true });
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
      this.cards = this.modelService.myPlayer.hand.cards;

      this.cards.forEach((card) => {
        card.displaySlot = card.slot;
      });
    }
    this.loading = false;
    this.clues = ['', '', '', ''];
    this.makeButtons();
  }

  initSolve({ player, patching }: { player: Player; patching: boolean }) {
    this.focusPlayer = player;
    const cards: Card[] = cloneDeep(player.hand.cards);

    for (let i = 0; i < 5; i++) {
      const card = cards[i];
      if (!card.hasUI) {
        card.heapPos = cloneDeep(this.heapPos[i]);
        card.dragPos = cloneDeep(this.heapPos[i]);
        card.heapSlot = i + 1;
        card.displaySlot = -(i + 1);
        card.hasUI = true;
        if (!patching) {
          this.modelService.updateUI(card, player);
        }
      }
    }

    this.clues = player.clues || [];
    // console.log('initSolve', JSON.stringify(hand, null, 2));
    // this.modelService.updateUI(this.clues, this.focusPlayer);

    this.cards = dropZones.concat(cards);
  }

  makeButtons() {
    this.buttons = [];

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

    for (const player of this.modelService.game?.players || []) {
      this.buttons.push({
        text: player.name || 'Nobody',
        id:
          player?.clues?.filter((c) => !!c).length === 4
            ? 'download'
            : 'thinking',
        tag: 'player',
        player: player,
      });
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
    event.preventDefault();
    event.stopPropagation();
  }

  catchAllClick(event: any) {
    console.log('catchAllClick', event);
    this.focusPetal = undefined;
  }

  toolClick(tool: Tool, cmd: 'bin' | 'spin') {
    const card = tool.card;
    if (card && cmd === 'bin') {
      card.displaySlot = -(card.heapSlot || 0);
      tool.card = null;
      card.dragPos = card.heapPos;
      this.modelService.updateUI(card, this.focusPlayer);
    } else if (card && cmd === 'spin') {
      console.log('spin', card);
      card.orientation = (card.orientation + 1) % 4;
      this.modelService.updateUI(card, this.focusPlayer);
    }
  }

  // --- drag and drop ---
  mouseDownCard(event: any, card: Card) {
    if (
      card.dropZone ||
      (card.displaySlot !== undefined && card.displaySlot >= 0)
    ) {
      return;
    }
    console.log('downCard', event, card);
    this.dragCard = card;
    this.dragElement = event.target;
    this.dragElement.style.pointerEvents = 'none';
  }

  mouseDown(event: any) {
    console.log('down', event);
    this.isDragging = true;
    this.initialX = event.clientX;
    this.initialY = event.clientY;
    this.setDragDelta(event.clientX, event.clientY);
    event.preventDefault();
    event.stopPropagation();
  }

  // dragStart(event: any) {}

  mouseUp(event: any) {
    console.log('up', event);

    if (this.dragElement) {
      this.dragElement.style.pointerEvents = 'auto';
    }

    if (this.dragCard) {
      this.dragCard.dragPos = this.dragCard.heapPos;
      this.modelService.updateUI(this.dragCard, this.focusPlayer);
    }

    this.dragElement = null;
    this.isDragging = false;
    this.dragCard = null;
    event.preventDefault();
    event.stopPropagation();
  }

  mouseUpCard(event: any, card: Card) {
    console.log('upCard', event);

    if (card.dropZone && this.dragCard) {
      console.log('upCard 2');

      this.dragCard.displaySlot = card.displaySlot;
      this.dragCard.orientation -= card.displaySlot || 0;
      this.dragCard.orientation = (this.dragCard.orientation + 4) % 4;
      const bin = this.tools.find((bin) => bin.card === this.dragCard);
      if (bin) {
        bin.card = null;
      }
      if (this.dragCard.displaySlot) {
        this.tools[this.dragCard.displaySlot].card = this.dragCard;
      }
      this.modelService.updateUI(card, this.focusPlayer);
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
    if (this.dragCard) {
      this.dragCard.dragPos = {
        x: (this.dragCard?.heapPos?.x || 0) + deltaX * this.dragScaleFactor,
        y: (this.dragCard?.heapPos?.y || 0) + deltaY * this.dragScaleFactor,
      };
      this.modelService.updateUI(this.dragCard, this.focusPlayer);
    }
  }

  mouseMove(event: any) {
    if (this.isDragging) {
      // console.log('Move', event);
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
    if (button.tag === 'upload') {
      this.modelService.uploadClues(this.clues);
    } else if (button.tag === 'refresh') {
      this.modelService.newHand();
    } else if (button.player) {
      this.initSolve({ player: button.player, patching: false });
    } else {
      console.log('buttonClick', ' FIXME');
    }
  }

  newGame() {
    this.modelService.newHand();
  }
}
