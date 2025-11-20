const express = require('express');
const bcrypt = require('bcryptjs');
const { createConnection } = require('./db_config');

const router = express.Router();

async function verifyCurrentPassword(userId, currentPassword) {
  const conn = await createConnection();
  try {
    const [rows] = await conn.execute('SELECT password FROM users WHERE id = ? LIMIT 1', [userId]);
    if (!rows || rows.length === 0) return false;
    return await bcrypt.compare(currentPassword, rows[0].password);
  } finally {
    await conn.end();
  }
}

async function updatePassword(userId, newPassword) {
  const conn = await createConnection();
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await conn.execute('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
  } finally {
    await conn.end();
  }
}

router.post('/change-password', async (req, res) => {
  const { user_id, old_password, new_password, confirm_password } = req.body;
  
  if (!user_id || !old_password || !new_password || !confirm_password) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  if (new_password !== confirm_password) {
    return res.status(400).json({ error: 'New password and confirm password do not match' });
  }
  
  if (new_password.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters long' });
  }
  
  try {
    const isValidPassword = await verifyCurrentPassword(user_id, old_password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }
    
    await updatePassword(user_id, new_password);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to change password', details: err.message });
  }
});

module.exports = router;
