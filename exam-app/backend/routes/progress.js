const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const Progress = require('../models/Progress');

const DATA_FILE = path.join(__dirname, '..', 'data', 'progress.json');
const BACKUP_DIR = path.join(__dirname, '..', 'data', 'backups');
const MAX_BACKUPS = 10;

function getDefaultData() {
  return {
    lastSaved: new Date().toISOString(),
    examDate: '2026-06-10T08:00:00Z',
    pomodoroSessions: 0,
    days: null // will be populated from frontend default
  };
}

function ensureFile() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(getDefaultData(), null, 2));
  }
}

function createBackup() {
  if (!fs.existsSync(DATA_FILE)) return;
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

  const now = new Date();
  const ts = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const backupPath = path.join(BACKUP_DIR, `progress_${ts}.json`);

  try {
    fs.copyFileSync(DATA_FILE, backupPath);
  } catch (e) {
    console.error('Backup failed:', e.message);
  }

  // Keep only last MAX_BACKUPS
  try {
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('progress_') && f.endsWith('.json'))
      .sort();
    while (files.length > MAX_BACKUPS) {
      fs.unlinkSync(path.join(BACKUP_DIR, files.shift()));
    }
  } catch (e) {
    console.error('Backup cleanup failed:', e.message);
  }
}

// GET /api/progress
router.get('/', async (req, res) => {
  if (req.dbConnected) {
    try {
      let progress = await Progress.findOne().sort({ lastSaved: -1 });
      if (!progress) {
        progress = new Progress(getDefaultData());
        await progress.save();
      }
      return res.json(progress);
    } catch (e) {
      console.warn('MongoDB progress read failed, falling back to local file:', e.message);
    }
  }

  ensureFile();
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const data = JSON.parse(raw);
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: 'Failed to read progress', details: e.message });
  }
});

// POST /api/progress
router.post('/', async (req, res) => {
  if (req.dbConnected) {
    try {
      const data = {
        ...req.body,
        lastSaved: new Date().toISOString()
      };
      
      let progress = await Progress.findOne();
      if (progress) {
        Object.assign(progress, data);
        await progress.save();
      } else {
        progress = new Progress(data);
        await progress.save();
      }
      return res.json({ success: true, lastSaved: progress.lastSaved });
    } catch (e) {
      console.warn('MongoDB progress save failed, falling back to local file:', e.message);
    }
  }

  try {
    createBackup();
    const data = {
      ...req.body,
      lastSaved: new Date().toISOString()
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    res.json({ success: true, lastSaved: data.lastSaved });
  } catch (e) {
    res.status(500).json({ error: 'Failed to save progress', details: e.message });
  }
});

// POST /api/progress/reset
router.post('/reset', async (req, res) => {
  if (req.dbConnected) {
    try {
      const defaultData = getDefaultData();
      await Progress.deleteMany({});
      const progress = new Progress(defaultData);
      await progress.save();
      return res.json({ success: true, message: 'Progress reset' });
    } catch (e) {
      console.warn('MongoDB progress reset failed, falling back to local file:', e.message);
    }
  }

  try {
    createBackup();
    const defaultData = getDefaultData();
    fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 2));
    res.json({ success: true, message: 'Progress reset' });
  } catch (e) {
    res.status(500).json({ error: 'Failed to reset progress', details: e.message });
  }
});

module.exports = router;
