import React from 'react';

export function WordBanner({ word, isDrawer, wordLength }) {
  const displayLength = wordLength || (word ? word.replace(/\s/g, '').length : 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="word-banner">
        {word || '_ _ _ _ _'}
      </div>
      <div style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600, letterSpacing: '0.5px' }}>
        {isDrawer ? '🎨 You are drawing!' : `${displayLength} letters`}
      </div>
    </div>
  );
}
