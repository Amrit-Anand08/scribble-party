import { WordBank } from './WordBank.js';

export function normalizeWord(str) {
  if (typeof str !== 'string') return '';
  return str.trim().toLowerCase().replace(/\s+/g, ' ');
}

export class Game {
  /**
   * @param {Object} options
   * @param {Object} options.settings
   * @param {Player[]} options.players
   * @param {Object} options.callbacks - Notification hooks for Room/broadcaster
   */
  constructor({ settings, players, callbacks = {} }) {
    this.settings = {
      rounds: settings?.rounds || 3,
      drawTimeSec: settings?.drawTimeSec || 80,
      wordCount: settings?.wordCount || 3,
      hints: settings?.hints ?? 2,
      wordMode: settings?.wordMode || 'normal'
    };

    this.callbacks = callbacks;
    this.wordBank = new WordBank();
    this.usedWords = new Set();

    // Order of drawers
    this.drawerOrder = players.map(p => p.id);
    this.currentDrawerPointer = -1; // incremented before each turn

    this.round = 1; // 1 to settings.rounds
    this.totalRounds = this.settings.rounds;

    this.currentDrawerId = null;
    this.currentWord = null;
    this.wordOptions = [];
    this.strokes = []; // Stroke history for replay
    this.revealedIndices = new Set();
    this.guessedPlayerIds = new Set();
    this.roundGuessesLog = []; // for GameResult snapshot

    this.phase = 'waiting'; // 'choosing' | 'drawing' | 'round_end' | 'game_over'
    this.deadlineTimestamp = null;
    this.roundStartTime = null;

    this.timerHandle = null;
    this.hintTimerHandles = [];
    this.intermissionTimerHandle = null;
  }

  updatePlayerList(players) {
    const currentActiveIds = new Set(players.filter(p => p.connected).map(p => p.id));
    this.drawerOrder = this.drawerOrder.filter(id => currentActiveIds.has(id));
    // Add any new players to the end of the order
    for (const p of players) {
      if (!this.drawerOrder.includes(p.id) && p.connected) {
        this.drawerOrder.push(p.id);
      }
    }
  }

  /**
   * Starts the next player's drawing turn or increments round
   */
  startNextTurn() {
    this.clearAllTimers();
    this.strokes = [];
    this.revealedIndices.clear();
    this.guessedPlayerIds.clear();
    this.currentWord = null;

    if (this.drawerOrder.length === 0) {
      this.phase = 'game_over';
      if (this.callbacks.onGameOver) this.callbacks.onGameOver(this.getLeaderboard());
      return;
    }

    this.currentDrawerPointer++;
    if (this.currentDrawerPointer >= this.drawerOrder.length) {
      this.currentDrawerPointer = 0;
      this.round++;
    }

    if (this.round > this.totalRounds) {
      this.phase = 'game_over';
      if (this.callbacks.onGameOver) this.callbacks.onGameOver(this.getLeaderboard());
      return;
    }

    this.currentDrawerId = this.drawerOrder[this.currentDrawerPointer];
    this.phase = 'choosing';
    this.wordOptions = this.wordBank.pick(this.settings.wordCount, this.usedWords);

    if (this.callbacks.onTurnStart) {
      this.callbacks.onTurnStart({
        drawerId: this.currentDrawerId,
        round: this.round,
        totalRounds: this.totalRounds,
        wordOptions: this.wordOptions,
        chooseTimeSec: 15
      });
    }

    // Auto-choose if drawer doesn't pick word within 15 seconds
    this.timerHandle = setTimeout(() => {
      if (this.phase === 'choosing') {
        const fallbackWord = this.wordOptions[0] || 'apple';
        this.chooseWord(this.currentDrawerId, fallbackWord);
      }
    }, 15000);
  }

  /**
   * Drawer selects a word
   */
  chooseWord(drawerId, chosenWord) {
    if (this.phase !== 'choosing' || this.currentDrawerId !== drawerId) {
      return false;
    }

    this.clearAllTimers();
    this.currentWord = chosenWord.trim();
    this.usedWords.add(this.currentWord.toLowerCase());
    this.phase = 'drawing';
    this.roundStartTime = Date.now();
    this.deadlineTimestamp = Date.now() + this.settings.drawTimeSec * 1000;

    this.scheduleHints();

    // Round countdown timer
    this.timerHandle = setTimeout(() => {
      this.endRound('time_up');
    }, this.settings.drawTimeSec * 1000);

    if (this.callbacks.onWordChosen) {
      this.callbacks.onWordChosen({
        drawerId: this.currentDrawerId,
        wordLength: this.currentWord.length,
        blanks: this.getMaskedWord(),
        deadlineTimestamp: this.deadlineTimestamp,
        drawTimeSec: this.settings.drawTimeSec,
        word: this.currentWord // for drawer only
      });
    }

    return true;
  }

  scheduleHints() {
    const numHints = Math.min(this.settings.hints, Math.max(0, this.currentWord.length - 1));
    if (numHints <= 0) return;

    const interval = (this.settings.drawTimeSec * 1000) / (numHints + 1);

    for (let i = 1; i <= numHints; i++) {
      const handle = setTimeout(() => {
        if (this.phase === 'drawing') {
          this.revealOneHint();
        }
      }, interval * i);
      this.hintTimerHandles.push(handle);
    }
  }

