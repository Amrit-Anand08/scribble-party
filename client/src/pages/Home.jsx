import React, { useState, useEffect } from 'react';
import { SOCKET_EVENTS } from '../constants/events';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

export function Home({ socket, showToast }) {
  const [activeTab, setActiveTab] = useState('join'); // 'create' | 'join' | 'public'
  const [playerName, setPlayerName] = useState(() => {
    return localStorage.getItem('skribbl_player_name') || `Player${Math.floor(100 + Math.random() * 900)}`;
  });
  const [roomCode, setRoomCode] = useState('');
  const [publicRooms, setPublicRooms] = useState([]);
  const [isLoadingPublic, setIsLoadingPublic] = useState(false);

  // Settings for room creation
  const [settings, setSettings] = useState({
    maxPlayers: 8,
    rounds: 3,
    drawTimeSec: 80,
    wordCount: 3,
    hints: 2,
    isPublic: false
  });

  // Check URL search params for ?room=CODE
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('room');
    if (codeParam) {
      setRoomCode(codeParam.toUpperCase());
      setActiveTab('join');
    }
  }, []);

  // Save player name
  const updatePlayerName = (name) => {
    setPlayerName(name);
    localStorage.setItem('skribbl_player_name', name);
  };

  const handleCreateRoom = (e) => {
    e.preventDefault();
    if (!socket) return;
    const cleanName = playerName.trim();
    if (!cleanName) {
      showToast('Please enter your name', 'error');
      return;
    }

    socket.emit(SOCKET_EVENTS.CREATE_ROOM, {
      hostName: cleanName,
      settings
    });
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!socket) return;
    const cleanName = playerName.trim();
    const cleanCode = roomCode.trim().toUpperCase();

    if (!cleanName) {
      showToast('Please enter your name', 'error');
      return;
    }
    if (!cleanCode) {
      showToast('Please enter a room code', 'error');
      return;
    }

    socket.emit(SOCKET_EVENTS.JOIN_ROOM, {
      roomCode: cleanCode,
      playerName: cleanName
    });
  };

  const fetchPublicRooms = async () => {
    setIsLoadingPublic(true);
    try {
      const res = await fetch(`${SERVER_URL}/api/rooms/public`);
      if (res.ok) {
        const data = await res.json();
        setPublicRooms(data.rooms || []);
      }
    } catch (err) {
      console.warn('[Home] Error fetching public rooms:', err);
    } finally {
      setIsLoadingPublic(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'public') {
      fetchPublicRooms();
    }
  }, [activeTab]);

  return (
    <div className="home-wrapper">
      <div className="home-card">
        <h1 className="home-hero-title">Scribble Party</h1>
        <p className="home-hero-desc">
          Real-time multiplayer drawing & guessing fun!
        </p>

        {/* Tabs Header */}
        <div className="tabs-header">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'join' ? 'active' : ''}`}
            onClick={() => setActiveTab('join')}
          >
            Join Room
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            Create Room
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === 'public' ? 'active' : ''}`}
            onClick={() => setActiveTab('public')}
          >
            Public Rooms
          </button>
        </div>

        {/* Global Player Name Input */}
        <div className="form-group">
          <label className="form-label">Your Nickname</label>
          <input
            type="text"
            className="form-input"
            value={playerName}
            onChange={(e) => updatePlayerName(e.target.value)}
            maxLength={18}
            placeholder="Enter player name"
            required
          />
        </div>

        {/* Tab 1: Join Room */}
        {activeTab === 'join' && (
          <form onSubmit={handleJoinRoom}>
            <div className="form-group">
              <label className="form-label">Room Code</label>
              <input
                type="text"
                className="form-input"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="6-LETTER CODE (e.g. ABCD23)"
                maxLength={6}
                required
              />
            </div>
            <button type="submit" className="btn-primary" style={{ width: '100%' }}>
              Join Game
            </button>
          </form>
        )}

        {/* Tab 2: Create Room */}
        {activeTab === 'create' && (
          <form onSubmit={handleCreateRoom}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label className="form-label">Rounds ({settings.rounds})</label>
                <select
                  className="form-input"
                  value={settings.rounds}
                  onChange={(e) => setSettings({ ...settings, rounds: Number(e.target.value) })}
                >
                  <option value={2}>2 Rounds</option>
                  <option value={3}>3 Rounds (Standard)</option>
                  <option value={5}>5 Rounds</option>
                  <option value={8}>8 Rounds</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Draw Time ({settings.drawTimeSec}s)</label>
                <select
                  className="form-input"
                  value={settings.drawTimeSec}
                  onChange={(e) => setSettings({ ...settings, drawTimeSec: Number(e.target.value) })}
                >
                  <option value={30}>30 Seconds (Fast)</option>
                  <option value={60}>60 Seconds</option>
                  <option value={80}>80 Seconds (Standard)</option>
                  <option value={120}>120 Seconds</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Max Players</label>
                <select
                  className="form-input"
                  value={settings.maxPlayers}
                  onChange={(e) => setSettings({ ...settings, maxPlayers: Number(e.target.value) })}
                >
                  <option value={4}>4 Players</option>
                  <option value={8}>8 Players</option>
                  <option value={12}>12 Players</option>
                  <option value={16}>16 Players</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Hints (0-5)</label>
                <select
                  className="form-input"
                  value={settings.hints}
                  onChange={(e) => setSettings({ ...settings, hints: Number(e.target.value) })}
                >
                  <option value={0}>0 (Hardcore)</option>
                  <option value={1}>1 Hint</option>
                  <option value={2}>2 Hints (Standard)</option>
                  <option value={3}>3 Hints</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <input
                type="checkbox"
                id="isPublic"
                checked={settings.isPublic}
                onChange={(e) => setSettings({ ...settings, isPublic: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: 'var(--accent-primary)' }}
              />
              <label htmlFor="isPublic" style={{ fontSize: '14px', color: '#cbd5e1', cursor: 'pointer' }}>
                List as Public Room (allow anyone to browse and join)
              </label>
            </div>

            <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '8px' }}>
              Create Room
            </button>
          </form>
        )}

        {/* Tab 3: Public Rooms */}
        {activeTab === 'public' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <span style={{ fontSize: '14px', color: '#94a3b8' }}>Open lobbies to join:</span>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '4px 8px', fontSize: '12px' }}
                onClick={fetchPublicRooms}
              >
                🔄 Refresh
              </button>
            </div>

            {isLoadingPublic ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                Loading public rooms...
              </div>
            ) : publicRooms.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8' }}>
                No open public rooms found right now. Create one and check "List as Public Room"!
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {publicRooms.map((r) => (
                  <div
                    key={r.roomCode}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: 'rgba(15, 23, 42, 0.6)',
                      borderRadius: '8px'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: '#f8fafc' }}>
                        Room {r.roomCode}
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                        Host: {r.hostName} • {r.rounds} Rounds • {r.drawTimeSec}s
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ padding: '6px 14px', fontSize: '13px' }}
                      onClick={() => {
                        setRoomCode(r.roomCode);
                        if (socket) {
                          socket.emit(SOCKET_EVENTS.JOIN_ROOM, {
                            roomCode: r.roomCode,
                            playerName: playerName.trim()
                          });
                        }
                      }}
                    >
                      Join ({r.playerCount}/{r.maxPlayers})
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
