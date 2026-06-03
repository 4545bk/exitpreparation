import React from 'react';

export default function TopicRow({ topic, dayId, sessionIdx, topicIdx, toggleTopic, setConf, deleteTopic }) {
  const handleDelete = () => {
    if (window.confirm('Delete this topic?')) {
      deleteTopic(dayId, sessionIdx, topicIdx);
    }
  };

  // Parse prefix badges
  let badge = null;
  let displayText = topic.text;

  if (displayText.startsWith('★ EXAM:')) {
    badge = <span className="topic-badge badge-exam">★ EXAM</span>;
    displayText = displayText.slice(7).trim();
  } else if (displayText.startsWith('⚠️ TRAP:')) {
    badge = <span className="topic-badge badge-trap">⚠ TRAP</span>;
    displayText = displayText.slice(8).trim();
  } else if (displayText.startsWith('vs:')) {
    badge = <span className="topic-badge badge-vs">VS</span>;
    displayText = displayText.slice(3).trim();
  }

  return (
    <div className="topic-row">
      <div
        className={`chk ${topic.done ? 'on' : ''}`}
        onClick={() => toggleTopic(dayId, sessionIdx, topicIdx)}
      >
        <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
          <path d="M1 5L4.5 8.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <div className={`topic-text ${topic.done ? 'done' : ''}`}>
        {badge}
        {displayText}
      </div>

      <div className="conf-dots">
        <div
          className={`cd ${topic.conf >= 1 ? 'r' : ''}`}
          title="Not confident"
          onClick={() => setConf(dayId, sessionIdx, topicIdx, 1)}
        ></div>
        <div
          className={`cd ${topic.conf >= 2 ? 'y' : ''}`}
          title="Somewhat confident"
          onClick={() => setConf(dayId, sessionIdx, topicIdx, 2)}
        ></div>
        <div
          className={`cd ${topic.conf >= 3 ? 'g' : ''}`}
          title="Confident"
          onClick={() => setConf(dayId, sessionIdx, topicIdx, 3)}
        ></div>
      </div>

      <button className="del-btn" onClick={handleDelete} title="Delete topic">✕</button>
    </div>
  );
}
