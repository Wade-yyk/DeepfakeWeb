const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Persistent storage path (used with Render Persistent Disk)
const UPLOAD_PATH = '/mnt/uploads';
const VOTES_FILE = path.join(UPLOAD_PATH, 'votes.json');

// Ensure upload path exists
if (!fs.existsSync(UPLOAD_PATH)) {
  fs.mkdirSync(UPLOAD_PATH, { recursive: true });
}

// Middleware to parse JSON
app.use(express.json());

// Serve public static files (HTML/CSS/JS)
app.use(express.static(path.join(__dirname, 'public')));

// Serve uploaded images from persistent disk
app.use('/uploads', express.static(UPLOAD_PATH));

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_PATH);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage: storage });

// Handle image uploads
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ fileUrl });
});

// List uploaded images
app.get('/images', (req, res) => {
  fs.readdir(UPLOAD_PATH, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Unable to list files' });
    }
    const images = files
      .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file)) // filter out non-image files
      .map(file => `/uploads/${file}`);
    res.json({ images });
  });
});

// ----- Voting Functions -----

function loadVotes() {
  if (!fs.existsSync(VOTES_FILE)) {
    return {};
  }
  const data = fs.readFileSync(VOTES_FILE);
  return JSON.parse(data);
}

function saveVotes(votes) {
  fs.writeFileSync(VOTES_FILE, JSON.stringify(votes, null, 2));
}

// Get votes for specific image
app.get('/votes', (req, res) => {
  const imageUrl = req.query.imageUrl;
  const votes = loadVotes();
  const vote = votes[imageUrl] || { option1: 0, option2: 0 };
  res.json(vote);
});

// Submit vote
app.post('/vote', (req, res) => {
  const { imageUrl, option } = req.body;
  if (!imageUrl || !option || (option !== 'option1' && option !== 'option2')) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  const votes = loadVotes();
  if (!votes[imageUrl]) {
    votes[imageUrl] = { option1: 0, option2: 0 };
  }

  votes[imageUrl][option]++;
  saveVotes(votes);
  res.json(votes[imageUrl]);
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
