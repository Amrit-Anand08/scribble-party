import React from 'react';
import { useSocket } from './hooks/useSocket';
import { useGameState } from './hooks/useGameState';
import { Home } from './pages/Home';
import { RoomPage } from './pages/RoomPage';

export default function App() {
  const { socket, isConnected } = useSocket();
  const gameState = useGameState({ socket, isConnected });

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <header className="navbar">
        <div className="nav-brand">
          <span>🎨</span>
          <span>Scribble Party</span>
        </div>

        <div className="nav-status">
          <div className={`status-dot ${isConnected ? '' : 'disconnected'}`} />
          <span>{isConnected ? 'Connected' : 'Connecting...'}</span>

          {gameState.room && (
            <>
              <span style={{ marginLeft: '12px', color: '#f8fafc', fontWeight: 700 }}>
                Room: {gameState.room.roomCode}
              </span>
              {/* Leave Room button — always visible when inside a room */}
              <button
                type="button"
                className="btn-leave-room"
                onClick={gameState.leaveRoom}
                title="Leave this room and return to home"
              >
                ← Leave
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {!gameState.room ? (
          <Home
            socket={socket}
            showToast={gameState.showToast}
          />
        ) : (
          <RoomPage
            socket={socket}
            gameState={gameState}
          />
        )}
      </main>

      {/* Floating Toast Notification */}
      {gameState.toastMessage && (
        <div className={`toast ${gameState.toastMessage.type}`}>
          {gameState.toastMessage.type === 'error' && '⚠️ '}
          {gameState.toastMessage.type === 'success' && '✨ '}
          {gameState.toastMessage.type === 'info' && 'ℹ️ '}
          {gameState.toastMessage.text}
        </div>
      )}
    </div>
  );
}
