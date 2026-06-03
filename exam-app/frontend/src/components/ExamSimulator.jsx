import React, { useState, useEffect, useRef } from 'react';

const GEMINI_PROMPT_TEMPLATE = `You are an expert exam parser. I will paste questions from an exit exam PDF. 
Please convert all the multiple-choice questions into a single clean JSON array. 
For each question, ensure the following fields are populated:
- number: the question number (integer)
- text: the clean question text
- choices: an array of strings OR objects (each choice containing letter and text)
- correctIndex: the index of the correct choice (0-indexed integer, e.g. 0 for A, 1 for B, 2 for C, 3 for D) OR the correct letter (e.g. "C")
- explanation: a detailed explanation of why the answer is correct and why other choices are incorrect.

Example JSON output structure:
[
  {
    "number": 1,
    "text": "Which of the following is the time complexity of searching in a balanced Binary Search Tree (BST)?",
    "choices": [
      "O(1)",
      "O(n)",
      "O(log n)",
      "O(n log n)"
    ],
    "correctIndex": 2,
    "explanation": "In a balanced BST, search checks one node per level. The maximum levels is O(log n)."
  }
]

Please reply ONLY with the raw JSON array (wrapped in \`\`\`json ... \`\`\` is fine). Do not include any conversational intro or outro text.

Here is the exam text:
`;

