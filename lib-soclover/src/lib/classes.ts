export interface User {
  name?: string;
}

export interface Card {
  words: string[];
  slot: number;

  // shared UI properties

  hasUI: boolean;
  dragPos?: { x: number; y: number };
  heapSlot?: number;
  orientation: number;

  // local UI properties
  heapPos?: { x: number; y: number };
  displaySlot?: number;
  dropZone?: boolean;
}

export const cardUImembers = [
  'slot',
  'hasUI',
  'dragPos',
  'heapSlot',
  'orientation',
  'heapPos',
  'displaySlot',
];

export type Hand = {
  cards: Card[];
};

export type Patch = {
  card: Card;
  name: string;
};

export interface Message {
  sender?: string;
  recipient?: string;
  room?: string;
  type: MessageType;
  clientID?: string;
}
export interface SocloverMessage extends Message {
  seed?: unknown;
  patch?: Patch;
  game?: Game;
  clues?: string[];
  card?: Card;
  playerName?: string;
}

export enum MessageType {
  SEND_LOGON = 'SEND_LOGON',
  SEND_LOGOUT = 'LOGOUT',
  STATE = 'STATE',
  RESET = 'RESET',
  SEED = 'SEED',
  SEND_READY = 'SEND_READY',
  GET_STATE = 'GET_STATE',
  CONNECTION_LOSS = 'CONNECTION_LOSS',
  GET_MYHAND = 'GET_MYHAND',
  LOGON_OK = 'LOGON_OK',
  SEND_CLUES = 'SEND_CLUES',
  NEW_HAND = 'NEW_HAND',
  PATCH = 'PATCH',
}

export enum SocloverStageEnum {
  SETUP = 'SETUP',
  SOLVE = 'SOLVE',
}

export type SocloverState = {
  stage: SocloverStageEnum;
};

export interface Player extends User {
  name?: string;
  hand: Hand;
  clues?: string[];
}

export type Game = {
  players: Player[];
};
