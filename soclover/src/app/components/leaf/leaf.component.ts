import { Component, HostListener, OnInit } from '@angular/core';
import { ModelService } from '../../model/model.service';
import { Card, Hand, dropZones } from '../../model/model';

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
    [150, -100],
    [150, 0],
    [150, 100],
    [50, 100],
    [-50, 100],
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

  constructor(public modelService: ModelService) {
    this.hand = this.modelService.getPuzzle();
    for (let i = 0; i < 5; i++) {
      this.hand.cards[i].heapPos = this.heapPos[i];
      this.hand.cards[i].dragPos = this.heapPos[i];
      this.hand.cards[i].heapSlot = i + 1;
      this.hand.cards[i].slot = -(i + 1);
    }

    this.cards = dropZones.concat(this.hand.cards);
  }

  generatePolygonPoints(): string {
    const x1 = this.cardPad;
    const y1 = this.cardPad;
    const x2 = this.cardPad + this.holeBorder;
    const y2 = this.cardPad + this.holeBorder;
    const width1 = this.cardWidth - this.cardPad;
    const height1 = this.cardWidth - this.cardPad;
    const width2 = this.cardWidth - this.cardPad * 2 - this.holeBorder * 2;
    const height2 = this.cardWidth - this.cardPad * 2 - this.holeBorder * 2;

    const points = `${x1},${y1} ${x1 + width1},${y1} ${x1 + width1},${
      y1 + height1
    } ${x1},${y1 + height1} ${x1},${y1}`;
    // const holePoints = `${x2},${y2} ${x2 + width2},${y2} ${x2 + width2},${
    //   y2 + height2
    // } ${x2},${y2 + height2}`;

    const holePoints = `${x2},${y2}    ${x2},${y2 + height2}
    ${x2 + width2},${y2 + height2} ${x2 + width2},${y2} ${x2},${y2}`;

    // return holePoints;
    return points + ' ' + holePoints;
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
  }

  mouseDownCard(event: any, card: Card) {
    console.log('downCard', event, card);
    this.dragCard = card;
  }

  mouseDown(event: any) {
    console.log('down', event);
    this.isDragging = true;
    this.initialX = event.clientX;
    this.initialY = event.clientY;
    this.setDragDelta(event);
    event.preventDefault();

    event.stopPropagation();
  }

  mouseUp(evt: any) {
    console.log('up', evt);
    this.isDragging = false;
    this.dragCard = null;
  }

  binClick(bin: Bin) {
    const card = bin.card;
    if (card) {
      card.slot = -(card.heapSlot || 0);
      bin.card = null;
    }
  }

  mouseUpCard(evt: any, card: Card) {
    if (card.dropZone && this.dragCard) {
      this.dragCard.slot = card.slot;
      this.dragCard.orientation -= card.slot;
      this.dragCard.orientation = (this.dragCard.orientation + 4) % 4;
      const bin = this.bins.find((bin) => bin.card === this.dragCard);
      if (bin) {
        bin.card = null;
      }

      this.bins[this.dragCard.slot].card = this.dragCard;
    }
    this.isDragging = false;
    this.dragCard = null;
    console.log('upCard', evt, card);
  }

  mouseLeave(evt: any) {
    console.log('leave', evt);
  }

  setDragDelta(event: any) {
    const deltaX = event.clientX - this.initialX;
    const deltaY = event.clientY - this.initialY;
    if (this.dragCard) {
      this.dragCard.dragPos = [
        this.dragCard?.heapPos?.[0] || 0 + deltaX,
        this.dragCard?.heapPos?.[1] || 0 + deltaY,
      ];
    }
  }
  mouseMove(event: any) {
    if (this.isDragging) {
      console.log('Move', event);
      this.setDragDelta;
    }
  }
  spinClick(card: Card) {
    console.log('spin', card);
    card.orientation = (card.orientation + 1) % 4;
  }
}

console.log('grab', event);
