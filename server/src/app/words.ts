import fs from 'fs';
import path from 'path';

/** One physical game card: Top, Right, Bottom, Left → words[0..3]. */
export type DeckCard = [string, string, string, string];

class Words {
  /** Curated physical cards from Word List.csv */
  allCards!: DeckCard[];
  availCards!: DeckCard[];

  /** Flat unique word pool (e.g. AI fillers), drawn from the same deck */
  allWords!: string[];
  availWords!: { [key: string]: boolean };

  constructor() {
    this.allCards = this.loadDeck();
    this.allWords = this.wordsFromDeck(this.allCards);
    console.log(
      `Loaded ${this.allCards.length} curated cards (${this.allWords.length} unique words)`
    );
    this.makeAvailable();
  }

  loadDeck(): DeckCard[] {
    const assetFolderPath = path.join(__dirname, 'assets');
    const filePath = path.join(assetFolderPath, 'Word List.csv');
    console.log('Loading card deck from', filePath);

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const cards: DeckCard[] = [];

    for (const line of fileContent.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('Card,')) {
        continue;
      }
      const parts = trimmed.split(',');
      if (parts.length < 5) {
        continue;
      }
      // Card,Top,Right,Bottom,Left — preserve curated casing
      const top = parts[1].trim();
      const right = parts[2].trim();
      const bottom = parts[3].trim();
      const left = parts[4].trim();
      if (!top || !right || !bottom || !left) {
        continue;
      }
      cards.push([top, right, bottom, left]);
    }

    if (cards.length < 5) {
      throw new Error(
        `Word List.csv produced only ${cards.length} cards; need at least 5`
      );
    }

    return cards;
  }

  private wordsFromDeck(cards: DeckCard[]): string[] {
    const seen: { [key: string]: boolean } = {};
    const out: string[] = [];
    for (const card of cards) {
      for (const word of card) {
        const key = word.toUpperCase();
        if (!seen[key]) {
          seen[key] = true;
          out.push(word);
        }
      }
    }
    return out;
  }

  makeAvailable() {
    this.availCards = [...this.allCards];
    this.availWords = {};
    this.allWords.forEach((word) => {
      this.availWords[word] = true;
    });
  }

  /** Draw a full curated card (4 faces). Without replacement until the deck is exhausted. */
  randomCard(): string[] {
    if (this.availCards.length === 0) {
      this.makeAvailable();
    }
    const i = Math.floor(Math.random() * this.availCards.length);
    const card = this.availCards.splice(i, 1)[0];
    return [...card];
  }

  /** Single word from the curated vocabulary (AI fillers, etc.). */
  random() {
    let keys = Object.keys(this.availWords);
    if (keys.length === 0) {
      this.makeAvailable();
      keys = Object.keys(this.availWords);
    }

    const ii = Math.floor(Math.random() * keys.length);
    const key = keys[ii];
    delete this.availWords[key];
    return key;
  }
}

export const words = new Words();
