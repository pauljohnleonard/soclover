export interface User {
  name?: string;
}

export interface Card {
  words: string[];
  slot: number;
}

export interface UICard {
  card: Card;
  // UI properties
  dropZone?: boolean;
  heapPos?: { x: number; y: number };
  dragPos?: { x: number; y: number };
  heapSlot?: number;
  orientation: number;
  guessSlot: number;
}

export type UIHand = {
  uiCards: UICard[];
};

export type Hand = {
  cards: Card[];
};

export type Patch = {
  slot?: number;
  dragPos?: { x: number; y: number };
  orientation?: number;
};

export interface Message {
  sender?: string;
  room?: string;
  type: MessageType;
}
export interface SocloverMessage extends Message {
  user?: User;
  seed?: unknown;
  patch?: Patch;
  game?: Game;
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
  ready: boolean;
  hand: Hand;
}

export type Game = {
  players: Player[];
};
