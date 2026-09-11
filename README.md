# 🎨 Scribble Party — Skribbl.io Clone

An end-to-end real-time multiplayer drawing and guessing game built with **React**, **HTML5 Canvas**, **Node.js**, **Express**, **Socket.IO**, and **MongoDB**.

---

## 🚀 Live Deployment
- **Frontend App**: `https://scribble-party.onrender.com`
- **Backend API & WebSockets**: `https://scribble-server.onrender.com`

---

## 🌟 Key Features

### Must-Have (MVP)
- **Multiplayer Rooms**: Create private or public rooms with custom room codes (6 uppercase alphanumeric characters).
- **Custom Room Settings**: Configure round count (2–10), draw time (15–240s), maximum players (2–20), and word choice count (1–5).
- **Lobby Management**: Live player roster with host crown (`👑`), one-click code/link copying, and host start game trigger.
- **Turn-Based Drawing**: Server-managed drawer rotation ensuring every player gets an equal turn to draw each round.
- **Real-Time Canvas Drawing**:
  - Raw HTML5 Canvas API with sub-pixel and coordinate scaling (800x600 virtual resolution) ensuring identical stroke rendering across any screen size.
  - Client-side delta batching via `requestAnimationFrame` for high-performance, low-latency transmission.
  - Drawing tools: 12-color vibrant palette, 4 brush thickness levels (S, M, L, XL), Undo (`draw_undo`), and Clear Canvas (`canvas_clear`).
- **Secret Word Selection**: Drawer chooses from 3 randomized words from a seed dictionary of 100+ categorized words.
- **Real-Time Guessing & Dynamic Scoring**:
  - Case-insensitive, whitespace-trimmed guess evaluation on the server.
  - Speed-based scoring bonus rewarding faster correct guesses.
  - Masked chat notifications (`"PlayerX guessed the word!"`) preventing other players from copying correct answers.
- **Live Leaderboard & Game Over**:
  - Real-time score updates on the sidebar.
  - Round-end intermission modal showing the revealed word and next drawer.
  - Final game-over podium screen highlighting the winner and top rankings.

### Should-Have Features
- **Timed Hint Reveals**: Automatic progressive letter reveals (e.g. `_ _ a _ _`) spaced evenly across the draw time based on room hint settings.
- **Server-Authoritative Countdown**: Timer driven by server-sent `deadlineTimestamp`, completely immune to client tab throttling.
- **Public Lobby Browser**: Browse and join open public games directly from the home screen.
- **Invite Link Sharing**: Joining via `/?room=CODE` automatically pre-fills and activates the room join flow.

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React (JavaScript) + Vite | Fast SPA, reactive state management, responsive UI |
| **Canvas** | Raw HTML5 Canvas API | Low-overhead vector rendering, custom pointer capture |
| **Styling** | Vanilla CSS Design System | Modern dark/light glassmorphic aesthetic with Outfit & Fredoka typography |
| **Backend** | Node.js + Express (ES Modules) | REST routes, room validation, health checks |
| **Realtime** | Socket.IO | Bi-directional event stream for drawing, chat, and game state |
| **Database** | MongoDB + Mongoose | Room persistence, word lists, and game summary records (TTL auto-cleanup) |
| **Deployment**| Render | Frontend Static Site + Backend Web Service (`render.yaml`) |

---

## 📂 Project Structure

