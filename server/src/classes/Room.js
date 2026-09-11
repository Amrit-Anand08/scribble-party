import { Game } from './Game.js';
import { GameResultModel } from '../models/GameResultModel.js';
import { RoomModel } from '../models/RoomModel.js';

export class Room {
  /**
   * @param {Object} options
   * @param {string} options.id - Internal room UUID or code
   * @param {string} options.roomCode - Human friendly 6-char code
   * @param {string} options.hostId - Player ID of host
   * @param {Object} options.settings - Configurable game settings
   * @param {import('socket.io').Server} options.io - Socket.IO server reference
   */
  constructor({ id, roomCode, hostId, settings, io }) {
    this.id = id;
    this.roomCode = roomCode;
    this.hostId = hostId;
    this.settings = {
      maxPlayers: settings?.maxPlayers || 8,
      rounds: settings?.rounds || 3,
      drawTimeSec: settings?.drawTimeSec || 80,
      wordCount: settings?.wordCount || 3,
      hints: settings?.hints ?? 2,
      isPublic: settings?.isPublic || false,
      wordMode: settings?.wordMode || 'normal'
    };
    this.io = io;

    /** @type {Map<string, import('./Player.js').Player>} */
    this.players = new Map(); // key = socketId

    /** @type {Game | null} */
    this.game = null;
    this.status = 'lobby'; // 'lobby' | 'in_progress' | 'finished'
    this.createdAt = new Date();
  }

  getPlayerBySocketId(socketId) {
    return this.players.get(socketId);
  }

  getPlayerById(playerId) {
    for (const player of this.players.values()) {
      if (player.id === playerId) return player;
    }
    return null;
  }

  getAllPlayers() {
    return Array.from(this.players.values());
  }

  addPlayer(player) {
    this.players.set(player.socketId, player);
    if (this.game) {
      this.game.updatePlayerList(this.getAllPlayers());
    }
  }

  removePlayer(socketId) {
    const player = this.players.get(socketId);
    if (!player) return null;

    player.connected = false;
    this.players.delete(socketId);

    // If host left, reassign hostId to the next available player
    if (player.id === this.hostId) {
      const remaining = this.getAllPlayers();
      if (remaining.length > 0) {
        this.hostId = remaining[0].id;
      } else {
        this.hostId = null;
      }
    }

    if (this.game) {
      this.game.updatePlayerList(this.getAllPlayers());
      // If current drawer left during drawing, end round
      if (this.game.currentDrawerId === player.id && (this.game.phase === 'drawing' || this.game.phase === 'choosing')) {
        this.game.endRound('drawer_left');
      }
    }

    return player;
  }

  startGame(requestingPlayerId) {
    if (requestingPlayerId !== this.hostId) {
      throw new Error('Only the host can start the game.');
    }
    if (this.players.size < 2) {
      throw new Error('Need at least 2 players to start.');
    }

    this.status = 'in_progress';

    // Reset player scores & round states
    this.players.forEach(p => {
      p.score = 0;
      p.resetRoundState();
    });

    this.game = new Game({
      settings: this.settings,
      players: this.getAllPlayers(),
      callbacks: {
        onTurnStart: (payload) => this.handleTurnStart(payload),
        onWordChosen: (payload) => this.handleWordChosen(payload),
        onHintReveal: (payload) => this.handleHintReveal(payload),
        onRoundEnd: (payload) => this.handleRoundEnd(payload),
        onGameOver: (leaderboard) => this.handleGameOver(leaderboard),
        getAllPlayers: () => this.getAllPlayers(),
        getDrawerPlayer: () => this.getPlayerById(this.game?.currentDrawerId),
        shouldEndRoundEarly: (guessedIds) => {
          // All active players except drawer have guessed
          const activeGuessers = this.getAllPlayers().filter(
            p => p.connected && p.id !== this.game?.currentDrawerId
          );
          return activeGuessers.length > 0 && activeGuessers.every(p => guessedIds.has(p.id));
        }
      }
    });

    // Update RoomModel status in background
    RoomModel.updateOne({ roomCode: this.roomCode }, { status: 'in_progress' }).catch(() => {});

    this.game.startNextTurn();
  }

  handleTurnStart({ drawerId, round, totalRounds, wordOptions, chooseTimeSec }) {
    // Reset round states
    this.players.forEach(p => {
      p.resetRoundState();
      if (p.id === drawerId) {
        p.isDrawing = true;
      }
    });

    const drawer = this.getPlayerById(drawerId);

    // Send word options ONLY to the drawer
    if (drawer) {
      this.io.to(drawer.socketId).emit('round_start', {
        drawerId,
        round,
        totalRounds,
        wordOptions,
        chooseTimeSec
      });
    }

    // Broadcast to everyone else that drawer is choosing
    this.broadcastToOthers(drawer?.socketId, 'round_start_broadcast', {
      drawerId,
      drawerName: drawer?.name || 'Drawer',
      round,
      totalRounds,
      chooseTimeSec
    });

    this.broadcastGameState();
  }

