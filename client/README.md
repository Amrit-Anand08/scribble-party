# 🎨 Scribble Party — Client Application

The official frontend web application for **Scribble Party**, a real-time multiplayer drawing and guessing game. Built with **React 19**, **Vite**, **HTML5 Canvas**, and **Socket.IO Client**.

---

## 🚀 Live Demo
Play online: [https://scribble-party-client.onrender.com](https://scribble-party-client.onrender.com)

---

## 🛠 Tech Stack & Libraries

- **Framework**: [React 19](https://react.dev/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Real-Time WebSockets**: [socket.io-client](https://socket.io/) (v4.8+)
- **Canvas Rendering**: Raw HTML5 Canvas API (virtual resolution coordinate projection)
- **Styling**: Vanilla CSS Design System with dark glassmorphic tokens, CSS variables, and Google Fonts ([Outfit](https://fonts.google.com/specimen/Outfit) & [Fredoka](https://fonts.google.com/specimen/Fredoka))
- **Linter**: [Oxlint](https://oxc.rs/)

---

## 📂 Architecture & Directory Structure

```
client/
├── public/
│   └── favicon.svg         # Clean minimalist vector SVG favicon
├── src/
│   ├── components/
│   │   ├── Chat/
│   │   │   └── ChatPanel.jsx       # Real-time chat messages, guesses & system notifications
│   │   ├── Game/
│   │   │   ├── Canvas.jsx          # Pointer capture, delta batching & vector rendering
│   │   │   ├── Toolbar.jsx         # Color palette, stroke sizes, undo & clear canvas
│   │   │   ├── WordBanner.jsx      # Masked hints / active drawer word display
│   │   │   ├── Timer.jsx           # Server-synchronized round countdown timer
│   │   │   └── WordChoiceModal.jsx # Drawer 3-word selection modal
│   │   ├── Lobby/
│   │   │   └── Lobby.jsx           # Player waiting room, settings configuration & start button
│   │   └── Scoreboard/
│   │       └── Scoreboard.jsx      # Player rankings, round-end review & podium modals
│   ├── constants/
│   │   └── events.js               # Standardized Socket.IO event strings
│   ├── hooks/
│   │   ├── useSocket.js            # Socket instance creation, connection state & reconnects
│   │   └── useGameState.js         # Reactive game state machine & socket listeners
│   ├── pages/
│   │   ├── Home.jsx                # Join Room, Create Room & Public Room browser tabs
│   │   └── RoomPage.jsx            # Orchestrates Lobby and active Game views
│   ├── App.css                     # Global styles
│   ├── App.jsx                     # Top navigation, status indicator & toast alerts
│   ├── index.css                   # Comprehensive design system, theme variables & animations
│   └── main.jsx                    # React application entry point
├── index.html                      # HTML5 shell, Open Graph meta tags & font imports
├── package.json                    # Scripts and dependencies
└── vite.config.js                  # Vite build configuration
```

---

## 🎨 Key Features

### 1. Canvas Engine (`Canvas.jsx`)
- **Coordinate Normalization**: Translates raw client viewport coordinates to a standardized **$800 \times 600$** virtual canvas coordinate space, ensuring strokes render identically regardless of client device resolution.
- **Delta Batching**: Leverages `requestAnimationFrame` to batch pointer movements, eliminating socket flooding and keeping bandwidth low.
- **Custom Tools**: 12 curated vibrant colors, 4 brush thicknesses, Undo, and Clear Canvas.

### 2. State Machine (`useGameState.js`)
- Manages complete room lifecycle: `LOBBY` $\rightarrow$ `SELECTING_WORD` $\rightarrow$ `DRAWING` $\rightarrow$ `ROUND_END` $\rightarrow$ `GAME_OVER`.
- Reactive toast notification system for player joins, leaves, and errors.
- Automatic word masking and progressive hint reveal synchronization.

### 3. Server-Authoritative Countdown (`Timer.jsx`)
- Computes remaining seconds against a server-issued `deadlineTimestamp`, completely immune to browser tab throttling or sleep mode desynchronization.

---

## ⚡ Getting Started Locally

### 1. Install Dependencies
```bash
cd client
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the `client/` folder:
```env
VITE_SERVER_URL=http://localhost:5000
```
> Point this to your backend server URL (local or deployed).

### 3. Start Development Server
```bash
npm run dev
```
The client will start at: `http://localhost:5173`

---

## 📦 Build & Production Commands

| Command | Description |
|---|---|
| `npm run dev` | Starts Vite local development server with HMR |
| `npm run build` | Compiles optimized production bundle into `dist/` |
| `npm run preview` | Locally preview the compiled production build |
| `npm run lint` | Runs Oxlint linter on the codebase |

---

## ☁️ Deployment

For static hosting platforms like **Render**, **Vercel**, or **Netlify**:
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`
- **Environment Variable**: `VITE_SERVER_URL=https://scribble-party-server.onrender.com`
- **SPA Rewrite Rule**: Route all requests `/*` $\rightarrow$ `/index.html`
