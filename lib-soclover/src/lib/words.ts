// eslint-disable-next-line @typescript-eslint/no-var-requires
const fs = require('fs');

class Words {
  allWords!: Array<string>;
  availWords!: { [key: string]: any };

  constructor() {
    // console.log(process.env.PWD);
    const str = fs.readFileSync('lib-soclover/src/assets/words.txt', 'utf-8');
    this.allWords = str.split('\n');
    console.log(` Using a set of ${this.allWords.length} words `);
  }

  makeAvaliable() {
    this.availWords = {};
    this.allWords.forEach((word) => {
      this.availWords[word] = true;
    });
  }
  random() {
    let keys = Object.keys(this.availWords);
    if (keys.length === 0) {
      this.makeAvaliable();
      keys = Object.keys(this.availWords);
    }

    const ii = Math.floor(Math.random() * keys.length);
    const key = keys[ii];
    delete this.availWords[key];
    return key;
  }
}

export const words = new Words();