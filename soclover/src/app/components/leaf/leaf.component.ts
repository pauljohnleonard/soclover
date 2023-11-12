import { Component, ElementRef, HostListener, OnInit } from '@angular/core';
import { ModelService } from '../../model/model.service';
import { dropZones } from '../../model/model';
import { cloneDeep } from 'lodash';
import { Card, Hand } from '@soclover/lib-soclover';

type Bin = { binX: number; slot: number; binY: number; card: Card | null };
@Component({
  selector: 'soclover-leaf',
  templateUrl: './leaf.component.html',
  styleUrls: ['./leaf.component.scss'],
})
export class LeafComponent implements OnInit {
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
  hand!: Hand;
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
  dragCard!: Card | null;
  cards: Card[] = [];
  isDragging = false;
  initialX!: number;
  initialY!: number;

  bins: Bin[] = [
    { binY: this.cardWidth * 1.5, binX: 0, slot: 0, card: null },
    { binX: -this.cardWidth * 1.5, binY: 0, slot: 1, card: null },
    { binY: -this.cardWidth * 1.5, binX: 0, slot: 2, card: null },
    { binX: this.cardWidth * 1.5, binY: 0, slot: 3, card: null },
  ];
  dragScaleFactor = 1.0;
  dragElement: any;

  constructor(public modelService: ModelService, public elRef: ElementRef) {
    this.hand = this.modelService.getPuzzle();
    for (let i = 0; i < 5; i++) {
      this.hand.cards[i].heapPos = cloneDeep(this.heapPos[i]);
      this.hand.cards[i].dragPos = cloneDeep(this.heapPos[i]);
      this.hand.cards[i].heapSlot = i + 1;
      this.hand.cards[i].slot = -(i + 1);
    }
    this.modelService.update();
    this.cards = dropZones.concat(this.hand.cards);
  }

  ngOnInit() {
    this.setViewportDimensions();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    this.setViewportDimensions();
  }

  private setViewportDimensions() {
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const scaleFactor = Math.min(viewportHeight, viewportWidth) / 350;
    this.transform = `scale(${scaleFactor})`;
    console.log('scale', scaleFactor);
    this.dragScaleFactor = 1.0 / scaleFactor;
  }

  spinClick(card: Card) {
    console.log('spin', card);
    card.orientation = (card.orientation + 1) % 4;
    this.modelService.update();
  }

  binClick(bin: Bin) {
    const card = bin.card;
    if (card) {
      card.slot = -(card.heapSlot || 0);
      bin.card = null;
      card.dragPos = card.heapPos;
      this.modelService.update();
    }
  }

  // --- drag and drop ---
  mouseDownCard(event: any, card: Card) {
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

  mouseUpCard(event: any, card: Card) {
    console.log('upCard', event);

    if (card.dropZone && this.dragCard) {
      this.dragCard.slot = card.slot;
      this.dragCard.orientation -= card.slot;
      this.dragCard.orientation = (this.dragCard.orientation + 4) % 4;
      const bin = this.bins.find((bin) => bin.card === this.dragCard);
      if (bin) {
        bin.card = null;
      }
      this.bins[this.dragCard.slot].card = this.dragCard;
      this.modelService.update();
    }
    this.isDragging = false;
    this.dragCard = null;
  }

  mouseLeave(evt: any) {
    console.log('leave', evt);
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
}
