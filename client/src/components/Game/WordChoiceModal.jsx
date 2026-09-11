import React from 'react';
import { SOCKET_EVENTS } from '../../constants/events';

export function WordChoiceModal({ socket, wordOptions, isDrawer, drawerName }) {
  const handleSelectWord = (word) => {
    if (socket) {
      socket.emit(SOCKET_EVENTS.WORD_CHOSEN, { word });
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {isDrawer ? (
          <>
            <h2 style={{ fontFamily: 'var(--font-fun)', fontSize: '28px', color: '#f8fafc', marginBottom: '8px' }}>
              Choose a Word to Draw!
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '15px' }}>
              Pick one word from the options below:
            </p>
            <div className="word-choices-grid">
              {wordOptions.map((word) => (
                <button
                  key={word}
                  type="button"
                  className="word-choice-btn"
                  onClick={() => handleSelectWord(word)}
                >
                  {word}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <h2 style={{ fontFamily: 'var(--font-fun)', fontSize: '28px', color: '#f8fafc', marginBottom: '8px' }}>
              {drawerName || 'Drawer'} is choosing a word...
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '15px', marginTop: '12px' }}>
              Get ready to guess!
            </p>
            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
              <div className="status-dot" style={{ width: '16px', height: '16px' }}></div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
