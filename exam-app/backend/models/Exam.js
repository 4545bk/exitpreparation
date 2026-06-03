const mongoose = require('mongoose');

const ChoiceSchema = new mongoose.Schema({
  letter: { type: String, required: true },
  text: { type: String, required: true }
});

const QuestionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  number: { type: Number, required: true },
  text: { type: String, required: true },
  choices: [ChoiceSchema],
  correctIndex: { type: Number, required: true },
  explanation: { type: String, default: '' }
});

const ExamSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  type: { type: String, enum: ['pdf', 'pasted'], required: true },
  questions: [QuestionSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Exam', ExamSchema);
