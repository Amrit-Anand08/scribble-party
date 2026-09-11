# Implementation Task List

Work top to bottom. Do not skip ahead to Should/Nice-Have items until every Phase 1–2 item is
checked off and demoable. After each phase, do a manual smoke test with two browser tabs.

## Phase 0 — Scaffolding
- [ ] Init `server/` (Express, Socket.IO, Mongoose, dotenv, cors) and `client/` (Vite + React + JS).
- [ ] Set up folder structure per `02_ARCHITECTURE.md`.
- [ ] `GET /api/health` returns `{status:"ok"}`.
- [ ] MongoDB Atlas cluster created; `MONGO_URI` in `server/.env`; `config/db.js` connects on boot.
- [ ] `client/index.html` head filled in per `05_METATAGS.md` (placeholders OK for now).

## Phase 1 — Core loop (get 2 tabs drawing together ASAP)
- [ ] `Room`, `Game`, `Player`, `WordBank` classes per `02_ARCHITECTURE.md`.
- [ ] `create_room` → `room_created`; persist `Room` doc to Mongo on creation.
- [ ] `join_room` → `player_joined` broadcast; reject with `join_error` per rules.
- [ ] Lobby UI: player list, settings form, "Start Game" (host only).
- [ ] `start_game` → `round_start` (drawer gets word options) + `round_start_broadcast` (others).
- [ ] `word_chosen` → server starts timer, emits `game_state` with `deadlineTimestamp`.
- [ ] Canvas component: mousedown/mousemove/mouseup → `draw_start`/`draw_move`/`draw_end`.
- [ ] Server validates sender is current drawer, appends to `Game.strokes[]`, re-broadcasts `draw_data`.
- [ ] Other clients render incoming `draw_data` onto their own canvas.
- [ ] Guess input → `guess` → server `checkGuess()` → `guess_result` broadcast, score updated.
- [ ] **Checkpoint:** two tabs can create/join a room, draw, and one guesses correctly and scores.

## Phase 2 — Complete the game loop
- [ ] Server-side round timer ends round on timeout → `round_end` (word, scores, nextDrawerId).
- [ ] Drawer rotation advances correctly through all players across all rounds.
- [ ] `game_over` after final round → leaderboard screen, winner highlighted.
- [ ] Room settings (maxPlayers, rounds, drawTimeSec, wordCount) actually drive `Game` behavior,
      not just stored and ignored.
- [ ] Drawing tools: color picker, brush size slider, `draw_undo` (server pops + broadcasts),
      `canvas_clear` (drawer-only, server validates).
- [ ] Chat panel: incorrect guesses show as chat lines; correct guesses show masked
      "PlayerX guessed the word!" to non-guessers.
- [ ] Late-join mid-round: server sends `stroke_history` + current `game_state` (word masked).
- [ ] **Checkpoint:** a full game (all rounds, all players drawing once) runs start to finish
      with correct scoring and a winner screen.

## Phase 3 — Should-Have + deploy
- [ ] Hint reveal on interval per `settings.hints` (0 disables entirely).
- [ ] Visible countdown component driven by `deadlineTimestamp`, not local `setInterval` drift.
- [ ] Private room = default behavior (room isn't listed anywhere public); add invite link
      (`/room/:code`) that pre-fills join form.
- [ ] Deploy `server/` as Render Web Service; deploy `client/` as Render Static Site.
- [ ] Set `VITE_SERVER_URL` build env var on client; set `CLIENT_URL` + `MONGO_URI` on server.
- [ ] Confirm CORS + Socket.IO `cors.origin` both point at the deployed client URL.
- [ ] End-to-end smoke test in production: create → join (second device/network) → draw →
      guess → score → game over.
- [ ] Write `README.md`: setup steps, env vars, architecture summary, live URL.
- [ ] **Checkpoint:** live URL works for two people on different networks.

## Phase 4 — Nice-to-have (only if time remains)
- [ ] Eraser tool (separate from brush-color-white hack — actual composite-operation erase).
- [ ] Word categories (extend `WordBank`/`WordList` model).
- [ ] Host moderation: kick; votekick if time allows.
- [ ] Player avatars in lobby/game.
- [ ] Spectator mode (join mid-game without playing).
- [ ] Round replay (replay stored `strokes[]` at accelerated speed after round ends).

## Definition of "ready to submit"
- All Phase 1–3 checkboxes ticked.
- Live URL in README works right now, not "worked when I last tested."
- Agent/candidate can explain the four "success criteria" items in `01_PROJECT_BRIEF.md`
  without looking anything up.
