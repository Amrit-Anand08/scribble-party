import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const wordsFilePath = path.join(__dirname, '../data/words.json');

export class WordBank {
  constructor(customWords = null) {
    this.words = [];
    if (Array.isArray(customWords) && customWords.length > 0) {
      this.words = customWords.map(w => w.trim().toLowerCase());
    } else {
      this.loadDefaultWords();
    }
  }

  loadDefaultWords() {
    try {
      const data = fs.readFileSync(wordsFilePath, 'utf-8');
      const parsed = JSON.parse(data);
      const allWords = [];
      for (const category of Object.values(parsed)) {
        if (Array.isArray(category)) {
          allWords.push(...category);
        }
      }
      this.words = Array.from(new Set(allWords.map(w => w.trim().toLowerCase())));
    } catch (err) {
      console.error('[WordBank] Error loading default words file:', err.message);
      this.words = ['cat', 'dog', 'house', 'sun', 'tree', 'car', 'boat', 'star', 'apple', 'pizza'];
    }
  }

  /**
   * Pick n unique words that are not in excludeSet
   * @param {number} n
   * @param {Set<string>} excludeSet
   * @returns {string[]}
   */
  pick(n = 3, excludeSet = new Set()) {
    const available = this.words.filter(w => !excludeSet.has(w));
    const pool = available.length >= n ? available : this.words;

    // Fisher-Yates shuffle copy
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    return shuffled.slice(0, Math.min(n, shuffled.length));
  }
}
