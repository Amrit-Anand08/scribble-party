import mongoose from 'mongoose';

const RoomSchema = new mongoose.Schema({
  roomCode: { type: String, required: true, unique: true, index: true },
  hostName: { type: String, default: 'Host' },
  isPublic: { type: Boolean, default: false },
  settings: {
    maxPlayers: { type: Number, min: 2, max: 20, default: 8 },
    rounds: { type: Number, min: 2, max: 10, default: 3 },
    drawTimeSec: { type: Number, min: 15, max: 240, default: 80 },
    wordCount: { type: Number, min: 1, max: 5, default: 3 },
    hints: { type: Number, min: 0, max: 5, default: 2 },
    wordMode: { type: String, enum: ['normal', 'hidden', 'combination'], default: 'normal' }
  },
  status: { type: String, enum: ['lobby', 'in_progress', 'finished'], default: 'lobby' },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, index: { expires: 0 } }
});

// Calculate expiresAt ~6 hours after creation for TTL auto-cleanup
RoomSchema.pre('save', function (next) {
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000);
  }
  next();
});

export const RoomModel = mongoose.model('Room', RoomSchema);
