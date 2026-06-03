const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();

const progressRoutes = require('./routes/progress');
const pdfRoutes = require('./routes/pdf');

const app = express();
const PORT = process.env.PORT || 3001;

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;
let dbConnected = false;

if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => {
      dbConnected = true;
      console.log('[study_hq] Connected to MongoDB Atlas successfully ✓');
    })
    .catch((err) => {
      console.error('[study_hq] MongoDB connection failure:', err.message);
    });
} else {
  console.warn('[study_hq] MONGODB_URI not found in env, running in offline/JSON mode');
}

// Make db state accessible to routers
app.use((req, res, next) => {
  req.dbConnected = dbConnected && mongoose.connection.readyState === 1;
  next();
});

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '10mb' }));

// Serve PDFs as static files
app.use('/pdfs', express.static(path.join(__dirname, 'pdfs')));

// Ensure required directories exist
const dirs = [
  path.join(__dirname, 'data'),
  path.join(__dirname, 'data', 'backups'),
  path.join(__dirname, 'pdfs')
];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Routes
app.use('/api/progress', progressRoutes);
app.use('/api/pdfs', pdfRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`[study_hq] Backend running on http://localhost:${PORT}`);
});
