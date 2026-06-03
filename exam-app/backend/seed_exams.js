const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config();

const Exam = require('./models/Exam.js');

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Error: MONGODB_URI is not set in backend/.env file.");
    process.exit(1);
  }

  console.log("Connecting to MongoDB Atlas...");
  await mongoose.connect(uri);
  console.log("Connected successfully.");

  const jsonPath = path.join(__dirname, 'exams.json');
  if (!fs.existsSync(jsonPath)) {
    console.error(`Error: exams.json not found at ${jsonPath}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const questionsArray = JSON.parse(rawData);

  if (!Array.isArray(questionsArray)) {
    console.error("Error: exams.json content is not a JSON array.");
    process.exit(1);
  }

  console.log(`Read ${questionsArray.length} questions from exams.json.`);

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const sanitizedQuestions = questionsArray.map((q, idx) => {
    const number = q.number || (idx + 1);
    const text = q.text || q.question || q.q;
    if (!text) {
      throw new Error(`Question at index ${idx} is missing its 'text' or 'question' field.`);
    }

    const rawChoices = q.choices || q.options || q.answers;
    if (!rawChoices || !Array.isArray(rawChoices)) {
      throw new Error(`Question #${number} is missing a 'choices' array.`);
    }

    const formattedChoices = rawChoices.map((choice, cIdx) => {
      return {
        letter: alphabet[cIdx] || String(cIdx + 1),
        text: String(choice).trim()
      };
    });

    const correctIdx = q.correctIndex !== undefined ? q.correctIndex : 0;
    const explanation = q.explanation || q.exp || q.rationale || "No detailed explanation provided.";

    return {
      id: `q_seeded_${idx + 1}`,
      number,
      text: text.trim(),
      choices: formattedChoices,
      correctIndex: correctIdx,
      explanation: explanation.trim()
    };
  });

  const examName = "IT Exit Exam (106 Questions)";

  // Check if exam already exists
  let exam = await Exam.findOne({ name: examName, type: 'pasted' });
  if (exam) {
    console.log(`Exam "${examName}" already exists in DB. Overwriting questions...`);
    exam.questions = sanitizedQuestions;
    await exam.save();
  } else {
    console.log(`Creating new Exam document "${examName}" in DB...`);
    exam = new Exam({
      name: examName,
      type: 'pasted',
      questions: sanitizedQuestions
    });
    await exam.save();
  }

  console.log(`Successfully seeded ${sanitizedQuestions.length} questions into DB!`);
  await mongoose.connection.close();
  console.log("Database connection closed safely.");
}

seed().catch(err => {
  console.error("Seeding failed with error:", err);
  process.exit(1);
});
