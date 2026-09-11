import React, { useState, useEffect } from 'react';
import { Lobby } from '../components/Lobby/Lobby';
import { Canvas } from '../components/Game/Canvas';
import { Toolbar } from '../components/Game/Toolbar';
import { WordBanner } from '../components/Game/WordBanner';
import { Timer } from '../components/Game/Timer';
import { WordChoiceModal } from '../components/Game/WordChoiceModal';
import { ChatPanel } from '../components/Chat/ChatPanel';
import { Scoreboard } from '../components/Scoreboard/Scoreboard';

export function RoomPage({ socket, gameState }) {
  const {
    room,
    myPlayer,
    players,
    phase,
    round,
    totalRounds,
    drawerId,
    drawerName,
    wordOptions,
    currentWord,
    wordLength,
    deadlineTimestamp,
    messages,
    roundEndData,
    gameOverData,
    isHost,
    isDrawer,
    showToast,
    resetToLobby
  } = gameState;

  // Active drawing tools state
  const [activeColor, setActiveColor] = useState('#000000');
  const [activeBrushSize, setActiveBrushSize] = useState(8);

  // Dynamic document.title override
  useEffect(() => {
    if (room?.roomCode) {
      document.title = `Room ${room.roomCode} — Scribble Party`;
    }
    return () => {
      document.title = 'Scribble Party — Draw & Guess Multiplayer Game';
    };
  }, [room?.roomCode]);

  // If still in lobby phase
  if (phase === 'lobby') {
    return (
      <Lobby
        socket={socket}
        room={room}
        myPlayer={myPlayer}
        players={players}
        isHost={isHost}
        showToast={showToast}
      />
    );
  }

  // Resolve the display name for the current drawer.
  // When the local user IS the drawer, drawerName may not be set (the server
  // only sends drawerName to non-drawers via round_start_broadcast). Fall back
  // to myPlayer.name in that case.
  const resolvedDrawerName = isDrawer ? (myPlayer?.name || 'You') : (drawerName || 'Player');

  // Active Game screen (choosing, drawing, round_end, game_over)
  return (
    <div className="game-layout">
      {/* Left Column: Scoreboard */}
      <Scoreboard
        players={players}
        myPlayerId={myPlayer?.id}
        drawerId={drawerId}
        round={round}
        totalRounds={totalRounds}
        roundEndData={roundEndData}
        gameOverData={gameOverData}
        onPlayAgain={resetToLobby}
      />

      {/* Middle Column: Canvas Container */}
      <div className="canvas-container">
        <div className="canvas-header">
          <Timer deadlineTimestamp={deadlineTimestamp} />
          <WordBanner
            word={currentWord}
            isDrawer={isDrawer}
            wordLength={wordLength}
          />
          <div style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8' }}>
            {isDrawer ? '🎨 Your Turn to Draw!' : `✏️ Drawer: ${resolvedDrawerName}`}
          </div>
        </div>

        {/* The Raw Canvas surface */}
        <Canvas
          socket={socket}
          isDrawer={isDrawer}
          activeColor={activeColor}
          activeBrushSize={activeBrushSize}
        />

        {/* Toolbar (drawer only) */}
        {isDrawer && (
          <Toolbar
            socket={socket}
            activeColor={activeColor}
            setActiveColor={setActiveColor}
            activeBrushSize={activeBrushSize}
            setActiveBrushSize={setActiveBrushSize}
          />
        )}
      </div>

      {/* Right Column: Chat & Guessing Panel */}
      <ChatPanel
        socket={socket}
        messages={messages}
        isDrawer={isDrawer}
        myPlayer={myPlayer}
      />

      {/* Word Choices Modal for Drawer */}
      {phase === 'choosing' && (
        <WordChoiceModal
          socket={socket}
          wordOptions={wordOptions}
          isDrawer={isDrawer}
          drawerName={resolvedDrawerName}
        />
      )}
    </div>
  );
}
