import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import { Server } from 'socket.io';
import { connectDB } from './config/db.js';
import healthRouter from './routes/health.js';
import { createRoomRouter } from './routes/rooms.js';
import { setupSockets } from './socket/index.js';

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server) or matching origins
    if (!origin || origin === CLIENT_URL || origin.includes('localhost') || origin.includes('127.0.0.1') || origin.endsWith('.onrender.com')) {
      callback(null, true);
    } else {
      callback(null, true); // Permissive for easy dev & staging
    }
  },
  credentials: true
}));

app.use(express.json());

// In-memory rooms state (Mongo is strictly off the hot path)
const roomsByCode = new Map();
const roomsById = new Map();

// REST Routes
app.use('/api', healthRouter);
app.use('/api', createRoomRouter({ roomsByCode }));

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

setupSockets(io, { roomsByCode, roomsById });

// Start server
server.listen(PORT, async () => {
  console.log(`[Server] Skribbl server running on port ${PORT}`);
  console.log(`[Server] Health check available at http://localhost:${PORT}/api/health`);
  await connectDB();
});

export { app, server, io };
