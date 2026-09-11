# Data Models (MongoDB via Mongoose)

Reminder: Mongo is **not** touched during live drawing/guessing. It's written to at
room-creation and game-end boundaries only, and read at startup for word lists.

## `Room`
```js
{
  roomCode: { type: String, required: true, unique: true, index: true }, // short shareable code
  hostName: String,
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
  expiresAt: { type: Date, index: { expires: 0 } } // TTL index — auto-delete stale rooms
}
```

## `WordList` (optional — custom word lists)
```js
{
  name: String,               // e.g. "Animals", "Default"
  language: { type: String, default: 'en' },
  words: [{ type: String, lowercase: true, trim: true }],
  createdByRoomCode: String   // null for built-in lists
}
```

## `GameResult` (final snapshot, for optional history/leaderboard-of-leaderboards)
```js
{
  roomCode: String,
  playedAt: { type: Date, default: Date.now },
  settingsSnapshot: Object,       // copy of Room.settings at play time
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
}
```

## Indexing notes
- `roomCode` unique index — collisions must be retried on generation (use a short
  human-friendly generator, e.g. 6 uppercase alphanumeric chars, retry on duplicate key error).
- TTL index on `expiresAt` (set to ~6 hours after creation) keeps the `rooms` collection from
  growing unbounded from abandoned lobbies — this is the only cleanup job needed for MVP, no
  separate cron required.

## What NOT to model in Mongo for MVP
- Live scores during a round — keep in `Game.scores` (in-memory), only persist final scores
  to `GameResult` at `game_over`.
- Stroke data — never persisted; it's ephemeral and only needed for in-memory replay to
  late joiners within the same live round.
- User accounts — out of scope per project brief.
