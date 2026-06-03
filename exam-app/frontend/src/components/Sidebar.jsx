import React from 'react';

export default function Sidebar({ days, activeDay, setActiveDay, doneTopics, totalTopics, dayPercent, pomodoroSessions, weakTopics }) {
  const overallPct = totalTopics > 0 ? Math.round((doneTopics / totalTopics) * 100) : 0;
  const undone = totalTopics - doneTopics;
  const estHours = Math.round((undone * 8) / 60 * 10) / 10; // 8 min per topic average

  const dotClass = (status) => {
    switch (status) {
      case 'today': return 'dot-today';
      case 'done': return 'dot-done';
      case 'review': return 'dot-review';
      default: return 'dot-future';
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-title">7-day plan</div>
        <div className="overall-bar-wrap">
          <div className="overall-bar">
            <div className="overall-bar-fill" style={{ width: `${overallPct}%` }}></div>
          </div>
          <div className="stats-mini">
            <span>{doneTopics} topics done</span>
            <span>of {totalTopics}</span>
          </div>
        </div>
      </div>

      <div className="day-list">
        {days.map((day, i) => {
          const pct = dayPercent(i);
          return (
            <div className="day-item" key={day.id} onClick={() => setActiveDay(i)}>
              <div className={`day-item-head ${i === activeDay ? 'active' : ''}`}>
                <div className={`day-dot ${dotClass(day.status)}`}>{i + 1}</div>
                <div className="day-info">
                  <div className="day-name">{day.label}</div>
                  <div className="day-theme">{day.title}</div>
                </div>
                <div className="day-pct-small">{pct}%</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="study-stats">
        <div className="study-stats-title">Study Stats</div>
        <div className="stat-row">
          <span>🍅 Pomodoros</span>
          <span className="stat-val">{pomodoroSessions}</span>
        </div>
        <div className="stat-row">
          <span>🔴 Weak topics</span>
          <span className="stat-val">{weakTopics}</span>
        </div>
        <div className="stat-row">
          <span>⏱ Est. remaining</span>
          <span className="stat-val">{estHours}h</span>
        </div>
      </div>
    </div>
  );
}
