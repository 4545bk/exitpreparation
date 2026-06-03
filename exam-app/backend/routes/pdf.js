const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Exam = require('../models/Exam');

const PDF_DIR = path.join(__dirname, '..', 'pdfs');

const IT_KEYWORDS = [
  'algorithm', 'complexity', 'protocol', 'layer', 'class', 'function',
  'database', 'security', 'network', 'process', 'memory', 'stack',
  'queue', 'tree', 'graph', 'sort', 'search', 'hash', 'encryption',
  'authentication', 'firewall', 'sql', 'html', 'css', 'javascript',
  'http', 'tcp', 'udp', 'ip', 'dns', 'osi', 'oop', 'inheritance',
  'polymorphism', 'encapsulation', 'abstraction', 'thread', 'deadlock',
  'normalization', 'index', 'join', 'key', 'relation', 'schema',
  'android', 'activity', 'intent', 'service', 'api', 'rest', 'crud',
  'agile', 'waterfall', 'scrum', 'sdlc', 'uml', 'testing', 'risk',
  'machine learning', 'neural', 'regression', 'classification',
  'clustering', 'supervised', 'unsupervised', 'heuristic', 'bfs', 'dfs'
];

function extractTopicsFromText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const topics = [];

  for (const line of lines) {
    if (line.length < 20 || line.length > 150) continue;

    const isNumbered = /^\d+[\.\)]\s/.test(line);
    const isBulleted = /^[•\-→▪►]\s/.test(line);
    const isAllCaps = line === line.toUpperCase() && line.length > 5 && /[A-Z]/.test(line);
    const hasKeyword = IT_KEYWORDS.some(kw => line.toLowerCase().includes(kw));

    if (isNumbered || isBulleted || isAllCaps || hasKeyword) {
      let cleaned = line
        .replace(/^\d+[\.\)]\s*/, '')
        .replace(/^[•\-→▪►]\s*/, '')
        .replace(/\s+/g, ' ')
        .trim();

      // Remove page numbers at end
      cleaned = cleaned.replace(/\s+\d+\s*$/, '');

      if (cleaned.length >= 15 && cleaned.length <= 150) {
        topics.push(cleaned);
      }
    }
  }

  // Deduplicate
  return [...new Set(topics)];
}

// GET /api/pdfs — list PDF files
router.get('/', (req, res) => {
  try {
    if (!fs.existsSync(PDF_DIR)) {
      fs.mkdirSync(PDF_DIR, { recursive: true });
      return res.json([]);
    }
    const files = fs.readdirSync(PDF_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));
    const result = files.map(f => {
      const stats = fs.statSync(path.join(PDF_DIR, f));
      return { filename: f, size: stats.size, modified: stats.mtime };
    });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'Failed to list PDFs', details: e.message });
  }
});

// GET /api/pdfs/custom-exams — get all saved custom pasted exams
router.get('/custom-exams', async (req, res) => {
  if (!req.dbConnected) {
    return res.json([]);
  }
  try {
    const exams = await Exam.find({ type: 'pasted' }).select('name createdAt questions');
    const result = exams.map(e => ({
      filename: e.name,
      questionsCount: e.questions.length,
      questions: e.questions,
      isCustom: true
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve custom exams', details: err.message });
  }
});

// POST /api/pdfs/save-custom-exam — save a pasted JSON exam
router.post('/save-custom-exam', async (req, res) => {
  if (!req.dbConnected) {
    return res.status(503).json({ error: 'Database offline, cannot save custom exam' });
  }
  const { name, questions } = req.body;
  if (!name || !questions || !Array.isArray(questions)) {
    return res.status(400).json({ error: 'name and questions array required' });
  }
  try {
    let exam = await Exam.findOne({ name, type: 'pasted' });
    if (exam) {
      exam.questions = questions;
      await exam.save();
    } else {
      exam = new Exam({
        name,
        type: 'pasted',
        questions
      });
      await exam.save();
    }
    res.json({ success: true, message: 'Custom exam saved successfully!', name });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save custom exam', details: err.message });
  }
});

// GET /api/pdfs/:filename — read and parse PDF
router.get('/:filename', async (req, res) => {
  const filePath = path.join(PDF_DIR, req.params.filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'PDF not found' });
  }

  try {
    const pdfParse = require('pdf-parse');
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);

    // Split into chapters
    const lines = data.text.split('\n');
    const chapters = [];
    let current = { title: 'Introduction', content: [] };

    for (const line of lines) {
      const isChapterHead = /^(chapter|CHAPTER)\s+\d/i.test(line.trim()) ||
        /^\d+\.\s+[A-Z]/.test(line.trim());
      if (isChapterHead && current.content.length > 0) {
        chapters.push({ ...current, content: current.content.join('\n') });
        current = { title: line.trim(), content: [] };
      } else {
        current.content.push(line);
      }
    }
    if (current.content.length > 0) {
      chapters.push({ ...current, content: current.content.join('\n') });
    }

    res.json({
      filename: req.params.filename,
      pages: data.numpages,
      text: data.text.substring(0, 5000),
      chapters: chapters.map(c => ({ title: c.title, preview: c.content.substring(0, 200) }))
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to parse PDF', details: e.message });
  }
});

// POST /api/pdfs/extract-topics
router.post('/extract-topics', async (req, res) => {
  const { filename } = req.body;
  if (!filename) return res.status(400).json({ error: 'filename required' });

  const filePath = path.join(PDF_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'PDF not found' });
  }

  try {
    const pdfParse = require('pdf-parse');
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    const topics = extractTopicsFromText(data.text);

    res.json({ filename, topicCount: topics.length, topics });
  } catch (e) {
    res.status(500).json({ error: 'Failed to extract topics', details: e.message });
  }
});

