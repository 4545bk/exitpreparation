# AAU Exit Exam — Study HQ

A comprehensive study web app for AAU IT Exit Exam preparation with Pomodoro timer, progress tracking, and PDF import.

## Quick Start

### Install dependencies
```bash
npm run install:all
```

### Start the app
```bash
npm run dev
```

This starts both:
- **Frontend** at http://localhost:5173
- **Backend** at http://localhost:3001

## Features

- 📚 **250+ study topics** across 13 IT courses organized in 7 days
- ⏱ **Pomodoro timer** with focus/break modes and browser notifications
- ✅ **Progress tracking** with checkbox + confidence dots (red/yellow/green)
- 💾 **Persistent storage** — progress saved to backend JSON file with auto-backup
- 📄 **PDF import** — drop lecture PDFs into `/backend/pdfs/` and extract topics
- ⌨ **Keyboard shortcuts** — Space(timer), R(reset), 1/2/3(modes), arrows(navigate days)
- 📊 **Study stats** — pomodoro count, weak topics, estimated hours remaining

## How to Add PDF Files

1. Place your PDF lecture slides into the `/backend/pdfs/` folder
2. Click the **📄 PDF Import** button in the app
3. Click **Refresh** to detect new PDFs
4. Click **Extract Topics** to auto-detect study topics
5. Select which topics to add and choose the target day/session

## Data Storage

- Progress is saved at: `/backend/data/progress.json`
- Auto-backups (last 10) at: `/backend/data/backups/`
- If backend is unreachable, falls back to browser localStorage

## Backup & Restore

### Backup
Copy `/backend/data/progress.json` to Google Drive or another safe location.

### Restore
Replace `/backend/data/progress.json` with your backup file and restart the app.

## Tech Stack

- **Frontend**: React 18 + Vite
- **Backend**: Express.js + Node.js
- **Storage**: JSON file database (progress.json)
- **PDF**: pdf-parse npm package
- **Fonts**: Space Mono + Sora (Google Fonts)
