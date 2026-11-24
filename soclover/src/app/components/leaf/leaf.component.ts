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
  /** Slot the drag started from, if the card was on the leaf. */
  dragFromSlot: number | undefined;
  dragOrigin = { x: 0, y: 0 };
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

  wordTransformFlip(card: Card, word_i: number): string {
    let slot = 0;
    const orientation = card.guessOrientation || 0;

    if (card.guessSlot !== undefined && card.guessSlot >= 0) {
      slot = card.guessSlot;
    }

    return (word_i + slot + 1 + orientation) % 4 > 1
      ? 'rotate( 180 0 -1)'
      : '';
  }

  cardTransformSpin(card: Card): string {
    // Keep slot rotation while dragging off the leaf so the card doesn't jump
    if (card.guessSlot !== undefined && card.guessSlot >= 0) {
      return 'rotate(' + card.guessSlot * 90 + ')';
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

  @HostListener('selectstart', ['$event'])
  onSelectStart(event: Event): void {
    event.preventDefault();
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

  toolClick(card: Card, cmd: 'spin', event: any) {
    if (!this.uiService.focusLeaf || !card || cmd !== 'spin') {
      return;
    }

    card.wrong = false;
    card.guessOrientation = (card.guessOrientation + 1) % 4;
    this.uiService.focusLeaf.solved = false;
    this.uiService.syncLeafUI();
    event.preventDefault();
    event.stopPropagation();
  }

  private beginCardDrag(card: Card, clientX: number, clientY: number, target: any) {
    if (!this.uiService.focusLeaf) {
      return;
    }

    // Drags over SVG <text> easily create a native selection highlight
    window.getSelection()?.removeAllRanges();

    this.dragCard = card;
    if (card.guessSlot !== undefined && card.guessSlot >= 0) {
      this.dragFromSlot = card.guessSlot;
      // Placed cards are centered on the leaf; drag from there without a jump
      this.dragOrigin = { x: 0, y: 0 };
    } else {
      this.dragFromSlot = undefined;
      const heap = leafData.heapPos[card.heapSlot] || { x: 0, y: 0 };
      this.dragOrigin = { x: heap.x, y: heap.y };
    }

    card.wrong = false;
    card.draggee = this.connection.name || '';
    card.dragPos = { x: this.dragOrigin.x, y: this.dragOrigin.y };
    this.dragElement = target;
    this.dragElement.style.pointerEvents = 'none';
    this.isDragging = true;
    this.initialX = clientX;
    this.initialY = clientY;
    this.setDragDelta(clientX, clientY);
    this.uiService.syncLeafUI();
  }

  // --- drag and drop ---
  mouseDownCard(event: any, card: Card) {
    console.log('downCard', event, card);
    this.beginCardDrag(card, event.clientX, event.clientY, event.target);
    event.preventDefault();
    event.stopPropagation();
  }

  // --- drag and drop ---
  touchStartCard(event: any, card: Card) {
    console.log('touchStartCard', event, card);
    this.beginCardDrag(
      card,
      event.changedTouches[0].clientX,
      event.changedTouches[0].clientY,
      event.target
    );
    event.preventDefault();
    event.stopPropagation();
  }

  mouseDown(event: any) {
    console.log('down', event);
    event.preventDefault();
    event.stopPropagation();
  }

  // dragStart(event: any) {}

  mouseUp(event: any) {
    console.log('up', event);
    if (!this.isDragging) {
      return;
    }
    this.finishDrop(event, event.clientX, event.clientY);
  }

  mouseUpCard(event: any) {
    console.log('upCard', event);
    if (!this.isDragging) {
      return;
    }
    // May be releasing over an occupied slot — resolve zone from hit target
    this.finishDrop(event, event.clientX, event.clientY);
  }

  private finishDrop(event: any, clientX: number, clientY: number) {
    const zone = this.resolveDropZone(clientX, clientY);
    this.doDropCard(event, zone);
    this.isDragging = false;
    this.dragCard = null;
    this.dragFromSlot = undefined;
  }

  /** Prefer drop-zone dataset; if the pointer is over a placed card, use that slot. */
  private resolveDropZone(clientX: number, clientY: number): number {
    const el = document.elementFromPoint(clientX, clientY);
    let node: Element | null = el;
    while (node) {
      const d = (node as HTMLElement).dataset;
      if (d) {
        if (d['slot'] !== undefined && d['slot'] !== '') {
          return +d['slot'];
        }
        if (d['guessSlot'] !== undefined && d['guessSlot'] !== '') {
          const g = +d['guessSlot'];
          if (!Number.isNaN(g) && g >= 0) {
            return g;
          }
        }
        if (d['spin'] !== undefined && d['spin'] !== '') {
          return +d['spin'];
        }
      }
      node = node.parentElement;
    }
    return -1;
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

    const fromSlot = this.dragFromSlot;
    console.log('doDropCard 2', { zone, fromSlot });

    if (zone >= 0) {
      // Displace any other card already in this slot back to the heap
      const occupant = this.uiService.focusLeaf.cards.find(
        (c) =>
          c !== this.dragCard &&
          c.guessSlot !== undefined &&
          c.guessSlot === zone
      );
      if (occupant) {
        occupant.guessOrientation =
          ((occupant.guessOrientation || 0) + zone) % 4;
        occupant.guessSlot = -1;
        occupant.wrong = false;
        occupant.draggee = undefined;
        const approx = this.approxSlotPos(zone);
        this.parkOnNearestHeap(occupant, approx.x, approx.y);
      }

      // Orientation is absolute on the heap; drop subtracts zone. Moving
      // slot→slot converts via (O + fromSlot - zone).
      let o = this.dragCard.guessOrientation || 0;
      if (fromSlot !== undefined) {
        o = (o + fromSlot - zone + 4) % 4;
      } else {
        o = (o - zone + 4) % 4;
      }
      this.dragCard.guessOrientation = o;
      this.dragCard.guessSlot = zone;
      this.dragCard.dragPos = undefined;
    } else {
      // Off the leaf → nearest free heap spot from release point
      if (fromSlot !== undefined) {
        this.dragCard.guessOrientation =
          ((this.dragCard.guessOrientation || 0) + fromSlot) % 4;
      }
      this.dragCard.guessSlot = -1;
      const from =
        this.dragCard.dragPos ||
        (fromSlot !== undefined
          ? this.approxSlotPos(fromSlot)
          : leafData.heapPos[this.dragCard.heapSlot]);
      this.parkOnNearestHeap(this.dragCard, from.x, from.y);
    }

    this.dragCard.draggee = '';
    this.uiService.focusLeaf.solved = false;
    this.uiService.syncLeafUI();
    this.dragFromSlot = undefined;
  }

  mouseUpDrop(event: any, zone: number) {
    console.log('upDrop', event);
    if (!this.isDragging) {
      return;
    }
    this.doDropCard(event, zone);
    this.isDragging = false;
    this.dragCard = null;
    this.dragFromSlot = undefined;
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

    const touchX = event.changedTouches[0].clientX;
    const touchY = event.changedTouches[0].clientY;
    const targetElement = document.elementFromPoint(touchX, touchY) as any;

    if (this.isDragging) {
      this.finishDrop(event, touchX, touchY);
    }

    const strPetal = targetElement && targetElement.dataset?.['petal'];
    if (strPetal !== undefined && this.uiService.setting) {
      this.selectPetal(+strPetal, event);
    }

    const strSpin = targetElement && targetElement.dataset?.['spin'];
    if (strSpin !== undefined && !this.isDragging) {
      const card: Card = this.cardInGuessSlot(+strSpin);
      this.toolClick(card, 'spin', event);
    }
  }

  cardInGuessSlot(slot: number): Card {
    const card = this.uiService.focusLeaf?.cards.find(
      (c) => c.guessSlot === slot
    );

    return card as Card;
  }

  /** Rough leaf-local position for a slot (same space as heapPos). */
  private approxSlotPos(slot: number): { x: number; y: number } {
    const rad = ((slot * 90 + 45) * Math.PI) / 180;
    const r = 85;
    return { x: Math.cos(rad) * r, y: Math.sin(rad) * r };
  }

  /** Park a card on the nearest heap pad; swap pads if another card owns it. */
  private parkOnNearestHeap(card: Card, fromX: number, fromY: number) {
    const leaf = this.uiService.focusLeaf;
    if (!leaf) {
      return;
    }

    let bestI = card.heapSlot;
    let bestD = Infinity;
    for (let i = 0; i < leafData.heapPos.length; i++) {
      const p = leafData.heapPos[i];
      const d = (p.x - fromX) ** 2 + (p.y - fromY) ** 2;
      if (d < bestD) {
        bestD = d;
        bestI = i;
      }
    }

    const other = leaf.cards.find(
      (c) => c !== card && c.heapSlot === bestI
    );
    if (other) {
      // Keep heapSlot ids unique so solve doesn't stack two cards
      other.heapSlot = card.heapSlot;
      if (other.guessSlot === undefined || other.guessSlot < 0) {
        other.dragPos = {
          x: leafData.heapPos[other.heapSlot].x,
          y: leafData.heapPos[other.heapSlot].y,
        };
      }
    }

    card.heapSlot = bestI;
    card.dragPos = {
      x: leafData.heapPos[bestI].x,
      y: leafData.heapPos[bestI].y,
    };
  }

  setDragDelta(newX: number, newY: number) {
    const deltaX = newX - this.initialX;
    const deltaY = newY - this.initialY;
    if (this.dragCard && this.uiService.focusLeaf) {
      this.dragCard.dragPos = {
        x: this.dragOrigin.x + deltaX * leafData.dragScaleFactor,
        y: this.dragOrigin.y + deltaY * leafData.dragScaleFactor,
      };
      this.uiService.syncLeafUI();
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
