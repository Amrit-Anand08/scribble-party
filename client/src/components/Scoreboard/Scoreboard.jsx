import React from 'react';

export function Scoreboard({
  players,
  myPlayerId,
  drawerId,
  round,
  totalRounds,
  roundEndData,
  gameOverData,
  onPlayAgain
}) {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <>
      <div className="scoreboard-panel">
        <div className="scoreboard-title">
          <span>Leaderboard</span>
          <span style={{ fontSize: '13px', color: '#94a3b8' }}>
            Round {round} / {totalRounds}
          </span>
        </div>

        <ul className="players-list">
          {sortedPlayers.map((player, index) => {
            const isDrawing = player.id === drawerId;
            const hasGuessed = player.hasGuessedCorrectly;
            const isMe = player.id === myPlayerId;

            return (
              <li
                key={player.id}
                className={`player-card ${isDrawing ? 'is-drawer' : ''} ${hasGuessed ? 'guessed' : ''} ${isMe ? 'is-me' : ''}`}
              >
                <div className="player-info">
                  <div className="player-avatar">
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="player-name">
                      #{index + 1} {player.name}
                      {isMe && ' 👤'}
                      {isDrawing && ' ✏️'}
                      {hasGuessed && ' ✅'}
                    </div>
                  </div>
                </div>
                <div className="player-score">{player.score} pts</div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Round End Modal Overlay */}
      {roundEndData && (
        <div className="modal-overlay">
          <div className="modal-content">
            <span style={{ fontSize: '40px' }}>🔔</span>
            <h2 style={{ fontFamily: 'var(--font-fun)', fontSize: '26px', color: '#f8fafc', margin: '8px 0' }}>
              Round Over!
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '15px' }}>
              The word was:
            </p>
            <div
              style={{
                fontFamily: 'var(--font-fun)',
                fontSize: '32px',
                color: '#34d399',
                margin: '12px 0',
                letterSpacing: '1px'
              }}
            >
              {roundEndData.word}
            </div>
            <p style={{ color: '#a5b4fc', fontSize: '14px', marginTop: '16px' }}>
              Next drawer: <strong>{roundEndData.nextDrawerName || 'Next Player'}</strong>
            </p>
          </div>
        </div>
      )}

      {/* Game Over Modal Overlay */}
      {gameOverData && (
        <div className="modal-overlay">
          <div className="modal-content">
            <span style={{ fontSize: '48px' }}>🏆</span>
            <h2 style={{ fontFamily: 'var(--font-fun)', fontSize: '32px', color: '#f8fafc', margin: '8px 0' }}>
              Game Over!
            </h2>
            <p style={{ color: '#fbbf24', fontSize: '20px', fontWeight: 700, marginBottom: '20px' }}>
              🎉 {gameOverData.winnerName} Wins!
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
              {gameOverData.leaderboard?.slice(0, 5).map((entry, idx) => (
                <div
                  key={entry.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    background: 'rgba(15, 23, 42, 0.6)',
                    borderRadius: '8px',
                    fontWeight: 600
                  }}
                >
                  <span>
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}{' '}
                    {entry.name}
                  </span>
                  <span style={{ color: '#fbbf24' }}>{entry.score} pts</span>
                </div>
              ))}
            </div>

            {onPlayAgain && (
              <button type="button" className="btn-primary" onClick={onPlayAgain} style={{ width: '100%' }}>
                Back to Lobby
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}