  handleWordChosen({ drawerId, wordLength, blanks, deadlineTimestamp, drawTimeSec, word }) {
    const drawer = this.getPlayerById(drawerId);

    // Confirm to drawer with actual word
    if (drawer) {
      this.io.to(drawer.socketId).emit('game_state', {
        phase: 'drawing',
        round: this.game.round,
        totalRounds: this.game.totalRounds,
        drawerId,
        drawerName: drawer.name,
        word, // ONLY drawer gets this
        wordLength,
        blanks: word,
        deadlineTimestamp
      });
    }

    // Broadcast masked word to everyone else
    this.broadcastToOthers(drawer?.socketId, 'game_state', {
      phase: 'drawing',
      round: this.game.round,
      totalRounds: this.game.totalRounds,
      drawerId,
      drawerName: drawer?.name || 'Drawer',
      wordLength,
      blanks,
      deadlineTimestamp
    });
  }

  handleHintReveal({ revealedIndices, blanks }) {
    this.broadcast('hint_reveal', { revealedIndices, blanks });
  }

  handleRoundEnd({ reason, word, leaderboard, nextDrawerId }) {
    this.players.forEach(p => p.resetRoundState());

    const nextDrawer = this.getPlayerById(nextDrawerId);

    this.broadcast('round_end', {
      reason,
      word,
      scores: this.getAllPlayers().reduce((acc, p) => ({ ...acc, [p.id]: p.score }), {}),
      leaderboard,
      nextDrawerId,
      nextDrawerName: nextDrawer?.name || 'Next Player'
    });

    this.broadcastGameState();
  }

  handleGameOver(leaderboard) {
    this.status = 'finished';
    const winner = leaderboard[0] || null;

    this.broadcast('game_over', {
      winnerId: winner?.id || null,
      winnerName: winner?.name || 'Nobody',
      leaderboard
    });

    this.broadcastGameState();

    // Persist to Mongo in background
    this.saveGameResult(leaderboard);
    RoomModel.updateOne({ roomCode: this.roomCode }, { status: 'finished' }).catch(() => {});
  }

  async saveGameResult(leaderboard) {
    try {
      await GameResultModel.create({
        roomCode: this.roomCode,
        settingsSnapshot: this.settings,
        players: leaderboard.map(l => ({
          name: l.name,
          finalScore: l.score,
          place: l.place
        })),
        rounds: this.game?.roundGuessesLog || []
      });
    } catch (err) {
      console.warn('[Room] Failed to persist GameResult to MongoDB:', err.message);
    }
  }

  /**
   * The ONLY method that calls io.to(roomId).emit(...)
   */
  broadcast(event, payload) {
    this.io.to(this.id).emit(event, payload);
  }

  broadcastToOthers(excludedSocketId, event, payload) {
    if (!excludedSocketId) {
      this.broadcast(event, payload);
      return;
    }
    for (const [socketId] of this.players) {
      if (socketId !== excludedSocketId) {
        this.io.to(socketId).emit(event, payload);
      }
    }
  }

  broadcastGameState() {
    for (const [socketId] of this.players) {
      this.io.to(socketId).emit('game_state', this.toPublicState(socketId));
    }
  }

  /**
   * Serializes room state safely for a recipient, never leaking raw word to non-drawers
   */
  toPublicState(recipientSocketId) {
    const recipient = this.players.get(recipientSocketId);
    const isDrawer = this.game && recipient && this.game.currentDrawerId === recipient.id;

    return {
      roomId: this.id,
      roomCode: this.roomCode,
      hostId: this.hostId,
      settings: this.settings,
      status: this.status,
      players: this.getAllPlayers().map(p => p.toPublic()),
      game: this.game
        ? {
            phase: this.game.phase,
            round: this.game.round,
            totalRounds: this.game.totalRounds,
            drawerId: this.game.currentDrawerId,
            wordLength: this.game.currentWord ? this.game.currentWord.length : 0,
            blanks: isDrawer ? this.game.currentWord : this.game.getMaskedWord(),
            word: isDrawer ? this.game.currentWord : undefined, // ONLY for drawer
            deadlineTimestamp: this.game.deadlineTimestamp,
            drawTimeSec: this.game.settings.drawTimeSec
          }
        : null
    };
  }

  cleanup() {
    if (this.game) {
      this.game.cleanup();
    }
  }
}
