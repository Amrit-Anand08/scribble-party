# Architecture

## High-level flow
```
Browser (React) ──HTTP──▶ Express (REST: room existence check, health)
Browser (React) ──WS────▶ Socket.IO server ──▶ Room (in-memory) ──▶ Game (in-memory)
                                                     │
                                                     ▼
                                              MongoDB (persisted only at
                                              room-create + game-end)
```

**Rule of thumb:** MongoDB is never in the hot path of drawing or guessing. All live game
state (current strokes, timers, scores-in-progress) lives in memory on the Node process.
Mongo stores: room metadata (for reconnection/history), word lists, and final game results
(optional leaderboard history).

## Backend folder structure
```
server/
  src/
    classes/
      Room.js          // players[], settings, current Game, broadcast()
      Game.js          // rounds, drawer rotation, timers, scoring, hint reveal
      Player.js        // id, socketId, name, score, isDrawing, connected
      WordBank.js       // loads word list, pick(n) without repeats within a game
      MessageHandler.js // maps socket events -> Room/Game method calls
    socket/
      index.js          // io.on('connection', ...) wiring, room join/leave lifecycle
    models/
      RoomModel.js       // Mongoose schema (persisted room record)
      WordListModel.js   // Mongoose schema (optional custom word lists)
      GameResultModel.js // Mongoose schema (final leaderboard snapshot)
    routes/
      rooms.js           // REST: GET /api/rooms/:code (validate before socket join)
      health.js          // GET /api/health for Render health checks
    config/
      db.js              // Mongoose connection
    server.js             // Express app + http server + Socket.IO attach + CORS
  package.json
```

## Frontend folder structure
```
client/
  src/
    components/
      Lobby/            // room settings form, player list, ready/start
      Game/
        Canvas.jsx       // drawing surface, pointer events -> emits draw_* events
        Toolbar.jsx       // color, brush size, undo, clear
        WordBanner.jsx    // blanks/hints display
        Timer.jsx          // countdown, driven by server-issued deadline, not local timer
      Chat/
        ChatPanel.jsx      // guesses + messages, renders guess_result/chat_message
      Scoreboard/
        Scoreboard.jsx     // live scores, round-end, game-end screens
    hooks/
      useSocket.js         // single Socket.IO client instance + event helpers
      useGameState.js       // reducer holding phase/round/drawerId/word/hints/scores
    pages/
      Home.jsx              // create/join room forms
      RoomPage.jsx           // mounts Lobby or Game depending on phase
    constants/
      events.js             // shared event name constants & payload schemas
    App.jsx
  index.html                  // <head> metatags — see 05_METATAGS.md
```

## Class responsibilities (OOP core, matches assignment's bonus ask)

### `Room`
- Owns: `id`, `hostId`, `settings`, `players: Map<socketId, Player>`, `game: Game | null`.
- Owns the *only* code that calls `io.to(roomId).emit(...)` — nothing else broadcasts directly.
- Methods: `addPlayer()`, `removePlayer()`, `startGame()`, `broadcast(event, payload)`,
  `toPublicState()` (serializes room for `game_state` events, never leaks the answer word to
  non-drawers).

### `Game`
- Pure logic, no socket/IO imports. Constructed with `settings` and `players[]`.
- Owns: `round`, `drawerIndex`, `currentWord`, `strokes[]` (for late-join replay),
  `scores: Map<playerId, number>`, `timers` (Node `setTimeout`/`setInterval` handles).
- Methods: `nextRound()`, `chooseWord(word)`, `startTimer()`, `endRound(reason)`,
  `checkGuess(playerId, text)` → returns `{correct, points}`, `revealHint()`, `isGameOver()`,
  `getLeaderboard()`.
- **Server-authoritative timing**: `Game` sets its own `setTimeout` for round end and hint
  reveals. Clients only render a countdown computed from a server-sent `deadlineTimestamp` —
  never trust a client-side timer to end a round.

### `Player`
- Simple data holder: `id`, `socketId`, `name`, `score`, `connected`, `isDrawing`.

### `WordBank`
- Loads `data/words.json` (or Mongo custom list). `pick(n, excludeSet)` returns n unique
  words not yet used this game.

### `MessageHandler`
- Thin layer: `socket.on('draw_start', payload => messageHandler.handleDrawStart(...))`.
- Looks up the caller's `Room`/`Game`, validates the caller is allowed to perform the action
  (e.g. only the current drawer can emit `draw_*`, only the host can `start_game`), then
  delegates to the class method. Keeps validation and I/O out of `Game`/`Room` business logic.

## Real-time sync strategy (drawing)
- Client emits raw point deltas: `draw_start {x,y,color,size}`, `draw_move {x,y}`, `draw_end {}`.
- Server does NOT re-broadcast on every single point immediately if volume is high — batch
  `draw_move` points client-side into small arrays (e.g. every animation frame) before emitting,
  and re-broadcast the batch as `draw_data`. This cuts socket message volume drastically.
- Server pushes each stroke into `Game.strokes[]` for the current round so a player who joins
  mid-round can be sent the full stroke history once, then switches to live `draw_data` events.
- `canvas_clear` and `draw_undo` also mutate `Game.strokes[]` server-side so replay stays correct.

## Word-matching logic
```js
function normalize(s) {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}
function isCorrectGuess(guess, word) {
  return normalize(guess) === normalize(word);
}
```
Keep it exact-match for MVP. If time remains, add Levenshtein distance ≤1 tolerance for typos
as a "close guess" partial-credit feature — call this out explicitly as a stretch goal, don't
build it before MVP is done.

## Deployment shape on Render
- Two Render services: a **Web Service** (Node/Express + Socket.IO, `server/`) and a
  **Static Site** (built Vite app, `client/`).
- Static site's API/socket base URL is set via a build-time env var (`VITE_SERVER_URL`)
  pointing at the web service's Render URL.
- Express CORS config must explicitly allow the static site's origin; Socket.IO server needs
  matching `cors: { origin: CLIENT_URL }`.
- MongoDB: use MongoDB Atlas free tier, connection string in Render env var `MONGO_URI`.
