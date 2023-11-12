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

export type SocloverMessage = {
  sender?: string;
  room?: string;
  type: MessageType;
  patch?: Patch;
};

export enum MessageType {
  SEND_LOGON = 'SEND_LOGON',
  SEND_LOGOUT = 'LOGOUT',
}
