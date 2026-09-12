# 🎨 Scribble Party — Backend Server

The official authoritative game server and real-time WebSocket backend for **Scribble Party**. Built with **Node.js (ES Modules)**, **Express**, **Socket.IO**, and **MongoDB / Mongoose**.

---

## 🚀 Live Backend Service
API & WebSocket URL: [https://scribble-party-server.onrender.com](https://scribble-party-server.onrender.com)
- Health Probe: [https://scribble-party-server.onrender.com/api/health](https://scribble-party-server.onrender.com/api/health)

---

## 🛠 Tech Stack

- **Runtime**: [Node.js](https://nodejs.org/) (v18, v20, or v22+)
- **HTTP Server**: [Express](https://expressjs.com/) (v4.21+)
- **WebSocket Protocol**: [Socket.IO](https://socket.io/) (v4.8+)
- **Database**: [MongoDB](https://www.mongodb.com/) via [Mongoose](https://mongoosejs.com/) (v8.9+) with graceful in-memory fallback
- **Cross-Origin Handling**: `cors`
- **Environment Config**: `dotenv`
- **Development Tooling**: `nodemon`

---

## 📂 Architecture & Directory Structure

```
server/
├── src/
│   ├── classes/
│   │   ├── Game.js             # Pure game logic, turn progression, timers, scoring & stroke history
│   │   ├── MessageHandler.js   # Socket event verification, authorization & dispatching
│   │   ├── Player.js           # Player entity, session state & score tracking
│   │   ├── Room.js             # Room lifecycle, player map & authoritative broadcast()
│   │   └── WordBank.js         # Word dictionary loader & non-repeating random word picker
│   ├── config/
│   │   └── db.js               # Mongoose connection with reconnection & offline fallback
│   ├── data/
│   │   └── words.json          # Curated word database categorized by topic & difficulty
│   ├── models/
│   │   ├── GameResultModel.js  # Mongoose schema for archiving finished game rankings
│   │   ├── RoomModel.js        # Mongoose Room schema with 6-hour TTL expiration index
│   │   └── WordListModel.js    # Mongoose WordList schema
│   ├── routes/
│   │   ├── health.js           # GET /api/health for uptime monitoring and Render probes
│   │   └── rooms.js            # GET /api/rooms/:code & GET /api/rooms/public
│   ├── socket/
│   │   └── index.js            # Socket connection lifecycle, room joins & disconnect handling
│   └── server.js               # Express application initialization, HTTP/Socket.IO binding & CORS
├── package.json
└── README.md
```

---

## 🧠 Core Systems & Design Decisions

### 1. In-Memory Real-Time Hot Path
- Drawing strokes, coordinate delta batches, and guess attempts occur dozens of times per second. Reading or writing to a persistent database on every event would cause severe latency and connection bottlenecks.
- All real-time operations occur **100% in-memory** within `Room` and `Game` class instances.
- **MongoDB** is used strictly at non-blocking lifecycle milestones:
  1. Room creation record persistence (`RoomModel`).
  2. Finished game summary archiving (`GameResultModel`).
  3. Automatic cleanup via MongoDB's built-in TTL index (`expiresAt: 6h`).
  4. **Graceful Fallback**: If MongoDB is unavailable or fails to connect, the server automatically continues running in memory mode without crashing.

### 2. Server-Authoritative Timers & Secret Word Security
- **No Client Clock Trust**: The round countdown timer is controlled strictly by server-side Node.js timeouts. The server emits an absolute `deadlineTimestamp` (epoch milliseconds) to clients, ensuring sleeping or throttled browser tabs never desynchronize.
- **Data Sanitization**: `Room.toPublicState(recipientSocketId)` strips the unmasked secret word for all non-drawer sockets. Masked placeholders (e.g. `_ _ _ _`) and progressive hint letters are sent instead until `round_ended`.

### 3. Real-Time Scoring Algorithm
Guesses are evaluated inside `Game.checkGuess(player, text)`:
- Text is sanitized: trimmed, converted to lowercase, and multiple spaces collapsed.
- Speed bonus: Faster correct answers earn higher points ($100 \text{ base} + \text{speed bonus} + \text{first-guesser bonus}$).
- Drawers earn bonus points when other players successfully guess their drawing.

---

## 🔌 Socket.IO Event Reference

### Client $\rightarrow$ Server (Inbound)

| Event | Payload | Description |
|---|---|---|
| `create_room` | `{ hostName, settings }` | Creates a new room and assigns host crown |
| `join_room` | `{ roomCode, playerName }` | Joins an existing room |
| `start_game` | `{ roomCode }` | Host triggers the start of the game |
| `select_word` | `{ roomCode, word }` | Active drawer picks a word from the 3 choices |
| `draw_move` / `draw_data` | `{ roomCode, stroke }` | Active drawer transmits batched drawing strokes |
| `draw_undo` | `{ roomCode }` | Active drawer removes the previous stroke |
| `canvas_clear` | `{ roomCode }` | Active drawer clears the entire canvas |
| `chat_message` | `{ roomCode, text }` | Player sends a chat message or guess attempt |
| `leave_room` | `{ roomCode }` | Player leaves the current room |

### Server $\rightarrow$ Client (Outbound)

| Event | Payload | Description |
|---|---|---|
| `room_state` | `{ roomCode, players, state, settings... }` | Complete sanitized room state update |
| `word_options` | `{ words: [w1, w2, w3] }` | Sent exclusively to the active drawer to choose from |
| `round_started` | `{ drawerId, drawerName, deadlineTimestamp, hint }` | Signals round start and begins the countdown |
| `draw_data` | `{ points, color, size }` | Broadcasted stroke data for rendering on non-drawers |
| `draw_undo` | `none` | Triggers canvas redraw excluding the last stroke |
| `canvas_clear` | `none` | Clears all canvas pixels on clients |
| `chat_message` | `{ sender, text, isSystem, isCorrect }` | Masked or public chat notification |
| `hint_update` | `{ hint }` | Progressive reveal of word letters (e.g. `c _ t`) |
| `round_ended` | `{ secretWord, scores, nextDrawer }` | Round intermission modal with word reveal |
| `game_over` | `{ podium, finalScores }` | Final game-over podium modal |

---

## 🌐 REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service liveness probe returning `{ status: "ok", timestamp, uptime }` |
| `GET` | `/api/rooms/:code` | Validates room existence and returns basic info |
| `GET` | `/api/rooms/public` | Returns an array of joinable public rooms |

---

## ⚡ Getting Started Locally

### 1. Install Dependencies
```bash
cd server
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the `server/` directory:
```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://127.0.0.1:27017/skribbl
```

### 3. Run Development Server
```bash
npm run dev
```
> Server starts on `http://localhost:5000` with nodemon auto-reloading.

### Production Start:
```bash
npm start
```

---

## ☁️ Deployment on Render

To deploy as a **Web Service** on Render:
- **Root Directory**: `server`
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `node src/server.js` (or `npm start`)
- **Environment Variables**:
  - `PORT`: `10000`
  - `CLIENT_URL`: `https://scribble-party-client.onrender.com`
  - `MONGO_URI`: `<YOUR-MONGODB-ATLAS-CONNECTION-STRING>`
- **Health Check Path**: `/api/health`