```
skribbleio-Clone/
├── client/                     # Vite + React (JavaScript)
│   ├── public/                 # Static assets (og-preview.png, favicon.svg)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Lobby/          # Room settings & player waiting room
│   │   │   ├── Game/           # Canvas.jsx, Toolbar.jsx, WordBanner.jsx, Timer.jsx
│   │   │   ├── Chat/           # ChatPanel.jsx (chat stream & guess input)
│   │   │   └── Scoreboard/     # Scoreboard.jsx (live ranks, round-end & game-over modals)
│   │   ├── hooks/
│   │   │   ├── useSocket.js    # Centralized Socket.IO client instance
│   │   │   └── useGameState.js # Full game state machine and event handlers
│   │   ├── pages/
│   │   │   ├── Home.jsx        # Create, Join, and Public room browser
│   │   │   └── RoomPage.jsx    # Orchestrates Lobby and Game views
│   │   ├── constants/
│   │   │   └── events.js       # Standardized socket event strings
│   │   ├── index.css           # Vibrant modern CSS design system
│   │   ├── App.jsx             # Top navbar, toast alerts, page router
│   │   └── main.jsx            # React root
│   ├── index.html              # OpenGraph, Twitter card, & SEO metatags
│   └── package.json
│
├── server/                     # Node.js + Express + Socket.IO (ES Modules)
│   ├── src/
│   │   ├── classes/
│   │   │   ├── Player.js       # Player entity data container
│   │   │   ├── WordBank.js     # Seed word dictionary loader & non-repeating picker
│   │   │   ├── Game.js         # Pure game logic, timers, scoring & stroke buffer
│   │   │   ├── Room.js         # Room lifecycle, player map & authoritative broadcast()
│   │   │   └── MessageHandler.js # Socket event permission verification & routing
│   │   ├── config/
│   │   │   └── db.js           # Mongoose connection with graceful reconnection
│   │   ├── data/
│   │   │   └── words.json      # Categorized word database (animals, objects, food, etc.)
│   │   ├── models/
│   │   │   ├── RoomModel.js    # Mongoose Room schema with 6h TTL index
│   │   │   ├── WordListModel.js# Mongoose WordList schema
│   │   │   └── GameResultModel.js # Mongoose game summary snapshot schema
│   │   ├── routes/
│   │   │   ├── health.js       # GET /api/health for Render liveness checks
│   │   │   └── rooms.js        # GET /api/rooms/:code & GET /api/rooms/public
│   │   ├── socket/
│   │   │   └── index.js        # Socket connection lifecycle & late join replay
│   │   └── server.js           # Express app, HTTP server, Socket.IO attach, CORS
│   └── package.json
│
├── render.yaml                 # Infrastructure-as-Code blueprint for Render
├── package.json                # Monorepo development scripts
└── README.md
```

---

