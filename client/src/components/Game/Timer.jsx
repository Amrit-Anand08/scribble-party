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

  // Hide timer completely when no active deadline (e.g. during choosing phase or between rounds)
  if (!deadlineTimestamp || secondsRemaining === 0) {
    return null;
  }

  const isLow = secondsRemaining <= 10;

  return (
    <div className={`timer-badge ${isLow ? 'warning' : ''}`}>
      <span>⏱</span>
      <span>{secondsRemaining}s</span>
    </div>
  );
}