// POST /api/pdfs/upload — upload PDF via Base64
router.post('/upload', (req, res) => {
  const { filename, base64 } = req.body;
  if (!filename || !base64) {
    return res.status(400).json({ error: 'filename and base64 required' });
  }
  try {
    const filePath = path.join(PDF_DIR, filename);
    const buffer = Buffer.from(base64, 'base64');
    fs.writeFileSync(filePath, buffer);
    res.json({ message: 'File uploaded successfully', filename });
  } catch (e) {
    res.status(500).json({ error: 'Failed to upload PDF', details: e.message });
  }
});

// GET /api/pdfs/parse-exam/:filename — parse PDF exam questions
router.get('/parse-exam/:filename', async (req, res) => {
  const filename = req.params.filename;

  if (req.dbConnected) {
    try {
      const cachedExam = await Exam.findOne({ name: filename, type: 'pdf' });
      if (cachedExam) {
        console.log(`[study_hq] Loading exam '${filename}' from MongoDB cache ✓`);
        return res.json({ 
          filename: cachedExam.name, 
          questionsCount: cachedExam.questions.length, 
          questions: cachedExam.questions 
        });
      }
    } catch (err) {
      console.warn('MongoDB cache lookup failed, parsing file directly:', err.message);
    }
  }

  const filePath = path.join(PDF_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'PDF not found' });
  }
  try {
    const pdfParse = require('pdf-parse');
    const buffer = fs.readFileSync(filePath);
    const data = await pdfParse(buffer);
    const text = data.text;
    
    // Parse questions using regex splits
    const questionBlocks = text.split(/\n\s*(?:Q|Question|q)\s*(\d+)[\.\)]\s+/i);
    const questions = [];
    
    for (let i = 1; i < questionBlocks.length; i += 2) {
      const qNum = parseInt(questionBlocks[i]);
      const blockContent = questionBlocks[i+1];
      if (!blockContent) continue;
      
      const lines = blockContent.split('\n');
      let questionTextLines = [];
      const choices = [];
      let correctChoiceIndex = -1;
      let explanation = '';
      let readingExplanation = false;
      
      for (let j = 0; j < lines.length; j++) {
        const line = lines[j].trim();
        if (!line) continue;
        
        const choiceMatch = line.match(/^([✔\*\s]*)\s*([A-F])[\.\)]\s+(.*)$/);
        
        if (choiceMatch) {
          readingExplanation = false;
          const isCorrect = choiceMatch[1].includes('✔') || choiceMatch[1].includes('*');
          const letter = choiceMatch[2];
          const text = choiceMatch[3];
          
          choices.push({ letter, text });
          if (isCorrect) {
            correctChoiceIndex = choices.length - 1;
          }
        } else if (line.startsWith('Explanation:')) {
          readingExplanation = true;
          explanation = line.replace(/^Explanation:\s*/, '');
        } else if (readingExplanation) {
          explanation += ' ' + line;
        } else {
          if (choices.length === 0) {
            questionTextLines.push(line);
          } else {
            if (choices.length > 0) {
              choices[choices.length - 1].text += ' ' + line;
            }
          }
        }
      }
      
      const questionText = questionTextLines.join(' ').trim();
      
      questions.push({
        id: `q_${qNum}`,
        number: qNum,
        text: questionText,
        choices: choices,
        correctIndex: correctChoiceIndex !== -1 ? correctChoiceIndex : 0,
        explanation: explanation.trim() || 'No detailed explanation provided.'
      });
    }
    
    if (req.dbConnected && questions.length > 0) {
      try {
        const newExam = new Exam({
          name: filename,
          type: 'pdf',
          questions: questions
        });
        await newExam.save();
        console.log(`[study_hq] Cached parsed exam '${filename}' to MongoDB ✓`);
      } catch (err) {
        console.warn('Failed to cache parsed exam in MongoDB:', err.message);
      }
    }
    
    res.json({ filename, questionsCount: questions.length, questions });
  } catch (e) {
    res.status(500).json({ error: 'Failed to parse exam PDF', details: e.message });
  }
});

module.exports = router;