## ⚡ Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18, v20, or v22+)
- [npm](https://www.npmjs.com/)
- Optional: Local [MongoDB](https://www.mongodb.com/) instance or free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster. (If MongoDB is not running, the game runs smoothly in in-memory mode).

### 1. Install Dependencies
From the repository root:
```bash
npm run install:all
```
*(Or install inside each folder: `cd server && npm install`, then `cd ../client && npm install`)*.

### 2. Environment Configuration

#### Server (`server/.env`):
```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://127.0.0.1:27017/skribbl
```

#### Client (`client/.env`):
```env
VITE_SERVER_URL=http://localhost:5000
```

### 3. Run Development Servers
Open two terminal windows:

**Terminal 1 (Backend Server):**
```bash
npm run dev:server
```
*Server starts on `http://localhost:5000` (Health check: `http://localhost:5000/api/health`)*.

**Terminal 2 (Frontend Client):**
```bash
npm run dev:client
```
*Client starts on `http://localhost:5173`*.

---

## 🧪 Testing the Multiplayer Flow

1. Open `http://localhost:5173` in your browser (Tab 1).
2. Click **Create Room**, pick your preferred rounds/draw time, and click **Create Room**.
3. Note the 6-character room code (e.g. `ABCD23`) or click **Copy Invite Link**.
4. Open an incognito window or a second browser (Tab 2) at `http://localhost:5173`.
5. Enter a player name (e.g., `GuesserBob`), enter the room code, and click **Join Game**.
6. In Tab 1 (Host), click **Start Game**.
7. The drawer selects a word from the 3 choices.
8. Draw on the canvas in Tab 1 $\rightarrow$ strokes appear in real time in Tab 2!
9. In Tab 2, type the secret word into the chat input and hit enter $\rightarrow$ points are awarded, notification is masked, and leaderboard updates!

---

## ☁️ Deployment on Render

This repository is pre-configured with a [`render.yaml`](./render.yaml) blueprint:

### Option A: Using the Render Blueprint (Recommended)
1. Push your repository to GitHub.
2. In the [Render Dashboard](https://dashboard.render.com/), click **New +** $\rightarrow$ **Blueprint**.
3. Connect your repository. Render will automatically configure both the **Web Service** (`server`) and **Static Site** (`client`).
4. Set the `MONGO_URI` environment variable on the backend service to your MongoDB Atlas connection string.

### Option B: Manual Setup on Render
1. **Backend Web Service**:
   - Root Directory: `server`
   - Build Command: `npm install`
   - Start Command: `node src/server.js`
   - Environment Variables:
     - `PORT`: `10000`
     - `CLIENT_URL`: `https://<YOUR-CLIENT-NAME>.onrender.com`
     - `MONGO_URI`: `<YOUR-MONGODB-ATLAS-URI>`
   - Health Check Path: `/api/health`
2. **Frontend Static Site**:
   - Root Directory: `client`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
   - Environment Variables:
     - `VITE_SERVER_URL`: `https://<YOUR-SERVER-NAME>.onrender.com`

---

## 🧠 Architectural Deep-Dive & Review Readiness

### 1. How Drawn Strokes Go from `mousedown` on Client A to Pixels on Client B
1. **Pointer Capture & Virtual Coordinates**: When the drawer clicks on the canvas in `Canvas.jsx`, `pointerdown` is captured. Screen viewport coordinates are transformed to a fixed virtual resolution ($800 \times 600$), ensuring strokes render identically on 4K monitors and laptops alike.
2. **Batching via `requestAnimationFrame`**: As the drawer moves the pointer, coordinate deltas (`{x, y}`) are collected into a local buffer. On every animation frame tick, the batch is emitted over WebSockets as `draw_move` with stroke properties (color, size).
3. **Server Validation & History Buffer**: `MessageHandler.js` checks that the sender's socket ID matches the current round's `drawerId`. The stroke is pushed to `Game.strokes[]` (for mid-round replay to late joiners) and re-broadcast to all clients via `Room.broadcast('draw_data', stroke)`.
4. **Target Rendering**: Client B receives `draw_data` via Socket.IO, connects consecutive points with `ctx.lineTo(...)`, sets matching `lineWidth` and `strokeStyle`, and strokes the path to the canvas.

### 2. Single Source of Truth for Game State & Timers
All mutable game states (active round, drawer pointer, secret word, player scores, deadlines) reside strictly in the server's in-memory `Game` instance:
- **Server-Authoritative Timing**: The round timer is driven by a server Node.js `setTimeout`. The server sends a single `deadlineTimestamp` (epoch ms) to clients. Clients only compute a visual countdown from this timestamp—preventing any client lag or browser tab throttling from desynchronizing round ends.
- **Safe State Serialization**: `Room.toPublicState(recipientSocketId)` ensures the unmasked secret word is **never sent to non-drawer sockets** before `round_end`.

### 3. Server-Side Guess Validation
Guesses are processed in `Game.checkGuess(player, text)`:
- Both the guess and the secret word are normalized: trimmed of outer whitespace, converted to lowercase, and internal consecutive spaces collapsed to a single space (`s.trim().toLowerCase().replace(/\s+/g, ' ')`).
- Guesses from the active drawer are ignored.
- A player who already guessed correctly cannot score multiple times in the same round.
- Scores are calculated dynamically: faster correct guesses earn higher points ($100 \text{ base} + \text{speed bonus} + \text{first-guesser bonus}$).

### 4. Why MongoDB is Kept Off the Real-Time Hot Path
- Drawing strokes and guesses happen dozens of times per second. Reading or writing to a database on every stroke or guess would introduce high latency, database connection bottlenecks, and potential rate limits.
- Therefore, all live interactions happen **100% in memory** within the Node process.
- MongoDB is only touched at non-critical lifecycle boundaries:
  1. Persisting room metadata on `create_room`.
  2. Saving final game leaderboard snapshots to `GameResultModel` on `game_over`.
  3. Built-in TTL index (`expiresAt`) automatically purging abandoned rooms after 6 hours without needing separate cron jobs.

---

## 📜 License
MIT License. Built with passion as an end-to-end Skribbl.io clone.
