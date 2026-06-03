const mongoose = require('mongoose');

const ProgressSchema = new mongoose.Schema({
  lastSaved: { type: Date, default: Date.now },
  examDate: { type: Date, default: () => new Date('2026-06-10T08:00:00Z') },
  pomodoroSessions: { type: Number, default: 0 },
  days: { type: mongoose.Schema.Types.Mixed, default: null }
});

module.exports = mongoose.model('Progress', ProgressSchema);
