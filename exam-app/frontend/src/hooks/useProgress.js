import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { DEFAULT_DAYS } from '../data/defaultDays';

const API = '/api/progress';
const DEBOUNCE_MS = 300;

export function useProgress() {
  const [days, setDays] = useState(() => JSON.parse(JSON.stringify(DEFAULT_DAYS)));
  const [pomodoroSessions, setPomodoroSessions] = useState(0);
  const [lastSaved, setLastSaved] = useState(null);
  const [saving, setSaving] = useState(false);
  const [backendOk, setBackendOk] = useState(true);
  const saveTimer = useRef(null);
  const initialLoad = useRef(true);

  // Load from backend on mount
  useEffect(() => {
    fetch(API)
      .then(r => r.json())
      .then(data => {
        if (data.days && data.days.length > 0) {
          setDays(data.days);
        }
        if (data.pomodoroSessions) setPomodoroSessions(data.pomodoroSessions);
        if (data.lastSaved) setLastSaved(data.lastSaved);
        setBackendOk(true);
        initialLoad.current = false;
      })
      .catch(() => {
        setBackendOk(false);
        // Try localStorage fallback
        try {
          const local = localStorage.getItem('studyhq_progress');
          if (local) {
            const parsed = JSON.parse(local);
            if (parsed.days) setDays(parsed.days);
            if (parsed.pomodoroSessions) setPomodoroSessions(parsed.pomodoroSessions);
          }
        } catch (e) { /* ignore */ }
        initialLoad.current = false;
      });
  }, []);

  // Debounced save
  const saveToBackend = useCallback((newDays, newPomo) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const payload = {
        lastSaved: new Date().toISOString(),
        examDate: '2026-06-10T08:00:00Z',
        pomodoroSessions: newPomo ?? pomodoroSessions,
        days: newDays ?? days
      };

      // Always save to localStorage as backup
      try { localStorage.setItem('studyhq_progress', JSON.stringify(payload)); } catch (e) { /* ignore */ }

      setSaving(true);
      fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(r => r.json())
        .then(data => {
          setLastSaved(data.lastSaved || payload.lastSaved);
          setBackendOk(true);
          setSaving(false);
        })
        .catch(() => {
          setBackendOk(false);
          setSaving(false);
        });
    }, DEBOUNCE_MS);
  }, [days, pomodoroSessions]);

  const toggleTopic = useCallback((dayId, sessionIdx, topicIdx) => {
    setDays(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const topic = next[dayId]?.sessions?.[sessionIdx]?.topics?.[topicIdx];
      if (topic) topic.done = !topic.done;
      saveToBackend(next);
      return next;
    });
  }, [saveToBackend]);

  const setConf = useCallback((dayId, sessionIdx, topicIdx, level) => {
    setDays(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const topic = next[dayId]?.sessions?.[sessionIdx]?.topics?.[topicIdx];
      if (topic) topic.conf = topic.conf === level ? 0 : level;
      saveToBackend(next);
      return next;
    });
  }, [saveToBackend]);

  const addTopic = useCallback((dayId, sessionIdx, text) => {
    setDays(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const session = next[dayId]?.sessions?.[sessionIdx];
      if (session) {
        const id = `d${dayId}s${sessionIdx}t${session.topics.length}`;
        session.topics.push({ id, text, done: false, conf: 0 });
      }
      saveToBackend(next);
      return next;
    });
  }, [saveToBackend]);

  const deleteTopic = useCallback((dayId, sessionIdx, topicIdx) => {
    setDays(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const session = next[dayId]?.sessions?.[sessionIdx];
      if (session) session.topics.splice(topicIdx, 1);
      saveToBackend(next);
      return next;
    });
  }, [saveToBackend]);

  const addPomodoroSession = useCallback(() => {
    setPomodoroSessions(prev => {
      const next = prev + 1;
      saveToBackend(days, next);
      return next;
    });
  }, [saveToBackend, days]);

  const resetProgress = useCallback(() => {
    fetch(`${API}/reset`, { method: 'POST' }).catch(() => {});
    const fresh = JSON.parse(JSON.stringify(DEFAULT_DAYS));
    setDays(fresh);
    setPomodoroSessions(0);
    saveToBackend(fresh, 0);
  }, [saveToBackend]);

  const totalTopics = useMemo(() => {
    return days.reduce((sum, d) => sum + d.sessions.reduce((s2, ses) => s2 + ses.topics.length, 0), 0);
  }, [days]);

  const doneTopics = useMemo(() => {
    return days.reduce((sum, d) => sum + d.sessions.reduce((s2, ses) => s2 + ses.topics.filter(t => t.done).length, 0), 0);
  }, [days]);

  const weakTopics = useMemo(() => {
    return days.reduce((sum, d) => sum + d.sessions.reduce((s2, ses) => s2 + ses.topics.filter(t => t.conf === 1).length, 0), 0);
  }, [days]);

  const dayPercent = useCallback((dayId) => {
    const day = days[dayId];
    if (!day) return 0;
    const total = day.sessions.reduce((s, ses) => s + ses.topics.length, 0);
    if (total === 0) return 0;
    const done = day.sessions.reduce((s, ses) => s + ses.topics.filter(t => t.done).length, 0);
    return Math.round((done / total) * 100);
  }, [days]);

  return {
    days, toggleTopic, setConf, addTopic, deleteTopic,
    resetProgress, totalTopics, doneTopics, dayPercent,
    pomodoroSessions, addPomodoroSession, weakTopics,
    lastSaved, saving, backendOk
  };
}
