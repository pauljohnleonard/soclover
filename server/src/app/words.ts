import fs from 'fs';
import path from 'path';
// eslint-disable-next-line @typescript-eslint/no-var-requires

class Words {
  allWords!: Array<string>;
  availWords!: { [key: string]: boolean };

  constructor() {
    // Rest of the constructor code...

    this.allWords = this.loadAllWords();

    console.log(`Loaded ${this.allWords.length} words`);
    this.makeAvaliable();

    // Rest of the constructor code...
  }

  loadAllWords(): string[] {
    const assetFolderPath = path.join(__dirname, 'assets/');

    console.log(assetFolderPath);

    const files = fs.readdirSync(assetFolderPath);
    console.log(files);
    const words = {};

    files.forEach((file) => {
      if (file.endsWith('.words')) {
        const filePath = assetFolderPath + '/' + file;
        console.log(filePath);
        const stats = fs.statSync(filePath);

        if (stats.isFile()) {
          console.log(`Processing file: ${filePath}`);
          const fileContent = fs.readFileSync(filePath, 'utf-8');
          const list = fileContent.split('\n');
          // console.log(`Found ${words.length} words`);
          for (let word of list) {
            word = word.trim();
            if (word.length > 10) continue;
            word = this.capitalizeWord(word);
            if (!words[word]) {
              words[word] = true;
            }
          }
        }
      }
    });
    return Object.keys(words);
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
    return this.capitalizeWord(key);
  }

  capitalizeWord(word) {
    // Make the first letter uppercase and the rest lowercase
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }
}

export const words = new Words();
