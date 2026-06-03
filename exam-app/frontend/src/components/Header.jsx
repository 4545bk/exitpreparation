import React, { useState, useEffect } from 'react';

const EXAM_DATE = new Date('2026-06-10T08:00:00');

export default function Header({ doneTopics, totalTopics, lastSaved, saving, backendOk, view, setView }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const diff = EXAM_DATE - now;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);

  const countdown = diff > 0
    ? `${days}d ${hours}h ${mins}m ${secs}s to exam`
    : 'EXAM TIME — GO!';

  const pct = totalTopics > 0 ? Math.round((doneTopics / totalTopics) * 100) : 0;

  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric'
  }) + ' · ' + now.toLocaleTimeString('en-US', {
    hour: '2-digit', minute: '2-digit'
  });

  let saveText = '';
  if (saving) saveText = 'saving...';
  else if (!backendOk) saveText = '⚠ offline (localStorage)';
  else if (lastSaved) {
    const ago = Math.round((now - new Date(lastSaved)) / 60000);
    saveText = ago < 1 ? 'Saved ✓' : `Saved ${ago}m ago ✓`;
  }

  return (
    <div className="header">
      <div className="logo-group" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <div className="logo" style={{ cursor: 'pointer' }} onClick={() => setView('study')}>
          study<span>_hq</span><span style={{ color: 'var(--accent2)' }}>.exe</span>
        </div>
        <div className="nav-group" style={{ display: 'flex', gap: '8px' }}>
          <button className={`nav-btn ${view === 'study' ? 'active' : ''}`} onClick={() => setView('study')}>
            📖 Study Plan
          </button>
          <button className={`nav-btn ${view === 'simulator' ? 'active' : ''}`} onClick={() => setView('simulator')}>
            📝 Exam Simulator
          </button>
          <button className={`nav-btn ${view === 'jexams' ? 'active' : ''}`} onClick={() => setView('jexams')}>
            ⚡ J-Exams
          </button>
        </div>
      </div>
      
      <div className="header-center">
        <div className="countdown">{countdown}</div>
        <div className="date-now">{dateStr}</div>
      </div>
      
      <div style={{ textAlign: 'right' }}>
        <div className="overall-pct">{pct}%</div>
        <div className="overall-label">overall done</div>
        {saveText && <div className="save-indicator">{saveText}</div>}
      </div>
    </div>
  );
}
