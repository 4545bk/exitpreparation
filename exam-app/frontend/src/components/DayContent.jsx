import React, { useState } from 'react';
import TopicRow from './TopicRow';
import { LESSONS_DATA } from '../data/lessonsData';

export default function DayContent({ day, dayId, dayPercent, toggleTopic, setConf, addTopic, deleteTopic, onOpenPdf, showNotif }) {
  const [newText, setNewText] = useState('');
  const [selectedSession, setSelectedSession] = useState(0);
  const [viewMode, setViewMode] = useState('checklist'); // 'checklist' or 'lesson'

  if (!day) return <div className="empty-state"><div className="empty-icon">📭</div>No day selected</div>;

  const badgeClass = {
    today: 'badge-today',
    done: 'badge-done',
    review: 'badge-review',
    future: 'badge-future'
  }[day.status] || 'badge-future';

  const badgeText = {
    today: 'TODAY',
    done: 'DONE',
    review: 'EXAM EVE',
    future: 'UPCOMING'
  }[day.status] || 'UPCOMING';

  const handleAdd = () => {
    const text = newText.trim();
    if (!text) return;
    addTopic(dayId, selectedSession, text);
    setNewText('');
    showNotif('Topic added ✓');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  // Check if we have lessons for the current day
  let hasLessons = false;
  day.sessions.forEach((sess, sIdx) => {
    sess.topics.forEach((tp, tIdx) => {
      const key = `d${dayId}_${sIdx}_${tIdx}`;
      if (LESSONS_DATA[key]) {
        hasLessons = true;
      }
    });
  });

  return (
    <div className="fade-in" key={dayId}>
      {/* Day Header */}
      <div className="day-header-card">
        <div className="day-title-row">
          <div className="day-big-title">{day.title}</div>
          <span className={`day-badge ${badgeClass}`}>{badgeText}</span>
        </div>
        <div className="day-progress-row">
          <div className="day-prog-bar">
            <div className="day-prog-fill" style={{ width: `${dayPercent}%` }}></div>
          </div>
          <div className="day-prog-pct">{dayPercent}%</div>
        </div>
      </div>

      {/* View Mode Tabs */}
      <div className="view-mode-tabs">
        <button
          className={`view-tab ${viewMode === 'checklist' ? 'active' : ''}`}
          onClick={() => setViewMode('checklist')}
        >
          📋 Checklist View
        </button>
        <button
          className={`view-tab ${viewMode === 'lesson' ? 'active' : ''}`}
          onClick={() => setViewMode('lesson')}
        >
          📖 Detailed Study Guide
        </button>
      </div>

      {viewMode === 'lesson' && !hasLessons && (
        <div className="fallback-msg">
          ℹ️ Detailed study guide not available for this day. Showing Checklist View instead.
        </div>
      )}

      {/* Render detailed lessons if in lesson mode and we have lessons */}
      {viewMode === 'lesson' && hasLessons ? (
        day.sessions.map((session, sIdx) => {
          const done = session.topics.filter(t => t.done).length;
          return (
            <div className="session-section" key={sIdx}>
              <div className="session-head">
                <div className="session-name">{session.name}</div>
                <div className="session-count">{done}/{session.topics.length} done</div>
              </div>
              <div style={{ padding: '16px' }}>
                {session.topics.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📝</div>
                    No topics yet — add some in Checklist View
                  </div>
                ) : (
                  session.topics.map((topic, tIdx) => {
                    const key = `d${dayId}_${sIdx}_${tIdx}`;
                    const lessonHTML = LESSONS_DATA[key];

                    if (lessonHTML) {
                      return (
                        <div className="lesson-card" key={topic.id || tIdx}>
                          <div className="lesson-card-title">
                            <span>{topic.text}</span>
                          </div>
                          <div className="lesson-card-body" dangerouslySetInnerHTML={{ __html: lessonHTML }} />
                          <div className="lesson-footer">
                            <button
                              className={`cover-btn ${topic.done ? 'covered' : ''}`}
                              onClick={() => toggleTopic(dayId, sIdx, tIdx)}
                            >
                              {topic.done ? '✓ Covered' : 'Mark as Covered'}
                            </button>
                            <div className="conf-dots" style={{ marginTop: 0 }}>
                              <div
                                className={`cd ${topic.conf >= 1 ? 'r' : ''}`}
                                title="Not confident"
                                onClick={() => setConf(dayId, sIdx, tIdx, 1)}
                              ></div>
                              <div
                                className={`cd ${topic.conf >= 2 ? 'y' : ''}`}
                                title="Somewhat confident"
                                onClick={() => setConf(dayId, sIdx, tIdx, 2)}
                              ></div>
                              <div
                                className={`cd ${topic.conf >= 3 ? 'g' : ''}`}
                                title="Confident"
                                onClick={() => setConf(dayId, sIdx, tIdx, 3)}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    } else {
                      // Fallback for custom topics without detailed lesson
                      return (
                        <div key={topic.id || tIdx} style={{ marginBottom: '8px' }}>
                          <TopicRow
                            topic={topic}
                            dayId={dayId}
                            sessionIdx={sIdx}
                            topicIdx={tIdx}
                            toggleTopic={toggleTopic}
                            setConf={setConf}
                            deleteTopic={deleteTopic}
                          />
                        </div>
                      );
                    }
                  })
                )}
              </div>
            </div>
          );
        })
      ) : (
        // Original Checklist View
        <>
          {/* Add Topic */}
          <div className="add-topic-row">
            <input
              type="text"
              placeholder="Add a study topic..."
              value={newText}
              onChange={e => setNewText(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <select value={selectedSession} onChange={e => setSelectedSession(Number(e.target.value))}>
              {day.sessions.map((s, i) => (
                <option key={i} value={i}>{s.name}</option>
              ))}
            </select>
            <button className="addbtn" onClick={handleAdd}>+ Add</button>
            <button className="addbtn" onClick={onOpenPdf} style={{ borderColor: 'var(--accent2)', color: 'var(--accent2)' }}>📄 PDF Import</button>
          </div>

          {/* Legend */}
          <div className="legend">
            <div className="leg"><div className="leg-dot" style={{ background: 'var(--red)' }}></div> Not confident</div>
            <div className="leg"><div className="leg-dot" style={{ background: 'var(--yellow)' }}></div> Somewhat</div>
            <div className="leg"><div className="leg-dot" style={{ background: 'var(--green)' }}></div> Confident</div>
          </div>

          {/* Sessions */}
          {day.sessions.map((session, sIdx) => {
            const done = session.topics.filter(t => t.done).length;
            return (
              <div className="session-section" key={sIdx}>
                <div className="session-head">
                  <div className="session-name">{session.name}</div>
                  <div className="session-count">{done}/{session.topics.length} done</div>
                </div>
                {session.topics.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-icon">📝</div>
                    No topics yet — add some above
                  </div>
                ) : (
                  session.topics.map((topic, tIdx) => (
                    <TopicRow
                      key={topic.id || tIdx}
                      topic={topic}
                      dayId={dayId}
                      sessionIdx={sIdx}
                      topicIdx={tIdx}
                      toggleTopic={toggleTopic}
                      setConf={setConf}
                      deleteTopic={deleteTopic}
                    />
                  ))
                )}
              </div>
            );
          })}
        </>
      )}
    </div>
  );
}