  revealOneHint() {
    if (!this.currentWord) return;
    const word = this.currentWord;
    const eligibleIndices = [];

    for (let i = 0; i < word.length; i++) {
      if (word[i] !== ' ' && !this.revealedIndices.has(i)) {
        eligibleIndices.push(i);
      }
    }

    if (eligibleIndices.length === 0) return;

    const randomIndex = eligibleIndices[Math.floor(Math.random() * eligibleIndices.length)];
    this.revealedIndices.add(randomIndex);

    if (this.callbacks.onHintReveal) {
      this.callbacks.onHintReveal({
        revealedIndices: Array.from(this.revealedIndices),
        blanks: this.getMaskedWord()
      });
    }
  }

  getMaskedWord() {
    if (!this.currentWord) return '';
    return this.currentWord
      .split('')
      .map((char, index) => {
        if (char === ' ') return ' ';
        if (this.revealedIndices.has(index)) return char;
        return '_';
      })
      .join(' ');
  }

  /**
   * Evaluates a player's guess
   * @returns {{ correct: boolean, points: number, alreadyGuessed: boolean, isDrawer: boolean }}
   */
  checkGuess(player, text) {
    if (this.phase !== 'drawing' || !this.currentWord) {
      return { correct: false, points: 0, alreadyGuessed: false, isDrawer: false };
    }

    if (player.id === this.currentDrawerId) {
      return { correct: false, points: 0, alreadyGuessed: false, isDrawer: true };
    }

    if (this.guessedPlayerIds.has(player.id)) {
      return { correct: false, points: 0, alreadyGuessed: true, isDrawer: false };
    }

    const isCorrect = normalizeWord(text) === normalizeWord(this.currentWord);

    if (isCorrect) {
      this.guessedPlayerIds.add(player.id);
      player.hasGuessedCorrectly = true;

      // Dynamic scoring based on speed and order
      const elapsedSec = (Date.now() - this.roundStartTime) / 1000;
      const remainingRatio = Math.max(0, 1 - elapsedSec / this.settings.drawTimeSec);
      const guessOrder = this.guessedPlayerIds.size; // 1st, 2nd, etc.
      const orderBonus = Math.max(0, 50 - (guessOrder - 1) * 10);
      const points = Math.round(100 + remainingRatio * 300 + orderBonus);

      player.score += points;

      // Drawer also earns points for good drawings that others guess
      if (this.callbacks.getDrawerPlayer) {
        const drawer = this.callbacks.getDrawerPlayer();
        if (drawer) {
          drawer.score += 50;
        }
      }

      this.roundGuessesLog.push({
        playerName: player.name,
        secondsTaken: Math.round(elapsedSec),
        points
      });

      // Check if all active non-drawer guessers have guessed
      if (this.callbacks.shouldEndRoundEarly && this.callbacks.shouldEndRoundEarly(this.guessedPlayerIds)) {
        setTimeout(() => this.endRound('all_guessed'), 800);
      }

      return { correct: true, points, alreadyGuessed: false, isDrawer: false };
    }

    return { correct: false, points: 0, alreadyGuessed: false, isDrawer: false };
  }

  addStroke(stroke) {
    this.strokes.push(stroke);
  }

  undoLastStroke() {
    return this.strokes.pop();
  }

  clearCanvas() {
    this.strokes = [];
  }

  endRound(reason = 'time_up') {
    if (this.phase === 'round_end' || this.phase === 'game_over') return;

    this.clearAllTimers();
    this.phase = 'round_end';

    const wordRevealed = this.currentWord || '';

    if (this.callbacks.onRoundEnd) {
      this.callbacks.onRoundEnd({
        reason,
        word: wordRevealed,
        leaderboard: this.getLeaderboard(),
        nextDrawerId: this.getNextDrawerId()
      });
    }

    // Intermission before next turn (5 seconds)
    this.intermissionTimerHandle = setTimeout(() => {
      this.startNextTurn();
    }, 5000);
  }

  getNextDrawerId() {
    if (this.drawerOrder.length === 0) return null;
    const nextPointer = (this.currentDrawerPointer + 1) % this.drawerOrder.length;
    return this.drawerOrder[nextPointer];
  }

  getLeaderboard() {
    if (this.callbacks.getAllPlayers) {
      const players = this.callbacks.getAllPlayers();
      return [...players]
        .sort((a, b) => b.score - a.score)
        .map((p, idx) => ({
          place: idx + 1,
          id: p.id,
          name: p.name,
          score: p.score
        }));
    }
    return [];
  }

  clearAllTimers() {
    if (this.timerHandle) clearTimeout(this.timerHandle);
    if (this.intermissionTimerHandle) clearTimeout(this.intermissionTimerHandle);
    this.hintTimerHandles.forEach(h => clearTimeout(h));
    this.hintTimerHandles = [];
    this.timerHandle = null;
    this.intermissionTimerHandle = null;
  }

  cleanup() {
    this.clearAllTimers();
  }
}
