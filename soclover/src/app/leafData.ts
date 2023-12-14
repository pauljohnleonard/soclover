import { Card, Leaf } from '@soclover/lib-soclover';

export type Button = {
  text: string; // Displayed text
  id: string; // The id of the button used to select it from the svg ids.
  leaf?: Leaf | null;
  click: () => void; // Action
  disabled?: boolean;
  right?: boolean; // only pne of these
};

export type Tool = {
  spinX: number;
  spinY: number;
  binX: number;
  slot: number;
  binY: number;
  card: Card | null;
};

const cardWidth = 70;

const petalTextWidth = 90;

const petalTextTransformFlip = `rotate(-90) translate(${
  -petalTextWidth / 2
}, 75)`;

const petalTextTransform = `rotate(90) translate(-${petalTextWidth / 2}, -90)`;
export const leafData = {
  cx: 70,
  rad: 35,
  tweakY: 20,
  rHub: 70,
  holeBorder: 20,

  cardWidth,
  cardPad: 2,
  cardRad: 6,
  holeRad: 10,
  fontSize: 7,
  wordNudgeIn: 9,
  wordPad: 6,
  spinX: cardWidth / 2 + 1,
  spinY: cardWidth / 2 + 1,

  binX: 40,

  petalTextHeight: 15,
  petalTextWidth,
  petalTextTransform,
  petalTextTransformFlip,

  petalDatas: [
    { rotate: 'rotate(0)', transform: petalTextTransformFlip, i: 0 },
    { rotate: 'rotate(90)', transform: petalTextTransformFlip, i: 1 },
    { rotate: 'rotate(180)', transform: petalTextTransform, i: 2 },
    { rotate: 'rotate(270)', transform: petalTextTransform, i: 3 },
  ],
  tools: [
    {
      binY: cardWidth * 1.5,
      binX: 0,
      spinY: cardWidth * 1.5,
      spinX: 20,
      slot: 0,
      card: null,
    },
    {
      binX: -cardWidth * 1.5 + 10,
      binY: -10,
      slot: 1,
      card: null,
      spinX: -cardWidth * 1.5 + 10,
      spinY: 10,
    },
    {
      binY: -cardWidth * 1.5,
      binX: 0,
      slot: 2,
      card: null,
      spinY: -cardWidth * 1.5,
      spinX: 20,
    },
    {
      binX: cardWidth * 1.5 + 10,
      binY: -10,
      slot: 3,
      card: null,
      spinY: 10,
      spinX: cardWidth * 1.5 + 10,
    },
  ] as Tool[],
  dragScaleFactor: 1.0,

  clueFontSize: '10px',
  cardFontSize: '10px',
  dropZones: [0, 1, 2, 3],

  boardWidth: 240,
  boardHeight: 500,

  heapPos: [
    { x: -70, y: -190 },
    { x: 70, y: -190 },
    { x: -70, y: 90 },
    { x: 70, y: 90 },
    { x: 0, y: 140 },
  ],
};
