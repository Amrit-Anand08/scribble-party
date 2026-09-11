# API Spec

All payloads are JSON. Direction: **C→S** = client emits, server listens. **S→C** = server
emits, client listens. `roomId` is implicit via Socket.IO room membership after `join_room` —
do not repeat `roomId` in every subsequent payload.

## REST (Express, minimal — everything else is sockets)
| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Render health check, returns `{status:"ok"}` |
| GET | `/api/rooms/:code` | Validate a room code exists before attempting socket join (used by "Join via link" flow) → `{exists: boolean, playerCount, maxPlayers, isPublic}` |
| GET | `/api/rooms/public` | List open public rooms for lobby browsing (optional / Should-Have) |

## Room & Lobby (sockets)
| Event | Dir | Payload | Notes |
|---|---|---|---|
| `create_room` | C→S | `{ hostName, settings: {maxPlayers, rounds, drawTimeSec, wordCount, hints, isPublic} }` | Server creates `Room`+`Player`(host), returns `room_created` |
| `room_created` | S→C | `{ roomId, roomCode, player }` | Ack directly to creator (not broadcast) |
| `join_room` | C→S | `{ roomCode, playerName }` | Server validates room exists, not full, not mid-game (unless spectator allowed) |
| `join_error` | S→C | `{ reason }` | e.g. "room_full", "room_not_found", "name_taken", "game_in_progress" |
| `player_joined` | S→C | `{ player, players[] }` | Broadcast to room |
| `player_left` | S→C | `{ playerId, players[] }` | Broadcast; if host left, reassign `hostId` |
| `start_game` | C→S | `{}` | Host-only; server rejects if sender isn't `hostId` |

## Game State (sockets)
| Event | Dir | Payload | Notes |
|---|---|---|---|
| `game_state` | S→C | `{ phase, round, totalRounds, drawerId, wordLength, hints[], deadlineTimestamp }` | Sent on reconnect/late-join and phase changes. **Never includes the actual word** unless recipient is the drawer. |
| `round_start` | S→C (to drawer only) | `{ wordOptions: string[], drawTimeSec }` | Only the drawer receives the real options |
| `round_start_broadcast` | S→C (to others) | `{ drawerId, round, totalRounds }` | Everyone else just learns who's drawing |
| `word_chosen` | C→S | `{ word }` | Only accepted from current drawer; starts server timer |
| `hint_reveal` | S→C | `{ revealedIndices: number[], blanks: string }` | Sent per configured hint interval |
| `round_end` | S→C | `{ word, scores: {playerId: points}, nextDrawerId }` | |
| `game_over` | S→C | `{ winnerId, leaderboard: [{playerId, name, score}] }` | |

## Drawing (sockets)
| Event | Dir | Payload | Notes |
|---|---|---|---|
| `draw_start` | C→S | `{ x, y, color, size }` | Server rejects if sender isn't current drawer |
| `draw_move` | C→S | `{ points: [{x,y}, ...] }` | Client batches points per animation frame before sending |
| `draw_end` | C→S | `{}` | |
| `draw_data` | S→C | `{ type: "start"\|"move"\|"end", x?, y?, points?, color?, size? }` | Broadcast to whole room including drawer (for consistency across reconnects) |
| `canvas_clear` | C→S | `{}` | Drawer-only |
| `canvas_cleared` | S→C | `{}` | Broadcast |
| `draw_undo` | C→S | `{}` | Drawer-only; server pops last stroke from `Game.strokes[]` |
| `canvas_undo` | S→C | `{}` | Broadcast — clients pop + re-render from local stroke history, or request `stroke_history` |
| `stroke_history` | S→C | `{ strokes[] }` | Sent to a client on join mid-round for replay |

## Chat & Guessing (sockets)
| Event | Dir | Payload | Notes |
|---|---|---|---|
| `guess` | C→S | `{ text }` | Ignored if sender is the current drawer |
| `guess_result` | S→C | `{ playerId, playerName, correct, points, text? }` | If `correct: false`, `text` is echoed as a normal chat line; if `correct: true`, broadcast a masked "guessed the word!" message instead of revealing their exact text to non-drawers who haven't guessed yet |
| `chat` | C→S | `{ text }` | General chat, always allowed |
| `chat_message` | S→C | `{ playerId, playerName, text, timestamp }` | |

## Validation rules the server must enforce (not just the client)
- Only `hostId` can emit `start_game`.
- Only the current round's `drawerId` can emit `draw_*`, `canvas_clear`, `draw_undo`, `word_chosen`.
- `guess` from the current drawer is ignored/rejected.
- A player who already guessed correctly this round cannot score again (still allowed to chat).
- Word text sent to non-drawers is always the blanked/hinted version — the raw word must never
  appear in any payload sent to non-drawer sockets before `round_end`.
