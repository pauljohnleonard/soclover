import {
  Card,
  Game,
  Leaf,
  SocloverMessage,
  applyPatch,
} from '@soclover/lib-soclover';
import { makeHand } from './makeHand';
import { MongoDB } from './db/db';

export class GameController {
  game: Game;
  videoUrl!: string;
  constructor() {
    this.newGame();
  }

  setFocusPlayer(message: SocloverMessage) {
    if (!message.playerName) {
      return;
    }

    this.game.focusPlayerName = message.playerName;

    if (message.sender) {
      if (!this.game.playerFocus) {
        this.game.playerFocus = {};
      }
      this.game.playerFocus[message.sender] = message.playerName;
    }
  }

  /** Ensure a leaf is in the live room so peers can join and patch. */
  ensureLeafInGame(leaf: Leaf | undefined): Leaf | undefined {
    if (!leaf?.playerName) {
      return leaf;
    }

    // Normalize Mongo ObjectId to string
    if (leaf._id) {
      leaf._id = String(leaf._id);
    }

    const existing = this.findLeaf(leaf);
    if (existing) {
      return existing;
    }

    // Fresh solve UI for newly promoted library leaves
    const promoted: Leaf = {
      ...leaf,
      hasUI: false,
      solved: false,
      submitted: true,
      solvers: leaf.solvers ? [...leaf.solvers] : [],
      guesses: leaf.guesses ? { ...leaf.guesses } : {},
      layouts: leaf.layouts ? { ...leaf.layouts } : {},
    };
    this.game.leaves.push(promoted);
    return promoted;
  }

  /** Increment the sender's guess count on this leaf. */
  async reportGuess(message: SocloverMessage): Promise<Leaf | undefined> {
    const leaf =
      this.findLeaf({
        _id: message.leaf?._id,
        playerName: message.playerName || message.leaf?.playerName,
      }) ||
      (message.leaf ? this.ensureLeafInGame(message.leaf) : undefined);

    if (!leaf || !message.sender) {
      return undefined;
    }

    if (!leaf.guesses) {
      leaf.guesses = {};
    }
    leaf.guesses[message.sender] = (leaf.guesses[message.sender] || 0) + 1;

    if (leaf._id) {
      await MongoDB.instance.setGuesses(String(leaf._id), leaf.guesses);
    }

    return leaf;
  }

  findLeaf(leaf: Partial<Leaf>): Leaf | undefined {
    if (leaf._id) {
      const id = String(leaf._id);
      const byId = this.game.leaves.find((l) => l._id && String(l._id) === id);
      if (byId) {
        return byId;
      }
    }
    if (leaf.playerName) {
      return this.game.leaves.find((l) => l.playerName === leaf.playerName);
    }
    return undefined;
  }

  /** Everyone currently solving this leaf (plus reporter) becomes a solver. */
  async reportSolved(message: SocloverMessage): Promise<Leaf | undefined> {
    const leaf =
      this.findLeaf({
        _id: message.leaf?._id,
        playerName: message.playerName || message.leaf?.playerName,
      }) ||
      (message.leaf ? this.ensureLeafInGame(message.leaf) : undefined);

    if (!leaf?.playerName) {
      return undefined;
    }

    const author = leaf.playerName;
    const solvers = new Set<string>(leaf.solvers || []);

    if (message.sender) {
      solvers.add(message.sender);
    }

    for (const [solver, focusAuthor] of Object.entries(
      this.game.playerFocus || {}
    )) {
      if (focusAuthor === author) {
        solvers.add(solver);
      }
    }

    leaf.solvers = [...solvers];
    leaf.solved = true;

    if (leaf._id) {
      await MongoDB.instance.addSolvers(String(leaf._id), leaf.solvers);
    }

    return leaf;
  }

  clearPlayerFocus(name: string) {
    if (this.game.playerFocus) {
      delete this.game.playerFocus[name];
    }
  }

  reset() {
    null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  newGame() {
    this.game = { leaves: [], playerFocus: {} };
  }

  setPatch(message: SocloverMessage) {
    applyPatch(message, this.game);
    console.log('setPatch', message);
  }

  async addLeafToGame(message: SocloverMessage) {
    if (!message.leaf) {
      return;
    }

    message.leaf.submitted = true;
    if (!message.leaf.guesses) {
      message.leaf.guesses = {};
    }
    if (!message.leaf.layouts) {
      message.leaf.layouts = {};
    }

    const existingIndex = this.game.leaves.findIndex(
      (l) => l.playerName === message.leaf?.playerName
    );
    if (existingIndex >= 0) {
      this.game.leaves[existingIndex] = message.leaf;
    } else {
      this.game.leaves.push(message.leaf);
    }

    await MongoDB.instance.saveHand(message.leaf);
  }

  playerLeave(name: string) {
    this.clearPlayerFocus(name);
    this.game.leaves = this.game.leaves.filter(
      (item) => item.playerName !== name
    );
  }

  newLeaf(playerName: string): Leaf {
    const cards: Card[] = makeHand();
    const newLeaf: Leaf = {
      playerName,
      cards,
      clues: ['', '', '', ''],
      submitted: false,
    };

    return newLeaf;
  }

  leafFromPlayerName(name: string): Leaf {
    for (const leaf of this.game.leaves) {
      if (leaf.playerName === name) {
        return leaf;
      }
    }
    throw Error(` ${name} was not found in players `);
  }
}
