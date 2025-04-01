// server.js (Cloudinary + in-memory voting version)

const express = require('express');
const multer = require('multer');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const app = express();
const port = process.env.PORT || 3000;

// Use environment variables (set them on Render)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Use Cloudinary for file storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'deepfake-images',
    allowed_formats: ['jpg', 'png', 'jpeg']
  }
});

const upload = multer({ storage });

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// In-memory vote storage (will be reset when server restarts)
const votes = {}; // { imageUrl: { option1: 0, option2: 0 } }

// Upload image
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file || !req.file.path) {
    return res.status(400).json({ error: 'Upload failed' });
  }
  res.json({ fileUrl: req.file.path });
});

// List images (not available in Cloudinary directly — should be stored separately or queried via Cloudinary API)
app.get('/images', (req, res) => {
  res.status(501).json({ error: 'Image listing is not implemented (Cloudinary)' });
});

// Get votes for an image
app.get('/votes', (req, res) => {
  const imageUrl = req.query.imageUrl;
  if (!imageUrl) return res.status(400).json({ error: 'Missing imageUrl' });
  const vote = votes[imageUrl] || { option1: 0, option2: 0 };
  res.json(vote);
});

// Submit a vote
app.post('/vote', (req, res) => {
  const { imageUrl, option } = req.body;
  if (!imageUrl || !['option1', 'option2'].includes(option)) {
    return res.status(400).json({ error: 'Invalid vote data' });
  }
  if (!votes[imageUrl]) {
    votes[imageUrl] = { option1: 0, option2: 0 };
  }
  votes[imageUrl][option]++;
  res.json(votes[imageUrl]);
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
