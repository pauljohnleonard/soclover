import {
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { ModelService } from '../../model.service';
import { Card, Leaf } from '@soclover/lib-soclover';
import { NgxSpinnerService } from 'ngx-spinner';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { leafData } from '../../leafData';
import {
  animate,
  keyframes,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { UiService } from '../../ui.service';
import { LayoutService } from '../../layout.service';
import { ConnectionService } from '../../connection.service';

@UntilDestroy()
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
export class LeafComponent implements OnInit, OnDestroy {
  leafData = leafData;
  dragCard!: Card | null;
  containerScale!: string;
  isDragging = false;
  initialX!: number;
  initialY!: number;
  dragElement: any;
  timer: any;
  petalMainTranslate = `translate(0, 68)`;

  constructor(
    public modelService: ModelService,
    public elRef: ElementRef,
    public layoutService: LayoutService,
    private spinner: NgxSpinnerService,
    public uiService: UiService,
    public connection: ConnectionService
  ) {}

  ngOnInit() {
    this.petalMainTranslate = `translate(0, 118)`;
    this.setScaling();

    this.layoutService.subject$
      .pipe(untilDestroyed(this))
      .subscribe((layout) => {
        this.setScaling();
      });

    this.spinner.show();

    console.log('LeafComponent', this.leaf);
  }

  private setScaling() {
    this.containerScale = `scale(${this.layoutService.scaleFactor})`;
    leafData.dragScaleFactor = 1.0 / this.layoutService.scaleFactor;
    // console.log('setScaleFactor', this.containerScale);
  }

  ngOnDestroy() {
    null;
  }

  // SVG layout helpers

  cardTransformPosition(card: Card): string {
    if (!this.uiService.setting) {
      if (card.draggee) {
        return 'translate(' + card.dragPos?.x + ',' + card.dragPos?.y + ')';
      } else if (card.guessSlot !== undefined && card.guessSlot >= 0) {
        return '';
      } else {
        return (
          'translate(' +
          leafData.heapPos[card.heapSlot].x +
          ',' +
          leafData.heapPos[card.heapSlot].y +
          ')'
        );
      }
    }

    return '';
  }

  wordTransformFlip(card: Card, word_i: number): string {
    let slot = 0;

    if (!this.uiService.setting) {
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
    if (this.uiService.setting) {
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

  toolClick(card: Card, cmd: 'bin' | 'spin', event: any) {
    if (!this.uiService.focusLeaf || this.setting) {
      return;
    }

    if (card && cmd === 'bin') {
      card.guessSlot = -1;
      card.dragPos = leafData.heapPos[card.heapSlot];
      card.wrong = false;
      event.preventDefault();
      event.stopPropagation();
    } else if (card && cmd === 'spin') {
      console.log('spin', card);
      card.wrong = false;
      card.guessOrientation = (card.guessOrientation + 1) % 4;
      event.preventDefault();
      event.stopPropagation();
    } else {
      return;
    }

    this.uiService.focusLeaf.solved = false;

    this.modelService.updateLeafUI(this.uiService.focusLeaf);
  }

  // --- drag and drop ---
  mouseDownCard(event: any, card: Card) {
    console.log('downCard', event, card);

    if (this.uiService.focusLeaf) {
      if (card.guessSlot !== undefined && card.guessSlot >= 0) {
        return;
      }

      this.dragCard = card;
      card.draggee = this.connection.name || '';
      this.dragElement = event.target;
      this.dragElement.style.pointerEvents = 'none';
      this.isDragging = true;
      this.initialX = event.clientX;
      this.initialY = event.clientY;
      this.setDragDelta(event.clientX, event.clientY);
      this.modelService.updateLeafUI(this.uiService.focusLeaf);
      event.preventDefault();
      event.stopPropagation();
    }
  }

  // --- drag and drop ---
  touchStartCard(event: any, card: Card) {
    console.log('touchStartCard', event, card);

    if (this.uiService.focusLeaf) {
      if (card.guessSlot !== undefined && card.guessSlot >= 0) {
        return;
      }

      this.dragCard = card;
      card.draggee = this.connection.name || '';
      this.dragElement = event.target;
      this.dragElement.style.pointerEvents = 'none';
      this.isDragging = true;
      this.initialX = event.changedTouches[0].clientX;
      this.initialY = event.changedTouches[0].clientY;
      this.setDragDelta(
        event.changedTouches[0].clientX,
        event.changedTouches[0].clientY
      );
      this.modelService.updateLeafUI(this.uiService.focusLeaf);
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
    this.doDropCard(event, -1);
  }

  mouseUpCard(event: any) {
    console.log('upCard', event);

    if (this.dragCard && this.uiService.focusLeaf) {
      this.dragCard.draggee = '';
      this.modelService.updateLeafUI(this.uiService.focusLeaf);
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

  doDropCard(event: any, zone: number) {
    if (this.dragElement) {
      this.dragElement.style.pointerEvents = 'auto';
      this.dragElement = null;
      event.preventDefault();
      event.stopPropagation();
    }

    if (!this.dragCard || !this.uiService.focusLeaf) return;

    console.log('doDropCard 2');
    if (zone >= 0) {
      this.dragCard.guessSlot = zone;
      this.dragCard.guessOrientation -= zone || 0;
      this.dragCard.guessOrientation = (this.dragCard.guessOrientation + 4) % 4;
      const bin = leafData.tools.find((bin) => bin.card === this.dragCard);
      if (bin) {
        bin.card = null;
      }
    } else {
      this.dragCard.dragPos = leafData.heapPos[this.dragCard.heapSlot];
    }

    if (this.dragCard.guessSlot !== undefined && this.dragCard.guessSlot >= 0) {
      leafData.tools[this.dragCard.guessSlot].card = this.dragCard;
    }
    this.dragCard.draggee = '';
    this.modelService.updateLeafUI(this.uiService.focusLeaf);
  }

  mouseUpDrop(event: any, zone: number) {
    console.log('upDrop', event);

    this.doDropCard(event, zone);
    this.isDragging = false;
    this.dragCard = null;
  }

  mouseMove(event: any) {
    if (this.isDragging) {
      // console.log('Move Dragging', event);
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

    const strSlot = targetElement && targetElement.dataset['slot'];
    if (strSlot !== undefined) {
      const zone = +strSlot;
      console.error('slotIndex', zone);
      this.doDropCard(event, zone);
    } else {
      this.doDropCard(event, -1);
    }

    const strPetal = targetElement && targetElement.dataset['petal'];

    console.log('strPetal', strPetal);
    if (strPetal !== undefined && this.uiService.setting) {
      this.selectPetal(+strPetal, event);
    }

    const strBin = targetElement && targetElement.dataset['bin'];

    if (strBin !== undefined) {
      const card = this.cardInGuessSlot(+strBin);
      this.toolClick(card, 'bin', event);
    }

    const strSpin = targetElement && targetElement.dataset['spin'];

    if (strSpin !== undefined) {
      const card: Card = this.cardInGuessSlot(+strSpin);
      this.toolClick(card, 'spin', event);
    }

    this.isDragging = false;
    this.dragCard = null;
  }

  cardInGuessSlot(slot: number): Card {
    const card = this.uiService.focusLeaf?.cards.find(
      (c) => c.guessSlot === slot
    );

    return card as Card;
  }

  setDragDelta(newX: number, newY: number) {
    const deltaX = newX - this.initialX;
    const deltaY = newY - this.initialY;
    if (this.dragCard && this.uiService.focusLeaf) {
      this.dragCard.dragPos = {
        x:
          (leafData.heapPos[this.dragCard.heapSlot]?.x || 0) +
          deltaX * leafData.dragScaleFactor,
        y:
          (leafData.heapPos[this.dragCard.heapSlot].y || 0) +
          deltaY * leafData.dragScaleFactor,
      };
      this.modelService.updateLeafUI(this.uiService.focusLeaf);
    }
  }

  get isTouch() {
    return this.layoutService.isTouchDevice;
  }
  get focusPlayer() {
    return this.uiService.focusLeaf;
  }

  get leaf(): Leaf | undefined {
    return this.uiService.focusLeaf;
  }

  get cards() {
    if (!this.uiService.focusLeaf) {
      throw new Error('No focusLeaf (get cards)');
    }
    return this.uiService.focusLeaf.cards;
  }

  get sortedCards() {
    if (!this.dragCard) {
      return this.cards;
    }

    const cards = this.cards.filter((c) => c !== this.dragCard);
    cards.push(this.dragCard);

    return cards;
  }

  // get clues() {
  //   return this.uiService.clues;
  // }

  get loading() {
    return this.uiService.loading;
  }

  get focusPetal() {
    return this.uiService.focusPetal;
  }

  get setting() {
    return this.uiService.setting;
  }
}
