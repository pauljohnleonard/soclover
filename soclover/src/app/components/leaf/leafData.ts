import { Card, Hand, Player } from '@soclover/lib-soclover';

export type Button = {
  text: string;
  id: string;
  tag: string;
  player: Player | null;
  click: () => void;
};

export type Tool = {
  spinX: number;
  spinY: number;
  binX: number;
  slot: number;
  binY: number;
  card: Card | null;
};

export class LeafData {
  cx = 70;
  rad = 35;
  tweakY = 20;
  rHub = 70;
  holeBorder = 20;
  containerScale!: string;
  cardWidth = 70;
  cardPad = 2;
  cardRad = 6;
  holeRad = 10;
  fontSize = 7;
  wordNudgeIn = 9;
  wordPad = 6;
  spinX = this.cardWidth / 2 + 1;
  spinY = this.cardWidth / 2 + 1;

  binX = 40;

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
  tools: Tool[] = [
    {
      binY: this.cardWidth * 1.5,
      binX: 0,
      spinY: this.cardWidth * 1.5,
      spinX: 20,
      slot: 0,
      card: null,
    },
    {
      binX: -this.cardWidth * 1.5 + 10,
      binY: -10,
      slot: 1,
      card: null,
      spinX: -this.cardWidth * 1.5 + 10,
      spinY: 10,
    },
    {
      binY: -this.cardWidth * 1.5,
      binX: 0,
      slot: 2,
      card: null,
      spinY: -this.cardWidth * 1.5,
      spinX: 20,
    },
    {
      binX: this.cardWidth * 1.5 + 10,
      binY: -10,
      slot: 3,
      card: null,
      spinY: 10,
      spinX: this.cardWidth * 1.5 + 10,
    },
  ];
  dragScaleFactor = 1.0;

  clueFontSize = '10px';
  cardFontSize = '10px';
  dropZones = [0, 1, 2, 3];

  boardWidth = 240;
  boardHeight = 500;
  petalMainTranslate = `translate(0, 68)`;
  heapPos = [
    { x: -70, y: -190 },
    { x: 70, y: -190 },
    { x: -70, y: 90 },
    { x: 70, y: 90 },
    { x: 0, y: 140 },
  ];
}
