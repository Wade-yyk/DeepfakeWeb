const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(express.json());

// Serve static files from the public folder
app.use(express.static(path.join(__dirname, 'public')));

// Serve images from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));


// Configure multer to save files to uploads directory
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'public/uploads')); // Save to 'uploads' directory
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage: storage });

// Endpoint to handle image uploads
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // Return a URL pointing to the uploaded image
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ fileUrl });
});

// Endpoint to list uploaded images
app.get('/images', (req, res) => {
  const uploadsDir = path.join(__dirname, 'public/uploads');
  fs.readdir(uploadsDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Unable to list files' });
    }
    // Map each file to its URL
    const images = files.map(file => `/uploads/${file}`);
    res.json({ images });
  });
});

// ----- Voting Persistence -----
// We use a JSON file (votes.json) in the root directory to persist vote counts.

const votesFile = path.join(__dirname, 'votes.json');

function loadVotes() {
  if (!fs.existsSync(votesFile)) {
    return {};
  }
  const data = fs.readFileSync(votesFile);
  return JSON.parse(data);
}

function saveVotes(votes) {
  fs.writeFileSync(votesFile, JSON.stringify(votes, null, 2));
}

// Endpoint to get vote counts for a specific image
app.get('/votes', (req, res) => {
  const imageUrl = req.query.imageUrl;
  const votes = loadVotes();
  const vote = votes[imageUrl] || { option1: 0, option2: 0 };
  res.json(vote);
});

// Endpoint to submit a vote for an image
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

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
