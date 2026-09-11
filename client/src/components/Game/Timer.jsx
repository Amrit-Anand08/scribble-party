import React, { useState, useEffect } from 'react';

export function Timer({ deadlineTimestamp }) {
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  useEffect(() => {
    if (!deadlineTimestamp) {
      setSecondsRemaining(0);
      return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const diff = Math.max(0, Math.ceil((deadlineTimestamp - now) / 1000));
      setSecondsRemaining(diff);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 500);

    return () => clearInterval(interval);
  }, [deadlineTimestamp]);

  const isLow = secondsRemaining > 0 && secondsRemaining <= 10;

  return (
    <div className={`timer-badge ${isLow ? 'warning' : ''}`}>
      <span>⏱</span>
      <span>{secondsRemaining}s</span>
    </div>
  );
}
