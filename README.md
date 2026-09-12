# 🎨 Scribble Party — Real-Time Multiplayer Drawing & Guessing Game

An end-to-end real-time multiplayer drawing and guessing game built with **React 19**, **HTML5 Canvas**, **Node.js**, **Express**, **Socket.IO**, and **MongoDB**.

---

## 🚀 Live Deployment
- **Frontend Client**: [https://scribble-party-client.onrender.com](https://scribble-party-client.onrender.com)
- **Backend API & WebSockets**: [https://scribble-party-server.onrender.com](https://scribble-party-server.onrender.com)

---

## 🌟 Key Features

### Core Gameplay & Multiplayer (MVP)
- **Multiplayer Rooms**: Create private or public rooms with custom 6-character room codes (e.g. `ABCD23`).
- **Custom Room Settings**: Configure round count (2–10), draw time (15–240s), maximum players (2–20), and word choice count (1–5).
- **Lobby Management**: Live player roster with host crown (`👑`), one-click invite link copying, and host start game trigger.
- **Turn-Based Drawing Rotation**: Server-managed drawer rotation ensuring every player gets an equal turn to draw each round.
- **Real-Time Canvas Drawing**:
  - Raw HTML5 Canvas API with sub-pixel and coordinate scaling (800×600 virtual resolution) ensuring identical stroke rendering across any screen size.
  - Client-side delta batching via `requestAnimationFrame` for high-performance, low-latency transmission.
  - Drawing tools: 12-color vibrant palette, 4 brush thickness levels (S, M, L, XL), Undo (`draw_undo`), and Clear Canvas (`canvas_clear`).
- **Secret Word Selection**: Drawer chooses from 3 randomized words from a seed dictionary of 100+ categorized words.
- **Real-Time Guessing & Dynamic Scoring**:
  - Case-insensitive, whitespace-trimmed guess evaluation strictly on the server.
  - Speed-based scoring bonus rewarding faster correct guesses.
  - Masked chat notifications (`"PlayerX guessed the word!"`) preventing other players from copying correct answers.
- **Live Leaderboard & Game Over**:
  - Real-time score updates on the sidebar.
  - Round-end intermission modal showing the revealed word and next drawer.
  - Final game-over podium screen highlighting the winner and top rankings.

### Enhanced Experience
- **Timed Hint Reveals**: Automatic progressive letter reveals (e.g. `_ _ a _ _`) spaced evenly across the draw time based on room hint settings.
- **Server-Authoritative Countdown**: Timer driven by server-sent `deadlineTimestamp`, completely immune to client tab throttling or background sleep.
- **Public Lobby Browser**: Browse and join open public games directly from the home screen.
- **Invite Link Sharing**: Joining via `/?room=CODE` automatically pre-fills and activates the room join flow.
- **Modern Dark UI Design**: Glassmorphic UI with sleek typography (Outfit & Fredoka), warm amber accents, and responsive layout.

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | React 19 + Vite | Fast SPA, reactive state management, responsive UI |
| **Canvas Engine** | Raw HTML5 Canvas API | Low-overhead vector rendering, custom pointer capture, delta batching |
| **Styling** | Vanilla CSS Design System | Modern dark glassmorphic aesthetic with custom CSS variables |
| **Backend** | Node.js + Express (ES Modules) | REST routes, room validation, health checks |
| **Realtime Engine** | Socket.IO | Bi-directional event stream for drawing, chat, and game state |
| **Database** | MongoDB + Mongoose | Room persistence, word lists, and game summary records (TTL auto-cleanup) |
| **Deployment**| Render | Frontend Static Site + Backend Web Service |

---

## 📂 Project Structure

```
scribble-party/
├── client/                     # Vite + React (JavaScript)
│   ├── public/
│   │   └── favicon.svg         # Modern vector squircle SVG favicon
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat/
│   │   │   │   └── ChatPanel.jsx       # Real-time chat stream & guess input
│   │   │   ├── Game/
│   │   │   │   ├── Canvas.jsx          # Pointer capture, delta batching & rendering
│   │   │   │   ├── Toolbar.jsx         # Color picker, stroke size, undo, clear
│   │   │   │   ├── WordBanner.jsx      # Secret word / hint display
│   │   │   │   ├── Timer.jsx           # Authoritative round countdown clock
│   │   │   │   └── WordChoiceModal.jsx # Drawer secret word picker modal
│   │   │   ├── Lobby/
│   │   │   │   └── Lobby.jsx           # Player roster, room settings, start trigger
│   │   │   └── Scoreboard/
│   │   │       └── Scoreboard.jsx      # Live ranks, round-end & game-over modals
│   │   ├── constants/
│   │   │   └── events.js               # Shared Socket.IO event name constants
│   │   ├── hooks/
│   │   │   ├── useGameState.js         # Full game state machine and event handlers
│   │   │   └── useSocket.js            # Centralized Socket.IO client instance
│   │   ├── pages/
│   │   │   ├── Home.jsx                # Create, Join, and Public room browser
│   │   │   └── RoomPage.jsx            # Orchestrates Lobby and Game views
│   │   ├── App.jsx                     # Top navbar, toast alerts, page router
│   │   ├── index.css                   # Vibrant modern CSS design system
│   │   └── main.jsx                    # React entry point
│   ├── index.html                      # App shell, SEO meta tags & fonts
│   └── package.json
│
├── server/                     # Node.js + Express + Socket.IO (ES Modules)
│   ├── src/
│   │   ├── classes/
│   │   │   ├── Game.js                 # Pure game logic, timers, scoring & stroke buffer
│   │   │   ├── MessageHandler.js       # Socket event authorization & routing
│   │   │   ├── Player.js               # Player entity & session tracking
│   │   │   ├── Room.js                 # Room lifecycle, player map & authoritative broadcast()
│   │   │   └── WordBank.js             # Word dictionary loader & non-repeating picker
│   │   ├── config/
│   │   │   └── db.js                   # Mongoose connection with graceful fallback
│   │   ├── data/
│   │   │   └── words.json              # Categorized word database (animals, food, etc.)
│   │   ├── models/
│   │   │   ├── GameResultModel.js      # Mongoose game summary snapshot schema
│   │   │   ├── RoomModel.js            # Mongoose Room schema with 6h TTL index
│   │   │   └── WordListModel.js        # Mongoose WordList schema
│   │   ├── routes/
│   │   │   ├── health.js               # GET /api/health for Render liveness checks
│   │   │   └── rooms.js                # GET /api/rooms/:code & GET /api/rooms/public
│   │   ├── socket/
│   │   │   └── index.js                # Socket connection lifecycle & late join replay
│   │   └── server.js                   # Express app, HTTP server, Socket.IO attach, CORS
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## ⚡ Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18, v20, or v22+)
- [npm](https://www.npmjs.com/)
- *Optional:* Local [MongoDB](https://www.mongodb.com/) instance or free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster. *(If MongoDB is offline, the server runs smoothly in in-memory mode without crashing).*

---

### 1. Backend Server Setup

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory:
```env
PORT=5000
CLIENT_URL=http://localhost:5173
MONGO_URI=mongodb://127.0.0.1:27017/skribbl
```

Start the backend server in development mode (with nodemon):
```bash
npm run dev
```
> Server runs on `http://localhost:5000` (Health check: `http://localhost:5000/api/health`).

---

### 2. Frontend Client Setup

In a new terminal window:

```bash
cd client
npm install
```

Create a `.env` file in the `client/` directory:
```env
VITE_SERVER_URL=http://localhost:5000
```

Start the Vite development server:
```bash
npm run dev
```
> Client runs on `http://localhost:5173`.

---

## 🧪 Testing the Multiplayer Flow

1. Open `http://localhost:5173` in your browser (**Player 1 / Host**).
2. Click **Create Room**, adjust settings (rounds, draw time, max players), and click **Create Room**.
3. Note the 6-character room code (e.g. `ABCD23`) or click **Copy Invite Link**.
4. Open an incognito window or a second browser tab at `http://localhost:5173` (**Player 2**).
5. Enter a nickname (e.g. `GuesserBob`), enter the room code, and click **Join Game**.
6. In Tab 1 (Host), click **Start Game**.
7. The chosen drawer selects a word from the 3 choices.
8. Draw on the canvas in Tab 1 $\rightarrow$ strokes appear in real time in Tab 2!
9. In Tab 2, type guesses into the chat input $\rightarrow$ upon correct guess, points are awarded, notification is masked, and leaderboard updates!

---

## ☁️ Deployment on Render

Both the client and server are configured for seamless hosting on [Render](https://render.com):

### 1. Backend Web Service
- **Root Directory**: `server`
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `node src/server.js` (or `npm start`)
- **Environment Variables**:
  - `PORT`: `10000` (or default assigned by Render)
  - `CLIENT_URL`: `https://scribble-party-client.onrender.com`
  - `MONGO_URI`: `<YOUR-MONGODB-ATLAS-CONNECTION-STRING>`
- **Health Check Path**: `/api/health`

### 2. Frontend Static Site
- **Root Directory**: `client`
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Environment Variables**:
  - `VITE_SERVER_URL`: `https://scribble-party-server.onrender.com`
- **Redirects/Rewrites**:
  - Source: `/*` $\rightarrow$ Destination: `/index.html` (Action: `Rewrite` for SPA routing)

---

## 🧠 Architectural Deep-Dive

### 1. Real-Time Canvas Pipeline: From `pointerdown` to Remote Pixels
1. **Pointer Capture & Virtual Coordinates**: When the drawer interacts with the canvas in `Canvas.jsx`, `pointerdown` is captured. Viewport screen coordinates are projected onto a fixed virtual resolution ($800 \times 600$), ensuring identical brush positions across screens from mobile to 4K displays.
2. **Delta Batching via `requestAnimationFrame`**: As the drawer moves the pointer, coordinate deltas (`{x, y}`) are queued into a local buffer. On every animation frame tick, the batch is emitted over WebSockets as `draw_move` with stroke properties (color, size).
3. **Server Authorization & History Buffer**: `MessageHandler.js` verifies that the sender's socket ID matches the active round's `drawerId`. The stroke is appended to `Game.strokes[]` (for mid-round replay to late joiners) and broadcast to other clients via `Room.broadcast('draw_data', stroke)`.
4. **Target Canvas Rendering**: Other clients receive `draw_data` via Socket.IO, connect consecutive points with `ctx.lineTo(...)`, set matching `lineWidth` and `strokeStyle`, and stroke the path smoothly.

### 2. Single Source of Truth for Game State & Timers
All mutable game states (active round, drawer pointer, secret word, player scores, deadlines) reside strictly in the server's in-memory `Game` instance:
- **Server-Authoritative Timing**: The round timer is driven by a server Node.js timer. The server broadcasts a single `deadlineTimestamp` (epoch ms) to clients. Clients only compute a visual countdown from this timestamp—preventing client tab throttling or sleeping tabs from desynchronizing the game.
- **Safe State Serialization**: `Room.toPublicState(recipientSocketId)` ensures the unmasked secret word is **never sent to non-drawer sockets** before `round_end`.

### 3. Server-Side Guess Validation
Guesses are processed in `Game.checkGuess(player, text)`:
- Both the guess and the secret word are sanitized: trimmed of outer whitespace, converted to lowercase, and internal consecutive spaces collapsed to a single space (`s.trim().toLowerCase().replace(/\s+/g, ' ')`).
- Guesses from the active drawer are ignored.
- A player who already guessed correctly cannot score multiple times in the same round.
- Scores are calculated dynamically: faster correct guesses earn higher points ($100 \text{ base} + \text{speed bonus} + \text{first-guesser bonus}$).

### 4. High Performance In-Memory Execution
- Drawing strokes and guesses happen dozens of times per second. Reading or writing to a database on every stroke or guess would introduce latency and database bottlenecks.
- Therefore, all live interactions happen **100% in memory** within the Node process.
- MongoDB is only touched at non-critical lifecycle boundaries:
  1. Persisting room metadata on `create_room`.
  2. Saving final game leaderboard snapshots to `GameResultModel` on `game_over`.
  3. Built-in TTL index (`expiresAt`) automatically purging abandoned rooms after 6 hours without needing cron jobs.

---

## 📜 License
MIT License. Built with passion as an end-to-end real-time drawing and guessing game.
