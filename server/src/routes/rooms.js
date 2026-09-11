import express from 'express';

export function createRoomRouter({ roomsByCode }) {
  const router = express.Router();

  // List open public rooms for lobby browsing
  // IMPORTANT: This route MUST be declared before /rooms/:code — otherwise Express
  // matches "public" as a room code (a dynamic segment) and returns 404.
  router.get('/rooms/public', (req, res) => {
    const publicRooms = [];
    for (const room of roomsByCode.values()) {
      if (room.settings.isPublic && room.status === 'lobby' && room.players.size < room.settings.maxPlayers) {
        publicRooms.push({
          roomCode: room.roomCode,
          hostName: room.getAllPlayers()[0]?.name || 'Host',
          playerCount: room.players.size,
          maxPlayers: room.settings.maxPlayers,
          rounds: room.settings.rounds,
          drawTimeSec: room.settings.drawTimeSec
        });
      }
    }
    res.json({ rooms: publicRooms });
  });

  // Validate room exists before attempting socket join
  // NOTE: Kept AFTER /rooms/public so "public" is never treated as a room code.
  router.get('/rooms/:code', (req, res) => {
    const code = (req.params.code || '').trim().toUpperCase();
    const room = roomsByCode.get(code);

    if (!room) {
      return res.status(404).json({ exists: false });
    }

    res.json({
      exists: true,
      roomCode: room.roomCode,
      playerCount: room.players.size,
      maxPlayers: room.settings.maxPlayers,
      isPublic: room.settings.isPublic,
      status: room.status
    });
  });

  return router;
}
