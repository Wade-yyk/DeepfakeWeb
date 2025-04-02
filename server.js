const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const port = 3000;

// Render 持久化磁盘挂载路径
const UPLOAD_PATH = '/mnt/uploads';
const VOTES_FILE = path.join(UPLOAD_PATH, 'votes.json');

// 确保上传路径存在
if (!fs.existsSync(UPLOAD_PATH)) {
  fs.mkdirSync(UPLOAD_PATH, { recursive: true });
}

// 解析 JSON 请求体
app.use(express.json());

// 提供静态文件服务
app.use(express.static(path.join(__dirname, 'public')));

// 提供上传图片静态访问路径
app.use('/uploads', express.static(UPLOAD_PATH));

// 配置 Multer 存储上传文件
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

// 上传图片接口
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  const fileUrl = `/uploads/${req.file.filename}`;
  res.json({ fileUrl });
});

// 获取上传的图片列表
app.get('/images', (req, res) => {
  fs.readdir(UPLOAD_PATH, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Unable to list files' });
    }
    const images = files
      .filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file)) // 仅图片
      .map(file => `/uploads/${file}`);
    res.json({ images });
  });
});

// 加载投票记录
function loadVotes() {
  if (!fs.existsSync(VOTES_FILE)) {
    return {};
  }
  const data = fs.readFileSync(VOTES_FILE);
  return JSON.parse(data);
}

// 保存投票记录
function saveVotes(votes) {
  fs.writeFileSync(VOTES_FILE, JSON.stringify(votes, null, 2));
}

// 获取某张图片的投票数
app.get('/votes', (req, res) => {
  const imageUrl = req.query.imageUrl;
  const votes = loadVotes();
  const vote = votes[imageUrl] || { option1: 0, option2: 0 };
  res.json(vote);
});

// 提交投票
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

// 删除图片 + 删除对应的投票数据
app.delete('/delete-image', (req, res) => {
  const { filename } = req.body;

  if (!filename) {
    return res.status(400).json({ error: 'Filename is required' });
  }

  const filePath = path.join(UPLOAD_PATH, filename);

  // 删除图片文件
  fs.unlink(filePath, (err) => {
    if (err) {
      return res.status(500).json({ error: 'Failed to delete image', details: err.message });
    }

    // 删除对应投票记录
    const votes = loadVotes();
    const imageUrl = `/uploads/${filename}`;
    if (votes[imageUrl]) {
      delete votes[imageUrl];
      saveVotes(votes);
    }

    res.json({ success: true, message: 'Image and vote data deleted.' });
  });
});

// 启动服务
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
