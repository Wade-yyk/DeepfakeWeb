const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

const UPLOAD_PATH = '/mnt/uploads';
const VOTES_FILE = path.join(UPLOAD_PATH, 'votes.json');

if (!fs.existsSync(UPLOAD_PATH)) {
  fs.mkdirSync(UPLOAD_PATH, { recursive: true });
}


app.use(express.json());


app.use(express.static(path.join(__dirname, 'public')));


app.use('/uploads', express.static(UPLOAD_PATH));


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


app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ fileUrl });
});


app.get('/images', (req, res) => {
  fs.readdir(UPLOAD_PATH, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Unable to list files' });
    }
    const images = files
      .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file)) 
      .map(file => `/uploads/${file}`);
    res.json({ images });
  });
});


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

app.get('/votes', (req, res) => {
  const imageUrl = req.query.imageUrl;
  const votes = loadVotes();
  const vote = votes[imageUrl] || { option1: 0, option2: 0 };
  res.json(vote);
});

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
