import { useState, useEffect, useRef, useCallback } from 'react';

const MODES = {
  focus: { label: 'Focus 25', seconds: 25 * 60 },
  short: { label: 'Break 5', seconds: 5 * 60 },
  long: { label: 'Long 15', seconds: 15 * 60 }
};

export function useTimer(onSessionComplete) {
  const [mode, setMode] = useState('focus');
  const [timeLeft, setTimeLeft] = useState(MODES.focus.seconds);
  const [running, setRunning] = useState(false);
  const [sessionCount, setSessionCount] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);

            // Notification
            if (Notification.permission === 'granted') {
              new Notification('⏰ study_hq', {
                body: mode === 'focus' ? 'Focus session complete! Take a break.' : 'Break is over! Back to studying.',
                icon: '📚'
              });
            }

            if (mode === 'focus') {
              setSessionCount(prev => {
                const next = prev + 1;
                if (onSessionComplete) onSessionComplete();
                return next;
              });
            }

            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, mode, onSessionComplete]);

  const toggleTimer = useCallback(() => {
    if (!running && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    setRunning(prev => !prev);
  }, [running]);

  const resetTimer = useCallback(() => {
    setRunning(false);
    clearInterval(intervalRef.current);
    setTimeLeft(MODES[mode].seconds);
  }, [mode]);

  const switchMode = useCallback((newMode) => {
    setRunning(false);
    clearInterval(intervalRef.current);
    setMode(newMode);
    setTimeLeft(MODES[newMode].seconds);
  }, []);

  const formatTime = useCallback((secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, []);

  return {
    mode, timeLeft, running, sessionCount,
    toggleTimer, resetTimer, switchMode, formatTime,
    modes: MODES
  };
}
