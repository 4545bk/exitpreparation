import React from 'react';

export default function Timer({ timer }) {
  const { mode, timeLeft, running, sessionCount, toggleTimer, resetTimer, switchMode, formatTime } = timer;

  const displayClass = `timer-display ${running ? 'running' : ''} ${(mode === 'short' || mode === 'long') && running ? 'break-time' : ''}`;

  return (
    <div className="timer-card">
      <div className={displayClass}>{formatTime(timeLeft)}</div>
      <div className="timer-right">
        <div className="timer-mode-row">
          <button className={`tmode ${mode === 'focus' ? 'active' : ''}`} onClick={() => switchMode('focus')}>Focus 25</button>
          <button className={`tmode ${mode === 'short' ? 'active' : ''}`} onClick={() => switchMode('short')}>Break 5</button>
          <button className={`tmode ${mode === 'long' ? 'active' : ''}`} onClick={() => switchMode('long')}>Long 15</button>
        </div>
        <div className="timer-btns">
          <button className="tbtn primary" onClick={toggleTimer}>
            {running ? '⏸ Pause' : '▶ Start'}
          </button>
          <button className="tbtn" onClick={resetTimer}>Reset</button>
        </div>
        <div className="session-dots">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={`sdot ${i < (sessionCount % 4) ? 'done' : ''}`}></div>
          ))}
          <span className="timer-msg">4 sessions = long break</span>
        </div>
      </div>
    </div>
  );
}
