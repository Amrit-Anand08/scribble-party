# Project Brief — Skribbl.io Clone

## What we're building
A real-time multiplayer drawing-and-guessing game (skribbl.io clone). One player draws a
chosen word each round while others guess it via chat. Correct guesses score points.
Rounds rotate through all players; highest total score wins.

## Locked tech stack
| Layer | Choice |
|---|---|
| Frontend | React + Javascript + Vite |
| Canvas | HTML5 Canvas API (raw, no Fabric/Konva) |
| Backend | Node.js + Express |
| Realtime | Socket.IO |
| Database | MongoDB (Mongoose) |
| Deployment | Render (frontend static site + backend web service) |

Do not substitute any of the above. Do not add a second framework (e.g. Next.js) or a second
realtime library. Do not add Redis/Postgres unless explicitly asked later for scaling.

## Definition of done (MVP / "Must Have")
- Host can create a room with configurable settings (max players, rounds, draw time, word count).
- Players join via room code or invite link.
- Lobby shows player list; host starts the game.
- Turn-based rounds: exactly one drawer per round, rotates every round.
- Drawing strokes sync in real time to all clients in the room (including late joiners via replay).
- Drawer picks 1 of N offered words before drawing starts.
- Other players type guesses in chat; first correct guess (case/whitespace-insensitive) scores points.
- Live scoreboard; round-end summary; game-end screen with final leaderboard and winner.
- Drawing tools: brush color, brush size, undo, clear canvas (drawer only).
- Deployed and publicly reachable on Render; full create→draw→guess→score loop works in production.

## Should Have (build if MVP is solid)
- Letter-reveal hints on a timer (configurable 0–5 hints).
- General chat separate from guesses.
- Visible draw-time countdown, synced from server.
- Private rooms via invite link (already covered by room codes — just don't list them publicly).

## Nice to Have (only after Should Have is done)
- Word categories, eraser tool, kick/ban/votekick, avatars, spectator mode, round replay,
  multi-language word lists.

## Explicit non-goals for MVP
- No user accounts / auth / persistent profiles.
- No matchmaking algorithm for public rooms — a simple "list of open rooms" is enough.
- No mobile app — responsive web only.
- No chat moderation/profanity filter unless time remains.

## Success criteria for code review
The agent must be able to explain, on request:
1. How a drawn stroke goes from mousedown on Client A to pixels rendered on Client B.
2. How round/turn/score state is owned and mutated (single source of truth, no duplicated
   state between server and client that can desync).
3. How a guess is validated server-side (normalization rules — see 03_API_SPEC.md).
4. Why MongoDB is only touched at room-creation/game-end boundaries, not on every draw event
   (Mongo is not in the real-time hot path).
