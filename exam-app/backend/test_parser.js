const fs = require('fs');
const path = require('path');

const PDF_DIR = path.join(__dirname, 'pdfs');

async function testParse() {
  const files = fs.readdirSync(PDF_DIR).filter(f => f.toLowerCase().endsWith('.pdf'));
  console.log(`Found ${files.length} PDFs in pdfs directory:`, files);
  
  for (const file of files) {
    console.log(`\nTesting parse for: "${file}"`);
    try {
      const res = await fetch(`http://localhost:3001/api/pdfs/parse-exam/${encodeURIComponent(file)}`);
      if (res.ok) {
        const data = await res.json();
        console.log(`Status: 200 OK. Questions Count: ${data.questionsCount}`);
      } else {
        const errData = await res.json();
        console.log(`Status: ${res.status}. Error:`, errData);
      }
    } catch (e) {
      console.error(`Fetch failed for ${file}:`, e.message);
    }
  }
}

testParse();
