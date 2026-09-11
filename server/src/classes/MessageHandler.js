export class MessageHandler {
  /**
   * @param {Object} options
   * @param {Map<string, import('./Room.js').Room>} options.roomsByCode
   * @param {Map<string, import('./Room.js').Room>} options.roomsById
   * @param {import('socket.io').Server} options.io
   */
  constructor({ roomsByCode, roomsById, io }) {
    this.roomsByCode = roomsByCode;
    this.roomsById = roomsById;
    this.io = io;
  }

  getRoomForSocket(socket) {
    if (socket.data?.roomId) {
      return this.roomsById.get(socket.data.roomId) || null;
    }
    return null;
  }

  handleStartGame(socket) {
    const room = this.getRoomForSocket(socket);
    if (!room) return;

    const player = room.getPlayerBySocketId(socket.id);
    if (!player || player.id !== room.hostId) {
      socket.emit('error_message', { message: 'Only the host can start the game.' });
      return;
    }

    try {
      room.startGame(player.id);
    } catch (err) {
      socket.emit('error_message', { message: err.message });
    }
  }

  handleWordChosen(socket, { word }) {
    const room = this.getRoomForSocket(socket);
    if (!room || !room.game) return;

    const player = room.getPlayerBySocketId(socket.id);
    if (!player || player.id !== room.game.currentDrawerId) {
      return; // reject non-drawer
    }

    room.game.chooseWord(player.id, word);
  }

  handleDrawStart(socket, payload) {
    const room = this.getRoomForSocket(socket);
    if (!room || !room.game || room.game.phase !== 'drawing') return;

    const player = room.getPlayerBySocketId(socket.id);
    if (!player || player.id !== room.game.currentDrawerId) return;

    const stroke = {
      type: 'start',
      x: payload.x,
      y: payload.y,
      color: payload.color || '#000000',
      size: payload.size || 4,
      timestamp: Date.now()
    };

    room.game.addStroke(stroke);
    room.broadcast('draw_data', stroke);
  }

  handleDrawMove(socket, payload) {
    const room = this.getRoomForSocket(socket);
    if (!room || !room.game || room.game.phase !== 'drawing') return;

    const player = room.getPlayerBySocketId(socket.id);
    if (!player || player.id !== room.game.currentDrawerId) return;

    const stroke = {
      type: 'move',
      points: payload.points || [{ x: payload.x, y: payload.y }],
      color: payload.color,
      size: payload.size,
      timestamp: Date.now()
    };

    room.game.addStroke(stroke);
    room.broadcast('draw_data', stroke);
  }

  handleDrawEnd(socket) {
    const room = this.getRoomForSocket(socket);
    if (!room || !room.game || room.game.phase !== 'drawing') return;

    const player = room.getPlayerBySocketId(socket.id);
    if (!player || player.id !== room.game.currentDrawerId) return;

    const stroke = { type: 'end', timestamp: Date.now() };
    room.game.addStroke(stroke);
    room.broadcast('draw_data', stroke);
  }

  handleDrawUndo(socket) {
    const room = this.getRoomForSocket(socket);
    if (!room || !room.game || room.game.phase !== 'drawing') return;

    const player = room.getPlayerBySocketId(socket.id);
    if (!player || player.id !== room.game.currentDrawerId) return;

    // Pop strokes until reaching previous start or empty
    let lastPopped;
    do {
      lastPopped = room.game.undoLastStroke();
    } while (lastPopped && lastPopped.type !== 'start' && room.game.strokes.length > 0);

    room.broadcast('canvas_undo', { strokes: room.game.strokes });
  }

  handleCanvasClear(socket) {
    const room = this.getRoomForSocket(socket);
    if (!room || !room.game || room.game.phase !== 'drawing') return;

    const player = room.getPlayerBySocketId(socket.id);
    if (!player || player.id !== room.game.currentDrawerId) return;

    room.game.clearCanvas();
    room.broadcast('canvas_cleared', {});
  }

  handleGuess(socket, { text }) {
    const room = this.getRoomForSocket(socket);
    if (!room || !room.game) return;

    const player = room.getPlayerBySocketId(socket.id);
    if (!player) return;

    // Reject guess from drawer
    if (player.id === room.game.currentDrawerId) return;

    const cleanText = (text || '').trim();
    if (!cleanText) return;

    const result = room.game.checkGuess(player, cleanText);

    if (result.correct) {
      // Notify sender
      socket.emit('guess_result', {
        correct: true,
        playerId: player.id,
        playerName: player.name,
        points: result.points
      });

      // Broadcast masked notification to others
      room.broadcastToOthers(socket.id, 'guess_result', {
        correct: true,
        playerId: player.id,
        playerName: player.name,
        points: result.points,
        maskedNotification: `${player.name} guessed the word!`
      });

      // Broadcast updated game state and player list with new score
      room.broadcastGameState();
    } else {
      // Incorrect guess acts as general chat in the room
      room.broadcast('chat_message', {
        playerId: player.id,
        playerName: player.name,
        text: cleanText,
        isGuess: true,
        timestamp: Date.now()
      });
    }
  }

  handleChat(socket, { text }) {
    const room = this.getRoomForSocket(socket);
    if (!room) return;

    const player = room.getPlayerBySocketId(socket.id);
    if (!player) return;

    const cleanText = (text || '').trim();
    if (!cleanText) return;

    room.broadcast('chat_message', {
      playerId: player.id,
      playerName: player.name,
      text: cleanText,
      isGuess: false,
      timestamp: Date.now()
    });
  }
}
