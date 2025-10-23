// server.js
// Simple production-ready static server with image upload endpoint

const express = require('express');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure upload directory exists
const UPLOAD_DIR = path.join(__dirname, 'public', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname) || '.jpg';
    const safeBase = path.basename(file.originalname, ext).replace(/[^\w\-]+/g, '');
    const fname = `${safeBase || 'photo'}-${Date.now()}${ext.toLowerCase()}`;
    cb(null, fname);
  },
});
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// Middleware
app.use(cors());
app.use(express.json());

// Static file serving with caching
app.use(
  express.static(path.join(__dirname, 'public'), {
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  })
);

// Upload endpoint
app.post('/api/upload', upload.single('photo'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'No file uploaded' });
    }
    // Public URL for the uploaded file
    const publicUrl = `/uploads/${req.file.filename}`;
    return res.json({ ok: true, url: publicUrl });
  } catch (err) {
    console.error('Upload error:', err);
    return res.status(500).json({ ok: false, error: 'Upload failed' });
  }
});

// Fallback to index.html for SPA routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Let'sDate Zim server running at http://localhost:${PORT}`);
});
