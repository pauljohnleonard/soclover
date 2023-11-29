import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ModelService } from '../../model/model.service';
import { Card } from '@soclover/lib-soclover';
import { NgxSpinnerService } from 'ngx-spinner';

import { LeafData } from './leafData';
import {
  animate,
  keyframes,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { UiService } from '../../ui.service';
import { LayoutService } from '../../layout.service';

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
  dragCard!: Card | null;

  isDragging = false;
  initialX!: number;
  initialY!: number;
  dragElement: any;

  timer: any;

  constructor(
    public modelService: ModelService,
    public elRef: ElementRef,
    public layoutService: LayoutService,
    private spinner: NgxSpinnerService,
    public uiService: UiService
  ) {
    super();
  }

  ngOnInit() {
    this.layoutService.subject$.pipe(untilDetroy(this), (layout) => {});

    this.setViewportDimensions();
    this.spinner.show();
    // this.init();
  }

  private setViewportDimensions() {
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const scaleFactor = Math.min(
      viewportWidth / this.boardWidth,
      viewportHeight / this.boardHeight
    );
    this.containerScale = `scale(${scaleFactor})`;
    this.dragScaleFactor = 1.0 / scaleFactor;

    // console.log('scaleFactor', scaleFactor);
    // console.log('viewportHeight', viewportHeight);
    // console.log('this.boardHeight', this.boardHeight);
    this.petalMainTranslate = `translate(0, 118)`;
  }

  ngOnDestroy() {
    null;
  }

  // SVG layout helpers

  cardTransformPosition(card: Card): string {
    if (this.uiService.focusPlayer) {
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

    if (this.uiService.focusPlayer) {
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
    if (!this.uiService.focusPlayer) {
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

  // EVENT HANDLERS

  @HostListener('window:resize', ['$event'])
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onResize(event: Event) {
    this.setViewportDimensions();
  }

  @HostListener('document:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    this.uiService.handleKeyboardEvent(event.key);
    event.preventDefault();
    event.stopPropagation();
  }

  selectPetal(petal: number, event: any) {
    this.uiService.focusPetal = petal;
    event.target.focus();
    event.preventDefault();
    event.stopPropagation();
  }

  catchAllClick(event: any) {
    console.log('catchAllClick', event);
    this.uiService.focusPetal = undefined;
  }

  toolClick(card: Card, cmd: 'bin' | 'spin') {
    if (!this.uiService.focusPlayer) {
      return;
    }
    if (card && cmd === 'bin') {
      card.guessSlot = -1;
      card.dragPos = this.heapPos[card.heapSlot];
      card.wrong = false;
      this.modelService.updateUI(this.uiService.focusPlayer);
    } else if (card && cmd === 'spin') {
      console.log('spin', card);
      card.wrong = false;
      card.guessOrientation = (card.guessOrientation + 1) % 4;
      this.modelService.updateUI(this.uiService.focusPlayer);
    }
  }

  // --- drag and drop ---
  mouseDownCard(event: any, card: Card) {
    console.log('downCard', event, card);

    if (this.uiService.focusPlayer) {
      if (card.guessSlot !== undefined && card.guessSlot >= 0) {
        return;
      }

      this.dragCard = card;
      card.draggee = this.modelService.myPlayer?.name || '';
      this.dragElement = event.target;
      this.dragElement.style.pointerEvents = 'none';
      this.isDragging = true;
      this.initialX = event.clientX;
      this.initialY = event.clientY;
      this.setDragDelta(event.clientX, event.clientY);
      this.modelService.updateUI(this.uiService.focusPlayer);
      event.preventDefault();
      event.stopPropagation();
    }
  }

  // --- drag and drop ---
  touchStartCard(event: any, card: Card) {
    console.log('touchStartCard', event, card);

    if (this.uiService.focusPlayer) {
      if (card.guessSlot !== undefined && card.guessSlot >= 0) {
        return;
      }

      this.dragCard = card;
      card.draggee = this.modelService.myPlayer?.name || '';
      this.dragElement = event.target;
      this.dragElement.style.pointerEvents = 'none';
      this.isDragging = true;
      this.initialX = event.changedTouches[0].clientX;
      this.initialY = event.changedTouches[0].clientY;
      this.setDragDelta(
        event.changedTouches[0].clientX,
        event.changedTouches[0].clientY
      );
      this.modelService.updateUI(this.uiService.focusPlayer);
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
    console.log('up', event);
    this.doDropCard();
    event.preventDefault();
    event.stopPropagation();
  }

  mouseUpCard(event: any) {
    console.log('upCard', event);

    if (this.dragCard && this.uiService.focusPlayer) {
      this.dragCard.draggee = '';
      this.modelService.updateUI(this.uiService.focusPlayer);
    }
    this.isDragging = false;
    this.dragCard = null;
  }

  // touchEndCard(event: any, card: Card) {
  //   console.log('touchEndCard', event);

  //   if (this.dragCard && this.uiService.focusPlayer) {
  //     this.dragCard.draggee = '';
  //     this.modelService.updateUI(this.uiService.focusPlayer);
  //   }
  //   this.isDragging = false;
  //   this.dragCard = null;
  // }

  doDropCard(zone?: number) {
    if (this.dragElement) {
      this.dragElement.style.pointerEvents = 'auto';
      this.dragElement = null;
    }

    if (!this.dragCard || !this.uiService.focusPlayer) return;

    console.log('doDropCard 2');

    this.dragCard.guessSlot = zone;
    this.dragCard.guessOrientation -= zone || 0;
    this.dragCard.guessOrientation = (this.dragCard.guessOrientation + 4) % 4;
    const bin = this.tools.find((bin) => bin.card === this.dragCard);
    if (bin) {
      bin.card = null;
    }

    if (zone === undefined) {
      this.dragCard.dragPos = this.heapPos[this.dragCard.heapSlot];
    }

    if (this.dragCard.guessSlot !== undefined) {
      this.tools[this.dragCard.guessSlot].card = this.dragCard;
    }
    this.dragCard.draggee = '';
    this.modelService.updateUI(this.uiService.focusPlayer);
  }

  mouseUpDrop(event: any, zone: number) {
    console.log('upDrop', event);

    this.doDropCard(zone);
    this.isDragging = false;
    this.dragCard = null;
  }

  mouseMove(event: any) {
    console.log('Move', event);

    if (this.isDragging) {
      this.setDragDelta(event.clientX, event.clientY);
    }
  }

  touchMove(event: any) {
    console.log('TouchMove', event);

    if (this.isDragging) {
      this.setDragDelta(
        event.changedTouches[0].clientX,
        event.changedTouches[0].clientY
      );
    }
  }

  touchEnd(event: any) {
    console.log('touchEnd', event);

    // Get the coordinates of the touch end
    const touchX = event.changedTouches[0].clientX;
    const touchY = event.changedTouches[0].clientY;

    // Use document.elementFromPoint to get the element under the touch end position
    const targetElement = document.elementFromPoint(touchX, touchY) as any;

    console.log('Target Element:', targetElement);

    if (targetElement && this.dragCard) {
      event.preventDefault();
      const str = targetElement.dataset['slot'];
      if (str !== undefined) {
        const zone = +str;
        console.error('slotIndex', zone);
        this.doDropCard(zone);
      }
    }

    this.isDragging = false;
    this.dragCard = null;
  }

  setDragDelta(newX: number, newY: number) {
    const deltaX = newX - this.initialX;
    const deltaY = newY - this.initialY;
    if (this.dragCard && this.uiService.focusPlayer) {
      this.dragCard.dragPos = {
        x:
          (this.heapPos[this.dragCard.heapSlot]?.x || 0) +
          deltaX * this.dragScaleFactor,
        y:
          (this.heapPos[this.dragCard.heapSlot].y || 0) +
          deltaY * this.dragScaleFactor,
      };
      this.modelService.updateUI(this.uiService.focusPlayer);
    }
  }

  get isTouch() {
    return this.layoutService.isTouchDevice;
  }
  get focusPlayer() {
    return this.uiService.focusPlayer;
  }

  get cards() {
    return this.uiService.cards;
  }

  get clues() {
    return this.uiService.clues;
  }

  get loading() {
    return this.uiService.loading;
  }
  get focusPetal() {
    return this.uiService.focusPetal;
  }
}
