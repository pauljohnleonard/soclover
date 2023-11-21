import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ModelService } from '../../model/model.service';
import { SocloverState, UICard, UIHand } from '@soclover/lib-soclover';
import { NgxSpinnerService } from 'ngx-spinner';

// enum State {
//   Setup = 'Setup',
//   Solve = 'Solve',
// }
type Bin = { binX: number; slot: number; binY: number; card: UICard | null };
@Component({
  selector: 'soclover-leaf',
  templateUrl: './leaf.component.html',
  styleUrls: ['./leaf.component.scss'],
})
export class LeafComponent implements OnInit, OnDestroy {
  loading = true;
  state: SocloverState | null = null;
  cx = 70;
  rad = 35;
  tweakY = 20;
  rHub = 70;
  holeBorder = 20;
  transform!: string;
  cardWidth = 70;
  cardPad = 2;
  cardRad = 6;
  holeRad = 10;
  // hand!: UIHand;
  myHand!: UIHand;
  guessHand!: UIHand;
  fontSize = 7;
  wordNudgeIn = 9;
  wordPad = 6;
  spinX = this.cardWidth / 2 + 1;
  spinY = this.cardWidth / 2 + 1;
  heapPos = [
    { x: 150, y: -100 },
    { x: 150, y: 0 },
    { x: 150, y: 100 },
    { x: 50, y: 100 },
    { x: -50, y: 100 },
  ];
  binX = 40;
  dragCard!: UICard | null;
  cards: UICard[] = [];
  isDragging = false;
  initialX!: number;
  initialY!: number;
  petalTextHeight = 15;
  petalTextWidth = 90;
  petalTextTransform = `rotate(90) translate(-${this.petalTextWidth / 2}, -90)`;
  petalTextTransformFlip = `rotate(-90) translate(${
    -this.petalTextWidth / 2
  }, 75)`;

  petalDatas = [
    { rotate: 'rotate(0)', transform: this.petalTextTransformFlip, i: 0 },
    { rotate: 'rotate(90)', transform: this.petalTextTransformFlip, i: 1 },
    { rotate: 'rotate(180)', transform: this.petalTextTransform, i: 2 },
    { rotate: 'rotate(270)', transform: this.petalTextTransform, i: 3 },
  ];
  bins: Bin[] = [
    { binY: this.cardWidth * 1.5, binX: 0, slot: 0, card: null },
    { binX: -this.cardWidth * 1.5, binY: 0, slot: 1, card: null },
    { binY: -this.cardWidth * 1.5, binX: 0, slot: 2, card: null },
    { binX: this.cardWidth * 1.5, binY: 0, slot: 3, card: null },
  ];
  dragScaleFactor = 1.0;
  dragElement: any;
  clues: string[] = ['Clue 0', 'Clue 1', 'Clue 2', 'Clue3'];
  focusPetal: number | undefined;
  textCursor = '|';
  timer: any;

  constructor(
    public modelService: ModelService,
    public elRef: ElementRef,
    private spinner: NgxSpinnerService
  ) {
    this.modelService.subject$.subscribe(() => {
      if (
        !this.myHand &&
        this.modelService.game?.players.find(
          (player) => (player.name = this.modelService?.user?.name)
        )
      ) {
        this.initMyhand();
      }
    });

    // this.timer = setInterval(() => {
    //   if (this.textCursor) {
    //     this.textCursor = '';
    //   } else {
    //     this.textCursor = '_';
    //   }
    // }, 500);

    this.modelService.update();
  }

  ngOnDestroy() {
    null;
    // clearTimeout(this.timer);
  }

  initMyhand() {
    const hand = this.modelService.game?.players.find(
      (player) => (player.name = this.modelService?.user?.name)
    )?.hand;

    if (!hand) {
      throw Error('hand not set');
    }
    this.myHand = {
      uiCards: hand.cards.map((card) => {
        const uiCard: UICard = {
          card,
          orientation: 0,
          guessSlot: card.slot,
        };
        return uiCard;
      }),
    };

    this.cards = this.myHand.uiCards;
    this.loading = false;
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

  initGuessing() {
    this.initSolve();
    this.loading = false;
    this.spinner.hide();
  }

  // initSetup() {
  //   this.modelService.fetchMyhand();
  // }

  initSolve() {
    // // this.hand = this.modelService.getPuzzle();
    // for (let i = 0; i < 5; i++) {
    //   this.hand.uiCards[i].heapPos = cloneDeep(this.heapPos[i]);
    //   this.hand.uiCards[i].dragPos = cloneDeep(this.heapPos[i]);
    //   this.hand.uiCards[i].heapSlot = i + 1;
    //   this.hand.uiCards[i].guessSlot = -(i + 1);
    // }
    // this.modelService.update();
    // this.cards = dropZones.concat(this.hand.uiCards);
  }

  ngOnInit() {
    this.setViewportDimensions();
    this.spinner.show();
    // this.init();
  }

  @HostListener('window:resize', ['$event'])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onResize(event: Event) {
    this.setViewportDimensions();
  }

  private setViewportDimensions() {
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const scaleFactor = Math.min(viewportHeight, viewportWidth) / 350;
    this.transform = `scale(${scaleFactor})`;
    // console.log('scale', scaleFactor);
    this.dragScaleFactor = 1.0 / scaleFactor;
  }

  spinClick(card: UICard) {
    console.log('spin', card);
    card.orientation = (card.orientation + 1) % 4;
    this.modelService.update();
  }

  binClick(bin: Bin) {
    const card = bin.card;
    if (card) {
      card.guessSlot = -(card.heapSlot || 0);
      bin.card = null;
      card.dragPos = card.heapPos;
      this.modelService.update();
    }
  }

  // --- drag and drop ---
  mouseDownCard(event: any, card: UICard) {
    if (card.dropZone) {
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
      this.modelService.update();
    }

    this.dragElement = null;
    this.isDragging = false;
    this.dragCard = null;
    event.preventDefault();
    event.stopPropagation();
  }

  mouseUpCard(event: any, card: UICard) {
    console.log('upCard', event);

    if (card.dropZone && this.dragCard) {
      this.dragCard.guessSlot = card.guessSlot;
      this.dragCard.orientation -= card.guessSlot;
      this.dragCard.orientation = (this.dragCard.orientation + 4) % 4;
      const bin = this.bins.find((bin) => bin.card === this.dragCard);
      if (bin) {
        bin.card = null;
      }
      this.bins[this.dragCard.guessSlot].card = this.dragCard;
      this.modelService.update();
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
      this.modelService.update();
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

    event.preventDefault();
    event.stopPropagation();
  }
}
