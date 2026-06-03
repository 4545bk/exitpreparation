const mongoose = require('mongoose');
require('dotenv').config();

const Exam = require('./models/Exam.js');

async function checkExams() {
  const uri = process.env.MONGODB_URI;
  console.log("Connecting to:", uri);
  await mongoose.connect(uri);
  console.log("Connected.");
  
  const exams = await Exam.find({});
  console.log(`Found ${exams.length} exams in DB.`);
  exams.forEach(e => {
    console.log(`- Name: "${e.name}", Type: "${e.type}", Questions Count: ${e.questions.length}`);
  });
  
  await mongoose.connection.close();
}

checkExams().catch(err => {
  console.error(err);
  process.exit(1);
});
