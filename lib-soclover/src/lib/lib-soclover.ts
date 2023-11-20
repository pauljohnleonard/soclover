import { Player } from './player';

export type Card = {
  words: string[];
  orientation: number;
  slot: number;

  // UI properties
  dropZone?: boolean;
  heapPos?: { x: number; y: number };
  dragPos?: { x: number; y: number };
  heapSlot?: number;
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
}

export enum SocloverStageEnum {
  SETUP = 'SETUP',
  SOLVE = 'SOLVE',
}

export type SocloverState = {
  stage: SocloverStageEnum;
};

export type Game = {
  players: Player[];
};
