import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Timer from './components/Timer';
import DayContent from './components/DayContent';
import PdfManager from './components/PdfManager';
import ExamSimulator from './components/ExamSimulator';
import JExams from './components/JExams';
import { useProgress } from './hooks/useProgress';
import { useTimer } from './hooks/useTimer';

export default function App() {
  const progress = useProgress();
  const timer = useTimer(progress.addPomodoroSession);
  const [activeDay, setActiveDay] = useState(0);
  const [showPdf, setShowPdf] = useState(false);
  const [view, setView] = useState('study'); // 'study' or 'simulator'
  const [initialExam, setInitialExam] = useState(null); // { name, questions }

  const handleLaunchExam = (questions, examName) => {
    setInitialExam({ name: examName, questions });
    setView('simulator');
  };
  const [notif, setNotif] = useState({ text: '', show: false });

  const showNotif = useCallback((text) => {
    setNotif({ text, show: true });
    setTimeout(() => setNotif(prev => ({ ...prev, show: false })), 2500);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e) => {
      // Don't fire shortcuts when typing in input fields
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        if (e.key === 'Enter') return;
        return;
      }

      switch (e.key) {
        case ' ':
          if (view === 'study') {
            e.preventDefault();
            timer.toggleTimer();
          }
          break;
        case 'r':
        case 'R':
          if (view === 'study') timer.resetTimer();
          break;
        case '1':
          if (view === 'study') timer.switchMode('focus');
          break;
        case '2':
          if (view === 'study') timer.switchMode('short');
          break;
        case '3':
          if (view === 'study') timer.switchMode('long');
          break;
        case 'ArrowUp':
          if (view === 'study') {
            e.preventDefault();
            setActiveDay(prev => Math.max(0, prev - 1));
          }
          break;
        case 'ArrowDown':
          if (view === 'study') {
            e.preventDefault();
            setActiveDay(prev => Math.min(progress.days.length - 1, prev + 1));
          }
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [timer, progress.days.length, view]);

  // Show notification when timer ends
  useEffect(() => {
    if (timer.timeLeft === 0 && view === 'study') {
      showNotif(timer.mode === 'focus' ? '✅ Focus session complete!' : '🔔 Break is over!');
    }
  }, [timer.timeLeft, timer.mode, showNotif, view]);

  return (
    <>
      <div className={`notif ${notif.show ? 'show' : ''}`}>{notif.text}</div>

      <Header
        doneTopics={progress.doneTopics}
        totalTopics={progress.totalTopics}
        lastSaved={progress.lastSaved}
        saving={progress.saving}
        backendOk={progress.backendOk}
        view={view}
        setView={setView}
      />

      <div className="layout">
        {view === 'study' ? (
          <>
            <Sidebar
              days={progress.days}
              activeDay={activeDay}
              setActiveDay={setActiveDay}
              doneTopics={progress.doneTopics}
              totalTopics={progress.totalTopics}
              dayPercent={progress.dayPercent}
              pomodoroSessions={progress.pomodoroSessions}
              weakTopics={progress.weakTopics}
            />

            <div className="main" id="main-area">
              <Timer timer={timer} />
              <DayContent
                day={progress.days[activeDay]}
                dayId={activeDay}
                dayPercent={progress.dayPercent(activeDay)}
                toggleTopic={progress.toggleTopic}
                setConf={progress.setConf}
                addTopic={progress.addTopic}
                deleteTopic={progress.deleteTopic}
                onOpenPdf={() => setShowPdf(true)}
                showNotif={showNotif}
              />
            </div>
          </>
        ) : view === 'jexams' ? (
          <div className="main" id="main-area" style={{ flex: 1 }}>
            <JExams onLaunchExam={handleLaunchExam} showNotif={showNotif} />
          </div>
        ) : (
          <div className="main" id="main-area" style={{ flex: 1 }}>
            <ExamSimulator 
              showNotif={showNotif} 
              initialExam={initialExam} 
              clearInitialExam={() => setInitialExam(null)} 
            />
          </div>
        )}
      </div>

      {showPdf && (
        <PdfManager
          onClose={() => setShowPdf(false)}
          days={progress.days}
          addTopic={progress.addTopic}
          showNotif={showNotif}
        />
      )}
    </>
  );
}
