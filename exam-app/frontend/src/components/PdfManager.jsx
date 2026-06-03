import React, { useState, useEffect } from 'react';

export default function PdfManager({ onClose, days, addTopic, showNotif }) {
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [extracted, setExtracted] = useState(null);
  const [selectedTopics, setSelectedTopics] = useState({});
  const [targetDay, setTargetDay] = useState(0);
  const [targetSession, setTargetSession] = useState(0);

  const fetchPdfs = () => {
    setLoading(true);
    fetch('/api/pdfs')
      .then(r => r.json())
      .then(data => { setPdfs(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => { setPdfs([]); setLoading(false); });
  };

  useEffect(() => { fetchPdfs(); }, []);

  const handlePreview = async (filename) => {
    try {
      const r = await fetch(`/api/pdfs/${encodeURIComponent(filename)}`);
      const data = await r.json();
      setPreview(data);
    } catch {
      showNotif('Failed to preview PDF');
    }
  };

  const handleExtract = async (filename) => {
    try {
      const r = await fetch('/api/pdfs/extract-topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename })
      });
      const data = await r.json();
      setExtracted(data);
      // Pre-select all
      const sel = {};
      data.topics.forEach((_, i) => { sel[i] = true; });
      setSelectedTopics(sel);
    } catch {
      showNotif('Failed to extract topics');
    }
  };

  const handleAddSelected = () => {
    if (!extracted) return;
    let count = 0;
    extracted.topics.forEach((text, i) => {
      if (selectedTopics[i]) {
        addTopic(targetDay, targetSession, text);
        count++;
      }
    });
    showNotif(`Added ${count} topics ✓`);
    setExtracted(null);
    setSelectedTopics({});
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  return (
    <div className="pdf-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pdf-panel">
        <h2>📄 PDF Topic Importer</h2>

        <div className="pdf-instructions">
          Drop your PDF lecture slides into the <code>/backend/pdfs/</code> folder, then click Refresh below.
          The app will scan for PDFs and extract potential study topics automatically.
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <button className="pdf-btn primary" onClick={fetchPdfs}>🔄 Refresh</button>
          <button className="pdf-close-btn" onClick={onClose}>Close</button>
        </div>

        {loading ? (
          <div className="pdf-empty">Scanning for PDFs...</div>
        ) : pdfs.length === 0 ? (
          <div className="pdf-empty">No PDF files found in /backend/pdfs/ folder</div>
        ) : (
          pdfs.map((pdf, i) => (
            <div key={i}>
              <div className="pdf-file-row">
                <div>
                  <div className="pdf-file-name">{pdf.filename}</div>
                  <div className="pdf-file-meta">{formatSize(pdf.size)}</div>
                </div>
                <div className="pdf-file-btns">
                  <button className="pdf-btn" onClick={() => handlePreview(pdf.filename)}>Preview</button>
                  <button className="pdf-btn primary" onClick={() => handleExtract(pdf.filename)}>Extract Topics</button>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Preview section */}
        {preview && (
          <div>
            <h3>Preview: {preview.filename} ({preview.pages} pages)</h3>
            <div className="pdf-preview">{preview.text?.substring(0, 500) || 'No text extracted'}</div>
          </div>
        )}

        {/* Extracted topics section */}
        {extracted && (
          <div>
            <h3>Extracted {extracted.topicCount} potential topics</h3>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <select value={targetDay} onChange={e => { setTargetDay(Number(e.target.value)); setTargetSession(0); }} style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--text)', padding: '6px 10px', borderRadius: 'var(--radius)', fontSize: 12 }}>
                {days.map((d, i) => <option key={i} value={i}>{d.label} — {d.title}</option>)}
              </select>
              <select value={targetSession} onChange={e => setTargetSession(Number(e.target.value))} style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', color: 'var(--text)', padding: '6px 10px', borderRadius: 'var(--radius)', fontSize: 12 }}>
                {days[targetDay]?.sessions.map((s, i) => <option key={i} value={i}>{s.name}</option>)}
              </select>
            </div>

            <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 12 }}>
              {extracted.topics.map((topic, i) => (
                <label key={i} className="pdf-topic-check">
                  <input
                    type="checkbox"
                    checked={!!selectedTopics[i]}
                    onChange={() => setSelectedTopics(prev => ({ ...prev, [i]: !prev[i] }))}
                  />
                  {topic}
                </label>
              ))}
            </div>

            <button className="pdf-btn primary" onClick={handleAddSelected}>
              ✅ Add {Object.values(selectedTopics).filter(Boolean).length} selected topics
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
