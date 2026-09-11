import crypto from 'crypto';
import { Room } from '../classes/Room.js';
import { Player } from '../classes/Player.js';
import { MessageHandler } from '../classes/MessageHandler.js';
import { RoomModel } from '../models/RoomModel.js';

export function setupSockets(io, { roomsByCode, roomsById }) {
  const messageHandler = new MessageHandler({ roomsByCode, roomsById, io });

  function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous 0/O, 1/I
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // Create a new room
    socket.on('create_room', async (payload = {}) => {
      try {
        const hostName = (payload.hostName || 'Host').trim().slice(0, 20);
        const settings = payload.settings || {};

        let roomCode = generateRoomCode();
        while (roomsByCode.has(roomCode)) {
          roomCode = generateRoomCode();
        }

        const roomId = crypto.randomUUID();
        const hostPlayerId = crypto.randomUUID();

        const hostPlayer = new Player({
          id: hostPlayerId,
          socketId: socket.id,
          name: hostName
        });

        const room = new Room({
          id: roomId,
          roomCode,
          hostId: hostPlayerId,
          settings,
          io
        });

        room.addPlayer(hostPlayer);

        roomsByCode.set(roomCode, room);
        roomsById.set(roomId, room);

        socket.data.roomId = roomId;
        socket.data.playerId = hostPlayerId;
        socket.join(roomId);

        // Persist room to Mongo in background
        RoomModel.create({
          roomCode,
          hostName,
          isPublic: Boolean(settings.isPublic),
          settings: room.settings,
          status: 'lobby'
        }).catch(err => console.warn('[Mongo] Room save notice:', err.message));

        // Ack to creator
        socket.emit('room_created', {
          roomId,
          roomCode,
          player: hostPlayer.toPublic(),
          room: room.toPublicState(socket.id)
        });

        console.log(`[Room] Created room ${roomCode} by ${hostName} (${socket.id})`);
      } catch (err) {
        console.error('[Socket] create_room error:', err);
        socket.emit('join_error', { reason: 'create_failed', message: err.message });
      }
    });

    // Join an existing room
    socket.on('join_room', (payload = {}) => {
      try {
        const roomCode = (payload.roomCode || '').trim().toUpperCase();
        const playerName = (payload.playerName || 'Player').trim().slice(0, 20);

        const room = roomsByCode.get(roomCode);
        if (!room) {
          socket.emit('join_error', { reason: 'room_not_found', message: 'Room not found' });
          return;
        }

        if (room.players.size >= room.settings.maxPlayers) {
          socket.emit('join_error', { reason: 'room_full', message: 'Room is full' });
          return;
        }

        const playerId = crypto.randomUUID();
        const player = new Player({
          id: playerId,
          socketId: socket.id,
          name: playerName
        });

        room.addPlayer(player);

        socket.data.roomId = room.id;
        socket.data.playerId = playerId;
        socket.join(room.id);

        // Confirm to joiner
        socket.emit('joined_room_success', {
          roomId: room.id,
          roomCode: room.roomCode,
          player: player.toPublic(),
          room: room.toPublicState(socket.id)
        });

        // Broadcast to all players in the room
        room.broadcast('player_joined', {
          player: player.toPublic(),
          players: room.getAllPlayers().map(p => p.toPublic())
        });

        // If game in progress, send late joiner the stroke history and game state
        if (room.game && room.game.phase === 'drawing') {
          socket.emit('stroke_history', { strokes: room.game.strokes });
        }

        console.log(`[Room] Player ${playerName} joined room ${roomCode}`);
      } catch (err) {
        console.error('[Socket] join_room error:', err);
        socket.emit('join_error', { reason: 'join_failed', message: err.message });
      }
    });

    // Game lifecycle events
    socket.on('start_game', () => messageHandler.handleStartGame(socket));
    socket.on('word_chosen', (payload) => messageHandler.handleWordChosen(socket, payload));

    // Drawing events
    socket.on('draw_start', (payload) => messageHandler.handleDrawStart(socket, payload));
    socket.on('draw_move', (payload) => messageHandler.handleDrawMove(socket, payload));
    socket.on('draw_end', () => messageHandler.handleDrawEnd(socket));
    socket.on('draw_undo', () => messageHandler.handleDrawUndo(socket));
    socket.on('canvas_clear', () => messageHandler.handleCanvasClear(socket));

    // Guessing and Chat
    socket.on('guess', (payload) => messageHandler.handleGuess(socket, payload));
    socket.on('chat', (payload) => messageHandler.handleChat(socket, payload));

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
      const roomId = socket.data?.roomId;
      if (!roomId) return;

      const room = roomsById.get(roomId);
      if (!room) return;

      const removedPlayer = room.removePlayer(socket.id);
      if (removedPlayer) {
        room.broadcast('player_left', {
          playerId: removedPlayer.id,
          playerName: removedPlayer.name,
          hostId: room.hostId,
          players: room.getAllPlayers().map(p => p.toPublic())
        });

        // Clean up empty room
        if (room.players.size === 0) {
          console.log(`[Room] Cleaning up empty room: ${room.roomCode}`);
          room.cleanup();
          roomsByCode.delete(room.roomCode);
          roomsById.delete(room.id);
        }
      }
    });
  });
}
