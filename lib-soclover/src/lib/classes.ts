export interface User {
  name?: string;
}

export interface Card {
  words: string[];
  slot: number;
  heapSlot: number;

  // shared UI properties
  dragPos?: { x: number; y: number };
  guessOrientation: number;
  guessSlot?: number;
  draggee?: string;

  // local hacks
  wrong: boolean;
}

export const cardUImembers = [
  'slot',
  'dragPos',
  'guessOrientation',
  'guessSlot',
  'draggee',
];

export type Hand = {
  hasUI: boolean;
  cards: Card[];
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
  // patch?: Patch;
  game?: Game;
  clues?: string[];
  cards?: Card[];
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
  SELECT_SOLVE = 'SELECT_SOLVE',
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
  focusPlayerName?: string;
  players: Player[];
};
