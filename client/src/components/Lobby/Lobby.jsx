import React, { useState } from 'react';
import { SOCKET_EVENTS } from '../../constants/events';

export function Lobby({ socket, room, myPlayer, players, isHost, showToast }) {
  const [copied, setCopied] = useState(false);
  const [settings, setSettings] = useState({
    rounds: room?.settings?.rounds || 3,
    drawTimeSec: room?.settings?.drawTimeSec || 80,
    maxPlayers: room?.settings?.maxPlayers || 8,
    wordCount: room?.settings?.wordCount || 3,
    hints: room?.settings?.hints ?? 2
  });

  const handleCopyLink = () => {
    const inviteUrl = `${window.location.origin}/?room=${room.roomCode}`;
    navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
    showToast('Invite link copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.roomCode);
    setCopied(true);
    showToast(`Room code ${room.roomCode} copied!`, 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleStartGame = () => {
    if (!socket || !isHost) return;
    if (players.length < 2) {
      // Bug 5 fix: return early so we don't emit to the server (which would
      // produce a second "Need at least 2 players" error toast on top of this one).
      showToast('Need at least 2 players to start!', 'error');
      return;
    }
    socket.emit(SOCKET_EVENTS.START_GAME, {});
  };

  return (
    <div className="home-wrapper">
      <div className="home-card">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <span style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', color: '#818cf8', fontWeight: 700 }}>
            Game Lobby
          </span>
          <h1 className="home-hero-title" style={{ fontSize: '32px', marginTop: '4px' }}>
            Room {room.roomCode}
          </h1>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '12px' }}>
            <button type="button" className="btn-secondary" onClick={handleCopyCode}>
              📋 Code: <strong>{room.roomCode}</strong>
            </button>
            <button type="button" className="btn-secondary" onClick={handleCopyLink}>
              🔗 {copied ? 'Copied!' : 'Copy Invite Link'}
            </button>
          </div>
        </div>

        {/* Players List */}
        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '14px', fontWeight: 600, color: '#94a3b8' }}>
            <span>Players ({players.length}/{settings.maxPlayers})</span>
            {isHost && <span style={{ color: '#fbbf24' }}>👑 You are Host</span>}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
            {players.map((p) => {
              const isRoomHost = p.id === room.hostId;
              const isMe = p.id === myPlayer?.id;

              return (
                <div
                  key={p.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    background: isMe ? 'rgba(99, 102, 241, 0.2)' : 'rgba(15, 23, 42, 0.6)',
                    border: `1px solid ${isMe ? 'rgba(99, 102, 241, 0.4)' : 'rgba(255, 255, 255, 0.06)'}`,
                    borderRadius: '8px'
                  }}
                >
                  <div className="player-avatar" style={{ width: '28px', height: '28px', fontSize: '12px' }}>
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '14px', fontWeight: 600 }}>
                    {p.name} {isRoomHost && '👑'} {isMe && '(You)'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Room Settings Summary / Controls */}
        <div style={{ background: 'rgba(15, 23, 42, 0.5)', borderRadius: '12px', padding: '16px', marginBottom: '24px' }}>
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '10px' }}>
            Room Settings
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
            <div>
              <span style={{ color: '#94a3b8' }}>Rounds: </span>
              <strong>{settings.rounds}</strong>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>Draw Time: </span>
              <strong>{settings.drawTimeSec}s</strong>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>Word Choices: </span>
              <strong>{settings.wordCount}</strong>
            </div>
            <div>
              <span style={{ color: '#94a3b8' }}>Letter Hints: </span>
              <strong>{settings.hints}</strong>
            </div>
          </div>
        </div>

        {/* Start Game Button */}
        {isHost ? (
          <button
            type="button"
            className="btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '18px' }}
            onClick={handleStartGame}
          >
            🚀 Start Game {players.length < 2 ? '(Need 2+ Players)' : ''}
          </button>
        ) : (
          <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '15px', padding: '12px' }}>
            ⏳ Waiting for the host to start the game...
          </div>
        )}
      </div>
    </div>
  );
}