export default function ExamSimulator({ showNotif }) {
  const [pdfs, setPdfs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState('');
  
  // Exam states
  const [inExam, setInExam] = useState(false);
  const [pastedJson, setPastedJson] = useState('');
  const [jsonError, setJsonError] = useState('');
  const [showPromptInstructions, setShowPromptInstructions] = useState(false);
  const [customExamName, setCustomExamName] = useState('');
  const [saveToDb, setSaveToDb] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionIndex: selectedChoiceIndex }
  const [timeLeft, setTimeLeft] = useState(0); // in seconds
  const [examDuration, setExamDuration] = useState(120 * 60); // 2 hours in seconds
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [timeTaken, setTimeTaken] = useState(0);
  
  const timerRef = useRef(null);

  // Fetch PDFs from backend
  const fetchPdfs = async () => {
    try {
      const res = await fetch('/api/pdfs');
      let pdfList = [];
      if (res.ok) {
        pdfList = await res.json();
      }

      let customList = [];
      try {
        const customRes = await fetch('/api/pdfs/custom-exams');
        if (customRes.ok) {
          customList = await customRes.json();
        }
      } catch (err) {
        console.warn('MongoDB custom exams fetch failed', err);
      }

      const combined = [
        ...pdfList,
        ...customList.map(item => ({
          filename: item.filename,
          size: 0,
          isCustom: true,
          questions: item.questions
        }))
      ];

      setPdfs(combined);
      if (combined.length > 0 && !selectedFile) {
        setSelectedFile(combined[0].filename);
      }
    } catch (e) {
      console.warn('Backend offline, using fallback mode', e);
    }
  };

  useEffect(() => {
    fetchPdfs();
  }, []);

  // Handle PDF Upload via Base64
  const handleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = async () => {
      try {
        const base64 = reader.result.split(',')[1];
        const res = await fetch('/api/pdfs/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: file.name, base64 })
        });
        
        if (res.ok) {
          showNotif('PDF Uploaded successfully ✓');
          await fetchPdfs();
          setSelectedFile(file.name);
        } else {
          showNotif('Upload failed ✕');
        }
      } catch (err) {
        showNotif('Upload error ✕');
      } finally {
        setLoading(false);
      }
    };
  };

  // Start Exam Simulation
  const startExam = async () => {
    const selectedItem = pdfs.find(p => p.filename === selectedFile);
    if (selectedItem && selectedItem.isCustom) {
      setQuestions(selectedItem.questions);
      setAnswers({});
      setCurrentIdx(0);
      setInExam(true);
      setExamSubmitted(false);
      const duration = selectedItem.questions.length * 90;
      setExamDuration(duration);
      setTimeLeft(duration);
      showNotif(`Loaded saved custom exam: ${selectedFile} ✓`);
      return;
    }

    if (!selectedFile) {
      startFallbackExam();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/pdfs/parse-exam/${selectedFile}`);
      if (res.ok) {
        const data = await res.json();
        if (data.questions && data.questions.length > 0) {
          setQuestions(data.questions);
          setAnswers({});
          setCurrentIdx(0);
          setInExam(true);
          setExamSubmitted(false);
          // Set timer based on question count: 1.5 mins per question
          const duration = data.questions.length * 90;
          setExamDuration(duration);
          setTimeLeft(duration);
          showNotif(`Started exam: ${data.questionsCount} questions parsed ✓`);
        } else {
          showNotif('No multiple-choice questions found in PDF ✕');
        }
      } else {
        showNotif('Failed to parse exam PDF ✕');
      }
    } catch (e) {
      showNotif('Using Offline Mock Exam Fallback...');
      startFallbackExam();
    } finally {
      setLoading(false);
    }
  };

  // Fallback Mock Exam
  const startFallbackExam = () => {
    const mock = [
      {
        id: 'q_mock1',
        number: 1,
        text: "Which of the following is the time complexity of searching in a balanced Binary Search Tree (BST)?",
        choices: [
          { letter: "A", text: "O(1)" },
          { letter: "B", text: "O(n)" },
          { letter: "C", text: "O(log n)" },
          { letter: "D", text: "O(n log n)" }
        ],
        correctIndex: 2,
        explanation: "In a balanced BST (like AVL or Red-Black trees), the height is bounded by log(n). Since search checks one node per level, the time complexity is O(log n)."
      },
      {
        id: 'q_mock2',
        number: 2,
        text: "What does ACID stand for in databases?",
        choices: [
          { letter: "A", text: "Atomicity, Consistency, Integration, Durability" },
          { letter: "B", text: "Atomicity, Consistency, Isolation, Durability" },
          { letter: "C", text: "Access, Control, Indexing, Data" },
          { letter: "D", text: "Algorithm, Complexity, Isolation, Dependency" }
        ],
        correctIndex: 1,
        explanation: "ACID represents the core properties of database transactions: Atomicity (all or nothing), Consistency (preserves rules), Isolation (concurrency isolation), and Durability (saved to disk)."
      },
      {
        id: 'q_mock3',
        number: 3,
        text: "In C++ / Java, what is the value of the integer division 5 / 2?",
        choices: [
          { letter: "A", text: "2.5" },
          { letter: "B", text: "2" },
          { letter: "C", text: "3" },
          { letter: "D", text: "0" }
        ],
        correctIndex: 1,
        explanation: "Division of two integers in C/C++/Java drops the fractional part (truncation), resulting in 2. You must cast to float/double (e.g. 5.0 / 2) to get 2.5."
      },
      {
        id: 'q_mock4',
        number: 4,
        text: "Which layer of the OSI model handles routing and logical addressing?",
        choices: [
          { letter: "A", text: "Data Link Layer (Layer 2)" },
          { letter: "B", text: "Network Layer (Layer 3)" },
          { letter: "C", text: "Transport Layer (Layer 4)" },
          { letter: "D", text: "Physical Layer (Layer 1)" }
        ],
        correctIndex: 1,
        explanation: "The Network Layer (Layer 3) handles packet routing, forwarding, and logical IP addressing. Switches operate at Layer 2, while routers operate at Layer 3."
      },
      {
        id: 'q_mock5',
        number: 5,
        text: "Which model of the Software Development Life Cycle (SDLC) is structured as a risk-driven model with repeated iteration cycles?",
        choices: [
          { letter: "A", text: "Waterfall Model" },
          { letter: "B", text: "Spiral Model" },
          { letter: "C", text: "V-Model" },
          { letter: "D", text: "Incremental Model" }
        ],
        correctIndex: 1,
        explanation: "The Spiral Model is a highly risk-driven SDLC model that iterates through design, risk analysis, building, and evaluation loops."
      }
    ];
    setQuestions(mock);
    setAnswers({});
    setCurrentIdx(0);
    setInExam(true);
    setExamSubmitted(false);
    setExamDuration(mock.length * 90);
    setTimeLeft(mock.length * 90);
  };

  const parseAndSanitizeQuestions = (jsonText) => {
    if (!jsonText || !jsonText.trim()) {
      throw new Error("Text area is empty. Please paste your JSON exam questions first.");
    }
    
    let cleanText = jsonText.trim();
    if (cleanText.includes('```')) {
      const match = cleanText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (match && match[1]) {
        cleanText = match[1].trim();
      } else {
        cleanText = cleanText.replace(/```(?:json)?/g, '').replace(/```/g, '').trim();
      }
    }
    
    const startIdx = cleanText.indexOf('[');
    const endIdx = cleanText.lastIndexOf(']');
    if (startIdx === -1 || endIdx === -1) {
      throw new Error("Invalid format: Could not locate JSON array brackets ('[' and ']'). Make sure you paste a JSON array.");
    }
    
    let arrayData;
    try {
      arrayData = JSON.parse(cleanText.substring(startIdx, endIdx + 1));
    } catch (err) {
      throw new Error(`JSON Parsing Error: ${err.message}. Please verify the syntax is valid JSON.`);
    }
    
    if (!Array.isArray(arrayData)) {
      throw new Error("Parsed data is not a JSON Array. The top-level structure must be an array: [ { ... }, { ... } ]");
    }
    
    if (arrayData.length === 0) {
      throw new Error("The pasted JSON array is empty. Please provide at least one question.");
    }
    
    const sanitized = arrayData.map((q, idx) => {
      const number = q.number || (idx + 1);
      const text = q.text || q.question || q.q;
      if (!text) {
        throw new Error(`Question at index ${idx} is missing its 'text' or 'question' field.`);
      }
      
      let rawChoices = q.choices || q.options || q.answers;
      if (!rawChoices) {
        throw new Error(`Question #${number} is missing a 'choices' array.`);
      }
      
      let formattedChoices = [];
      const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      
      if (Array.isArray(rawChoices)) {
        formattedChoices = rawChoices.map((choice, cIdx) => {
          if (typeof choice === 'string') {
            return {
              letter: alphabet[cIdx] || String(cIdx + 1),
              text: choice.trim()
            };
          } else if (typeof choice === 'object' && choice !== null) {
            const cText = choice.text || choice.choice || choice.option || choice.value || Object.values(choice)[0] || '';
            const cLetter = choice.letter || choice.label || choice.key || alphabet[cIdx];
            return {
              letter: String(cLetter).toUpperCase(),
              text: String(cText).trim()
            };
          }
          return { letter: alphabet[cIdx], text: String(choice) };
        });
      } else if (typeof rawChoices === 'object' && rawChoices !== null) {
        let cIdx = 0;
        for (const [key, val] of Object.entries(rawChoices)) {
          formattedChoices.push({
            letter: String(key).toUpperCase(),
            text: String(val).trim()
          });
          cIdx++;
        }
      } else {
        throw new Error(`Question #${number} has an invalid 'choices' format. Must be an array or key-value object.`);
      }
      
      if (formattedChoices.length < 2) {
        throw new Error(`Question #${number} must have at least 2 choices.`);
      }
      
      let correctVal = q.correctIndex !== undefined ? q.correctIndex : (q.correct_index !== undefined ? q.correct_index : (q.correctAnswer !== undefined ? q.correctAnswer : (q.correct_answer !== undefined ? q.correct_answer : (q.answer !== undefined ? q.answer : q.key))));
      if (correctVal === undefined) {
        throw new Error(`Question #${number} is missing the correct answer field (e.g. 'correctIndex' or 'correctAnswer').`);
      }
      
      let correctIdx = -1;
      let isIndexField = q.correctIndex !== undefined || q.correct_index !== undefined;
      
      if (typeof correctVal === 'number') {
        if (isIndexField) {
          if (correctVal >= 0 && correctVal < formattedChoices.length) {
            correctIdx = correctVal;
          }
        } else {
          if (correctVal > 0 && correctVal <= formattedChoices.length) {
            correctIdx = correctVal - 1;
          } else if (correctVal >= 0 && correctVal < formattedChoices.length) {
            correctIdx = correctVal;
          }
        }
      } else {
        const cleanVal = String(correctVal).trim().toLowerCase();
        const numVal = parseInt(cleanVal, 10);
        if (!isNaN(numVal)) {
          if (isIndexField) {
            if (numVal >= 0 && numVal < formattedChoices.length) {
              correctIdx = numVal;
            }
          } else {
            if (numVal > 0 && numVal <= formattedChoices.length) {
              correctIdx = numVal - 1;
            } else if (numVal >= 0 && numVal < formattedChoices.length) {
              correctIdx = numVal;
            }
          }
        } else {
          const matchedIdx = formattedChoices.findIndex(c => c.letter.toLowerCase() === cleanVal || cleanVal.startsWith(c.letter.toLowerCase()));
          if (matchedIdx !== -1) {
            correctIdx = matchedIdx;
          } else {
            const matchedTextIdx = formattedChoices.findIndex(c => c.text.toLowerCase() === cleanVal || cleanVal.includes(c.text.toLowerCase()) || c.text.toLowerCase().includes(cleanVal));
            if (matchedTextIdx !== -1) {
              correctIdx = matchedTextIdx;
            }
          }
        }
      }
      
      if (correctIdx === -1) {
        const letterMap = { a: 0, b: 1, c: 2, d: 3, e: 4, f: 5, g: 6, h: 7 };
        const standardLetter = String(correctVal).trim().toLowerCase().charAt(0);
        if (letterMap[standardLetter] !== undefined && letterMap[standardLetter] < formattedChoices.length) {
          correctIdx = letterMap[standardLetter];
        } else {
          throw new Error(`Could not map correct answer value '${correctVal}' to any choices for Question #${number}.`);
        }
      }
      
      const explanation = q.explanation || q.exp || q.rationale || "No explanation provided for this question.";
      const id = q.id || `q_pasted_${idx}_${Date.now()}`;
      
      return {
        id,
        number,
        text: text.trim(),
        choices: formattedChoices,
        correctIndex: correctIdx,
        explanation: explanation.trim()
      };
    });
    
    return sanitized;
  };

  const handleLaunchPastedExam = async () => {
    try {
      setJsonError('');
      const parsedQuestions = parseAndSanitizeQuestions(pastedJson);

      let examName = customExamName.trim();
      if (!examName) {
        const d = new Date();
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const month = months[d.getMonth()];
        const day = d.getDate();
        let hr = d.getHours();
        const min = String(d.getMinutes()).padStart(2, '0');
        const ampm = hr >= 12 ? 'PM' : 'AM';
        hr = hr % 12;
        hr = hr ? hr : 12;
        examName = `Pasted Exam - ${month} ${day}, ${hr}:${min} ${ampm}`;
      }

      try {
        const res = await fetch('/api/pdfs/save-custom-exam', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: examName, questions: parsedQuestions })
        });
        if (res.ok) {
          showNotif(`Exam auto-saved as '${examName}' & loaded! ✓`);
          await fetchPdfs();
          setSelectedFile(examName);
        } else {
          showNotif('Loaded exam (failed to save to database) ✕');
        }
      } catch (dbErr) {
        showNotif('Loaded exam (database offline) ✕');
      }

      setQuestions(parsedQuestions);
      setAnswers({});
      setCurrentIdx(0);
      setInExam(true);
      setExamSubmitted(false);
      const duration = parsedQuestions.length * 90;
      setExamDuration(duration);
      setTimeLeft(duration);
    } catch (err) {
      setJsonError(err.message);
      showNotif('JSON Parse Failed ✕');
    }
  };

  // Timer Effect
  useEffect(() => {
    if (inExam && timeLeft > 0 && !examSubmitted) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            submitExam();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [inExam, examSubmitted, timeLeft]);

  // Format Time (MM:SS or HH:MM:SS)
  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    
    const mm = String(m).padStart(2, '0');
    const ss = String(s).padStart(2, '0');
    
    return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
  };

  // Select a choice
  const selectChoice = (choiceIdx) => {
    if (examSubmitted) return;
    if (answers[currentIdx] !== undefined) return; // Answered already
    
    setAnswers(prev => ({
      ...prev,
      [currentIdx]: choiceIdx
    }));
  };

  // Submit Exam for Evaluation
  const submitExam = () => {
    clearInterval(timerRef.current);
    setTimeTaken(examDuration - timeLeft);
    setExamSubmitted(true);
    showNotif('Exam evaluated successfully! Check your result card 📊');
  };

  // Exit/Reset Simulator
  const exitSimulator = () => {
    setInExam(false);
    setQuestions([]);
    setAnswers({});
    setExamSubmitted(false);
    clearInterval(timerRef.current);
  };

  // Calculate stats
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(answers).length;
  
  const correctCount = questions.reduce((acc, q, idx) => {
    return acc + (answers[idx] === q.correctIndex ? 1 : 0);
  }, 0);

  const scorePct = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
  const isPassed = scorePct >= 50;

  // Group performance by subject area
  const getSubjectBreakdown = () => {
    const subjects = {
      "Networking & Protocols": { total: 0, correct: 0, keywords: ['cidr', 'ip', 'mac', 'subnet', 'tcp', 'udp', 'osi', 'router', 'protocol', 'port', 'dns', 'dhcp', 'rip', 'ospf', 'bgp', 'nat', 'arp'] },
      "Data Structures & Algorithms": { total: 0, correct: 0, keywords: ['binary search', 'sort', 'linked list', 'tree', 'bst', 'heap', 'complexity', 'graph', 'stack', 'queue', 'array', 'big-o', 'search'] },
      "Database Management": { total: 0, correct: 0, keywords: ['database', 'sql', 'join', 'key', 'normalization', 'transaction', 'acid', 'composite', '1nf', '2nf', '3nf', 'bcnf', 'nosql', 'mongodb'] },
      "Software Engineering & PM": { total: 0, correct: 0, keywords: ['agile', 'scrum', 'waterfall', 'sdlc', 'uml', 'testing', 'spiral', 'cohesion', 'coupling', 'solid', 'wbs', 'critical path', 'float', 'cpi', 'spi'] },
      "AI, Security & Other Core": { total: 0, correct: 0, keywords: [] } // Catch-all
    };

    questions.forEach((q, idx) => {
      const text = q.text.toLowerCase();
      const selection = answers[idx];
      const isCorrect = selection === q.correctIndex;

      let categorized = false;
      for (const [subjName, data] of Object.entries(subjects)) {
        if (data.keywords.length > 0 && data.keywords.some(kw => text.includes(kw))) {
          data.total++;
          if (isCorrect) data.correct++;
          categorized = true;
          break;
        }
      }

      if (!categorized) {
        subjects["AI, Security & Other Core"].total++;
        if (isCorrect) subjects["AI, Security & Other Core"].correct++;
      }
    });

    return Object.entries(subjects).filter(([_, data]) => data.total > 0);
  };

  // Rendering loading
  if (loading) {
    return (
      <div className="empty-state" style={{ height: '50vh', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div className="empty-icon running-pulse">⚡</div>
        <p>Parsing PDF & Generating Interactive Exam Simulator...</p>
      </div>
    );
  }

  // === 1. START SCREEN ===
  if (!inExam) {
    return (
      <div className="fade-in" style={{ padding: '8px 4px' }}>
        <div className="day-header-card" style={{ marginBottom: '20px', borderLeft: '3px solid var(--accent2)' }}>
          <div className="day-big-title">Exit Exam Simulator 📝</div>
          <p style={{ fontSize: '12px', color: 'var(--text2)', marginTop: '4px' }}>
            Upload any academic assessment PDF and convert it instantly into an interactive, time-boxed exam practice simulation.
          </p>
        </div>

        <div className="lesson-card" style={{ padding: '24px' }}>
          <h3 style={{ color: 'var(--text)', marginBottom: '16px', fontSize: '14px', fontWeight: '600' }}>Select Exam PDF to Practice</h3>
          
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <select 
              value={selectedFile} 
              onChange={e => setSelectedFile(e.target.value)}
              style={{
                flex: 1,
                minWidth: '200px',
                background: 'var(--surface2)',
                border: '1px solid var(--border2)',
                color: 'var(--text)',
                padding: '10px 14px',
                borderRadius: 'var(--radius)',
                outline: 'none',
                fontFamily: 'var(--sans)'
              }}
            >
              <option value="">💡 Standalone Mock Exam (Offline Fallback)</option>
              {pdfs.map((pdf, idx) => (
                <option key={idx} value={pdf.filename}>
                  {pdf.isCustom ? `📝 ${pdf.filename} (Saved Paste)` : `📁 ${pdf.filename} (${Math.round(pdf.size / 1024)} KB)`}
                </option>
              ))}
            </select>
            
            <button 
              className="addbtn" 
              onClick={startExam}
              style={{
                background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
                border: 'none',
                color: 'white',
                padding: '10px 20px',
                fontSize: '13px'
              }}
            >
              🚀 Launch Simulator
            </button>
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
            <h4 style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '10px' }}>Upload New Exam PDF</h4>
            <div style={{
              border: '2px dashed var(--border2)',
              borderRadius: 'var(--radius-lg)',
              padding: '24px',
              textAlign: 'center',
              background: 'var(--surface2)'
            }}>
              <p style={{ fontSize: '12.5px', color: 'var(--text3)', marginBottom: '12px' }}>
                Drag and drop your model exam or practice PDF here
              </p>
              <label 
                className="cover-btn" 
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  borderColor: 'var(--accent)', 
                  color: 'var(--accent)',
                  margin: '0 auto' 
                }}
              >
                <span>📁 Browse Files</span>
                <input type="file" accept=".pdf" onChange={handleUpload} style={{ display: 'none' }} />
              </label>
            </div>
          </div>
        </div>

        <div className="lesson-card" style={{ padding: '24px', marginTop: '20px' }}>
          <h3 style={{ color: 'var(--text)', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
            Option 2: Paste Exam JSON (Gemini / Claude Fallback)
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text2)', marginBottom: '16px' }}>
            If PDF upload fails or backend is offline, you can copy the text from your exam PDF, ask an AI (like Gemini or Claude) to format it into JSON, and paste it here.
          </p>

          <button 
            onClick={() => setShowPromptInstructions(!showPromptInstructions)}
            style={{
              background: 'none',
              border: '1px solid var(--border2)',
              color: 'var(--accent)',
              padding: '6px 12px',
              borderRadius: 'var(--radius)',
              cursor: 'pointer',
              fontSize: '12px',
              fontFamily: 'var(--mono)',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s'
            }}
          >
            {showPromptInstructions ? '🔽 Hide LLM Prompt Instructions' : '👉 Show LLM Prompt Instructions'}
          </button>

          {showPromptInstructions && (
            <div style={{
              background: 'var(--surface2)',
              border: '1px solid var(--border2)',
              borderRadius: 'var(--radius)',
              padding: '16px',
              marginBottom: '16px',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--text3)' }}>COPY THIS PROMPT FOR GEMINI:</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(GEMINI_PROMPT_TEMPLATE);
                    showNotif('Prompt template copied to clipboard! ✓');
                  }}
                  style={{
                    background: 'var(--accent)',
                    border: 'none',
                    color: 'white',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  📋 Copy Prompt
                </button>
              </div>
              <pre style={{
                fontFamily: 'var(--mono)',
                fontSize: '11px',
                color: 'var(--text2)',
                whiteSpace: 'pre-wrap',
                background: '#0d0f14',
                padding: '12px',
                borderRadius: '6px',
                maxHeight: '200px',
                overflowY: 'auto',
                border: '1px solid var(--border)'
              }}>
                {GEMINI_PROMPT_TEMPLATE}
              </pre>
            </div>
          )}

          <textarea
            placeholder='Paste your JSON exam array here... e.g. [{"number": 1, "text": "...", "choices": [...], "correctIndex": 0}]'
            value={pastedJson}
            onChange={e => setPastedJson(e.target.value)}
            style={{
              width: '100%',
              height: '140px',
              background: 'var(--surface2)',
              border: '1px solid ' + (jsonError ? 'var(--red)' : 'var(--border2)'),
              color: 'var(--text)',
              padding: '12px',
              borderRadius: 'var(--radius)',
              outline: 'none',
              fontFamily: 'var(--mono)',
              fontSize: '12px',
              resize: 'vertical',
              marginBottom: '10px'
            }}
          />

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            padding: '12px 16px',
            borderRadius: 'var(--radius)',
            marginBottom: '16px'
          }}>
            <span style={{ fontSize: '12.5px', color: 'var(--text2)' }}>💾 Custom Exam Name (optional):</span>
            <input
              type="text"
              placeholder="Enter custom exam name (or leave empty to auto-generate)..."
              value={customExamName}
              onChange={e => setCustomExamName(e.target.value)}
              style={{
                flex: 1,
                minWidth: '200px',
                background: 'var(--surface2)',
                border: '1.5px solid var(--border2)',
                color: 'var(--text)',
                padding: '8px 12px',
                borderRadius: 'var(--radius)',
                fontSize: '12px',
                outline: 'none',
                fontFamily: 'var(--sans)'
              }}
            />
          </div>

          {jsonError && (
            <div style={{
              color: 'var(--red)',
              fontSize: '12px',
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid var(--red)',
              padding: '10px 14px',
              borderRadius: 'var(--radius)',
              marginBottom: '14px',
              fontFamily: 'var(--mono)'
            }}>
              ⚠️ {jsonError}
            </div>
          )}

          <button
            className="addbtn"
            onClick={handleLaunchPastedExam}
            style={{
              background: 'linear-gradient(135deg, var(--accent2), #8a3ffc)',
              border: 'none',
              color: 'white',
              padding: '10px 20px',
              fontSize: '13px',
              width: '100%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontWeight: '600'
            }}
          >
            ⚡ Load & Run Exam Simulator
          </button>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentIdx];

  // === 2. REPORT CARD SCREEN ===
  if (examSubmitted) {
    const breakdown = getSubjectBreakdown();
    return (
      <div className="fade-in" style={{ padding: '8px 4px' }}>
        <div className="day-header-card" style={{ textAlign: 'center', padding: '30px 20px' }}>
          <div style={{ fontSize: '13px', fontFamily: 'var(--mono)', color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            ASSESSMENT SUMMARY REPORT
          </div>
          <div style={{
            fontSize: '48px',
            fontWeight: '800',
            color: isPassed ? 'var(--green)' : 'var(--red)',
            margin: '12px 0 4px'
          }}>
            {scorePct}%
          </div>
          <div style={{
            display: 'inline-block',
            background: isPassed ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: isPassed ? 'var(--green)' : 'var(--red)',
            padding: '4px 14px',
            borderRadius: '20px',
            fontWeight: '700',
            fontSize: '11px',
            letterSpacing: '0.05em',
            textTransform: 'uppercase'
          }}>
            {isPassed ? 'PASSED STUDY METRIC' : 'FAILED STUDY METRIC'}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '20px', color: 'var(--text2)', fontSize: '13px' }}>
            <div>
              <span style={{ color: 'var(--text)', fontWeight: '600' }}>{correctCount}</span> of {totalQuestions} Correct
            </div>
            <div>
              Time Taken: <span style={{ color: 'var(--text)', fontWeight: '600' }}>{formatTime(timeTaken)}</span>
            </div>
          </div>
        </div>

        {/* Breakdown by subject */}
        <div className="lesson-card" style={{ padding: '20px 24px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text)', marginBottom: '16px', borderBottom: '1px solid var(--border)', paddingBottom: '10px' }}>
            📊 Performance Breakdown by Subject Area
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {breakdown.map(([subj, data], idx) => {
              const pct = Math.round((data.correct / data.total) * 100);
              return (
                <div key={idx}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text2)', fontWeight: '500' }}>{subj}</span>
                    <span style={{ color: 'var(--accent)', fontWeight: '700' }}>{pct}% ({data.correct}/{data.total})</span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--border2)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: pct >= 75 ? 'var(--green)' : pct >= 50 ? 'var(--yellow)' : 'var(--red)', borderRadius: '3px' }}></div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '28px' }}>
            <button 
              className="cover-btn"
              onClick={() => {
                setExamSubmitted(false);
                setAnswers({});
                setCurrentIdx(0);
                setTimeLeft(examDuration);
              }}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              🔄 Retake Exam
            </button>
            <button 
              className="cover-btn covered"
              onClick={exitSimulator}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              🚪 Exit Simulator
            </button>
          </div>
        </div>
      </div>
    );
  }

  // === 3. ACTIVE SIMULATION VIEW ===
  const selectedChoice = answers[currentIdx];
  const isQuestionAnswered = selectedChoice !== undefined;

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      
      {/* Simulator top control bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        padding: '12px 18px',
        borderRadius: 'var(--radius-lg)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text)' }}>
            Practice Mode: {selectedFile || 'Offline Standalone Mock'}
          </span>
          <span style={{ fontSize: '10.5px', color: 'var(--text3)' }}>
            Answered {answeredCount} of {totalQuestions} questions
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            fontFamily: 'var(--mono)',
            fontSize: '18px',
            fontWeight: '700',
            color: timeLeft < 300 ? 'var(--red)' : 'var(--yellow)',
            background: 'var(--surface2)',
            padding: '4px 12px',
            borderRadius: '20px',
            border: '1.5px solid ' + (timeLeft < 300 ? 'var(--red)' : 'var(--border2)')
          }}>
            ⏱️ {formatTime(timeLeft)}
          </div>
          <button 
            className="cover-btn covered" 
            onClick={submitExam}
            style={{ borderColor: 'var(--green)', color: 'var(--green)' }}
          >
            Submit Exam
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        
        {/* Main question card */}
        <div className="lesson-card" style={{ flex: 2, minWidth: '300px', marginBottom: 0 }}>
          <div style={{
            fontSize: '11px',
            fontFamily: 'var(--mono)',
            color: 'var(--accent)',
            marginBottom: '10px',
            fontWeight: '600'
          }}>
            QUESTION {currentIdx + 1} OF {totalQuestions}
          </div>
          
          <h2 style={{
            fontSize: '14.5px',
            fontWeight: '600',
            color: 'var(--text)',
            lineHeight: '1.6',
            marginBottom: '20px'
          }}>
            {currentQ.text}
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
            {currentQ.choices.map((choice, idx) => {
              const letter = choice.letter;
              const text = choice.text;
              
              // Answer coloring logic
              let choiceStyle = {
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                background: 'var(--surface2)',
                border: '1.5px solid var(--border2)',
                borderRadius: 'var(--radius)',
                cursor: isQuestionAnswered ? 'default' : 'pointer',
                textAlign: 'left',
                width: '100%',
                color: 'var(--text)',
                fontFamily: 'var(--sans)',
                fontSize: '13px',
                transition: 'all 0.15s ease'
              };

              if (!isQuestionAnswered) {
                // Hover effect added inline via mouse enter/leave is complex, so we rely on global rules
              } else {
                // If this is the correct choice, color it green
                if (idx === currentQ.correctIndex) {
                  choiceStyle.borderColor = 'var(--green)';
                  choiceStyle.background = 'rgba(34, 197, 94, 0.08)';
                  choiceStyle.color = 'var(--green)';
                }
                // If user selected this choice and it's incorrect, color it red
                else if (selectedChoice === idx) {
                  choiceStyle.borderColor = 'var(--red)';
                  choiceStyle.background = 'rgba(239, 68, 68, 0.08)';
                  choiceStyle.color = 'var(--red)';
                }
              }

              return (
                <button 
                  key={idx} 
                  style={choiceStyle}
                  onClick={() => selectChoice(idx)}
                  disabled={isQuestionAnswered}
                >
                  <span style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: isQuestionAnswered 
                      ? (idx === currentQ.correctIndex ? 'var(--green)' : (selectedChoice === idx ? 'var(--red)' : 'var(--border2)'))
                      : 'var(--border2)',
                    color: isQuestionAnswered && (idx === currentQ.correctIndex || selectedChoice === idx) ? '#white' : 'var(--text)',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    flexShrink: 0
                  }}>
                    {isQuestionAnswered && idx === currentQ.correctIndex ? '✓' : (isQuestionAnswered && selectedChoice === idx ? '✕' : letter)}
                  </span>
                  <span>{text}</span>
                </button>
              );
            })}
          </div>

          {/* Explanation box shown immediately upon selection */}
          {isQuestionAnswered && (
            <div className={`lesson-highlight ${selectedChoice === currentQ.correctIndex ? 'exam' : 'trap'}`} style={{ marginTop: '20px' }}>
              <div style={{ fontWeight: '700', fontSize: '12px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {selectedChoice === currentQ.correctIndex ? '✓ Correct Answer' : '✕ Incorrect Answer'}
              </div>
              <p style={{ fontSize: '13px', lineHeight: '1.6' }}>
                <strong>Explanation: </strong> {currentQ.explanation}
              </p>
            </div>
          )}

          {/* Navigation keys */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '24px',
            borderTop: '1px solid var(--border)',
            paddingTop: '16px'
          }}>
            <button 
              className="cover-btn"
              disabled={currentIdx === 0}
              onClick={() => setCurrentIdx(prev => prev - 1)}
            >
              ⬅ Previous
            </button>
            <button 
              className="cover-btn"
              disabled={currentIdx === totalQuestions - 1}
              onClick={() => setCurrentIdx(prev => prev + 1)}
            >
              Next ➡
            </button>
          </div>
        </div>

        {/* Sidebar question grid navigator */}
        <div className="lesson-card" style={{ flex: 1, minWidth: '220px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text2)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Question Map
          </h3>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(36px, 1fr))',
            gap: '8px',
            overflowY: 'auto',
            maxHeight: '360px',
            paddingRight: '4px'
          }}>
            {questions.map((q, idx) => {
              const selection = answers[idx];
              const isAnswered = selection !== undefined;
              const isCorrect = isAnswered && selection === q.correctIndex;
              
              let btnStyle = {
                height: '36px',
                borderRadius: '8px',
                fontFamily: 'var(--mono)',
                fontSize: '11px',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                border: '1.5px solid var(--border2)',
                background: 'var(--surface2)',
                color: 'var(--text2)',
                transition: 'all 0.15s'
              };

              if (idx === currentIdx) {
                btnStyle.borderColor = 'var(--accent)';
                btnStyle.color = 'var(--accent)';
                btnStyle.background = 'rgba(79, 142, 247, 0.08)';
              } else if (isAnswered) {
                if (isCorrect) {
                  btnStyle.borderColor = 'var(--green)';
                  btnStyle.background = 'rgba(34, 197, 94, 0.15)';
                  btnStyle.color = 'var(--green)';
                } else {
                  btnStyle.borderColor = 'var(--red)';
                  btnStyle.background = 'rgba(239, 68, 68, 0.15)';
                  btnStyle.color = 'var(--red)';
                }
              }

              return (
                <div 
                  key={idx} 
                  style={btnStyle}
                  onClick={() => setCurrentIdx(idx)}
                  title={`Question ${idx + 1}`}
                >
                  {idx + 1}
                </div>
              );
            })}
          </div>

          <div style={{ borderTop: '1px solid var(--border)', marginTop: '20px', paddingTop: '14px', fontSize: '11px', color: 'var(--text3)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(34, 197, 94, 0.15)', border: '1px solid var(--green)' }}></span>
              <span>Correct Answer</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--red)' }}></span>
              <span>Incorrect Answer</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '2px', background: 'rgba(79, 142, 247, 0.08)', border: '1px solid var(--accent)' }}></span>
              <span>Active Question</span>
            </div>
          </div>
          
          <button 
            className="cover-btn" 
            onClick={exitSimulator} 
            style={{ marginTop: '20px', borderColor: 'var(--border2)', color: 'var(--text3)', justifyContent: 'center' }}
          >
            🚪 Quit Exam
          </button>
        </div>

      </div>

    </div>
  );
}
