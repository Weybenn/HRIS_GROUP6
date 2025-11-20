const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createConnection } = require('./db_config');

const router = express.Router();

const uploadsDir = path.join(__dirname, 'uploads', 'profile');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const userId = req.body.user_id || 'unknown';
    const ext = path.extname(file.originalname);
    const safeName = `pp_${userId}_${Date.now()}${ext}`;
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const allowed = ['.png', '.jpg', '.jpeg', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) return cb(new Error('Only images are allowed'));
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, 
});

async function updateUserProfilePicture(userId, relativePath) {
  const conn = await createConnection();
  try {
    await conn.execute('UPDATE users SET profile_picture = ? WHERE id = ?', [relativePath, userId]);
  } finally {
    await conn.end();
  }
}

async function getCurrentProfilePicture(userId) {
  const conn = await createConnection();
  try {
    const [rows] = await conn.execute('SELECT profile_picture FROM users WHERE id = ? LIMIT 1', [userId]);
    if (!rows || rows.length === 0) return null;
    return rows[0].profile_picture;
  } finally {
    await conn.end();
  }
}

router.post('/profile-picture', upload.single('file'), async (req, res) => {
  const userId = req.body.user_id;
  if (!userId) {
    return res.status(400).json({ error: 'user_id is required' });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  try {
    const relative = `/uploads/profile/${req.file.filename}`;
    await updateUserProfilePicture(userId, relative);
    res.json({ success: true, profile_picture: relative });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update profile picture', details: err.message });
  }
});

router.delete('/profile-picture/:userId', async (req, res) => {
  const userId = req.params.userId;
  try {
    const current = await getCurrentProfilePicture(userId);
    if (current) {
      const abs = path.join(__dirname, current.replace(/^\//, ''));
      if (fs.existsSync(abs)) {
        try { fs.unlinkSync(abs); } catch (_e) {}
      }
    }
    await updateUserProfilePicture(userId, null);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to remove profile picture', details: err.message });
  }
});

module.exports = router;
