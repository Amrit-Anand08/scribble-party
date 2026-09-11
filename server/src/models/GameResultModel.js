import mongoose from 'mongoose';

const GameResultSchema = new mongoose.Schema({
  roomCode: { type: String, required: true },
  playedAt: { type: Date, default: Date.now },
  settingsSnapshot: { type: Object, default: {} },
  players: [{
    name: String,
    finalScore: Number,
    place: Number
  }],
  rounds: [{
    roundNumber: Number,
    drawerName: String,
    word: String,
    guessedBy: [{ playerName: String, secondsTaken: Number, points: Number }]
  }]
});

export const GameResultModel = mongoose.model('GameResult', GameResultSchema);
