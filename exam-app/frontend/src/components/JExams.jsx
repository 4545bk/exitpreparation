import React, { useState, useEffect } from 'react';

export default function JExams({ onLaunchExam, showNotif }) {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchExams = async () => {
    setLoading(true);
    let dbExams = [];
    
    // 1. Try to fetch from backend
    try {
      const res = await fetch('/api/pdfs/custom-exams');
      if (res.ok) {
        dbExams = await res.json();
      }
    } catch (err) {
      console.warn('Backend custom exams fetch failed, checking localStorage fallback', err);
    }

    // 2. Load from local fallback
    const localExamsRaw = localStorage.getItem('react_saved_custom_exams') || '[]';
    let localExams = [];
    try {
      localExams = JSON.parse(localExamsRaw);
    } catch (e) {
      console.error('Failed to parse react_saved_custom_exams', e);
    }

    // Combine and deduplicate by name
    const combined = [...dbExams];
    localExams.forEach(le => {
      const exists = combined.some(de => de.filename === le.filename || de.name === le.filename);
      if (!exists) {
        combined.push({
          filename: le.filename || le.name,
          questionsCount: le.questions.length,
          questions: le.questions,
          isCustom: true,
          isLocalOnly: true
        });
      }
    });

    setExams(combined);
    setLoading(false);
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleDelete = async (filename, isLocalOnly) => {
    if (!confirm(`Are you sure you want to permanently delete "${filename}"?`)) {
      return;
    }

    let success = false;

    // 1. Try backend delete
    if (!isLocalOnly) {
      try {
        const res = await fetch(`/api/pdfs/custom-exams/${encodeURIComponent(filename)}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          success = true;
        }
      } catch (err) {
        console.warn('Backend delete failed', err);
      }
    }

    // 2. Always delete from local storage as well to stay sync'd
    const localExamsRaw = localStorage.getItem('react_saved_custom_exams') || '[]';
    try {
      const localExams = JSON.parse(localExamsRaw);
      const filtered = localExams.filter(e => e.filename !== filename && e.name !== filename);
      localStorage.setItem('react_saved_custom_exams', JSON.stringify(filtered));
      if (isLocalOnly) success = true;
    } catch (e) {
      console.error(e);
    }

    if (success) {
      showNotif(`Deleted "${filename}" successfully ✓`);
      fetchExams();
    } else {
      showNotif('Failed to delete custom exam ✕');
    }
  };

  if (loading) {
    return (
      <div className="empty-state" style={{ height: '40vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div className="empty-icon running-pulse">⚡</div>
        <p>Opening Custom J-Exams Vault...</p>
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ padding: '8px 4px' }}>
      <div className="day-header-card" style={{ marginBottom: '20px', borderLeft: '3px solid var(--accent2)' }}>
        <div className="day-big-title">⚡ J-Exams Vault</div>
        <p style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '4px' }}>
          Select and practice from your loaded JSON exam questions. Pasting a valid JSON in the Exam Simulator automatically adds it here.
        </p>
      </div>

      {exams.length === 0 ? (
        <div className="lesson-card" style={{ padding: '40px', textAlign: 'center' }}>
          <div style={{ fontSize: '32px', marginBottom: '12px', opacity: 0.6 }}>⚡</div>
          <h3 style={{ fontSize: '15px', color: 'var(--text)', marginBottom: '8px' }}>Your J-Exams Vault is Empty</h3>
          <p style={{ fontSize: '12px', color: 'var(--text2)', maxWidth: '400px', margin: '0 auto 20px' }}>
            Go to the <strong>📝 Exam Simulator</strong> page, choose **Option 2**, paste your questions array, and click **Load & Run**. It will automatically save here.
          </p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '16px',
          marginTop: '10px'
        }}>
          {exams.map((exam, idx) => (
            <div 
              key={idx} 
              className="lesson-card" 
              style={{ 
                padding: '20px', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between',
                minHeight: '150px',
                border: '1px solid var(--border)',
                transition: 'border-color 0.2s'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span style={{ 
                    fontFamily: 'var(--mono)', 
                    fontSize: '10px', 
                    color: 'var(--accent)', 
                    background: 'rgba(79, 142, 247, 0.08)',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontWeight: '600'
                  }}>
                    {exam.isLocalOnly ? '💻 Offline Storage' : '☁️ Cloud Database'}
                  </span>
                  <button 
                    onClick={() => handleDelete(exam.filename || exam.name, exam.isLocalOnly)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--text3)',
                      cursor: 'pointer',
                      fontSize: '13px',
                      padding: '2px',
                      transition: 'color 0.15s'
                    }}
                    onMouseEnter={e => e.target.style.color = 'var(--red)'}
                    onMouseLeave={e => e.target.style.color = 'var(--text3)'}
                    title="Delete permanently"
                  >
                    ✕
                  </button>
                </div>
                
                <h3 style={{ 
                  fontSize: '13.5px', 
                  fontWeight: '600', 
                  color: 'var(--text)', 
                  lineHeight: '1.4', 
                  marginBottom: '10px',
                  display: '-webkit-box',
                  WebkitLineClamp: '2',
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden'
                }}>
                  {exam.filename || exam.name}
                </h3>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <span style={{ fontSize: '11px', color: 'var(--text2)' }}>
                  📊 {exam.questionsCount || exam.questions.length} questions
                </span>
                
                <button 
                  className="addbtn" 
                  onClick={() => onLaunchExam(exam.questions, exam.filename || exam.name)}
                  style={{
                    background: 'linear-gradient(135deg, var(--accent2), #8a3ffc)',
                    border: 'none',
                    color: 'white',
                    padding: '6px 14px',
                    fontSize: '11.5px',
                    fontWeight: '600'
                  }}
                >
                  🚀 Run Simulator
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
