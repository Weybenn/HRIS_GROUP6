const express = require('express');
const bcrypt = require('bcryptjs');
const { pool } = require('./db_config');
const { sendPasswordResetEmail } = require('./email_create_reset_account');

const router = express.Router();

const DEFAULT_PASSWORD = 'EARIST1945';

router.post('/reset-password', async (req, res) => {
  const { user_id } = req.body || {};
  if (!user_id) return res.status(400).json({ error: 'user_id is required' });
  
  try {
    const [userRows] = await pool.query(
      'SELECT id, first_name, middle_name, last_name, email, employee_id FROM users WHERE id = ?',
      [user_id]
    );
    
    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userRows[0];
    const userName = `${user.first_name} ${user.middle_name || ''} ${user.last_name}`.trim();
    
    const hashed = await bcrypt.hash(DEFAULT_PASSWORD, 10);
    const [result] = await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, user_id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    try {
      await sendPasswordResetEmail(user.email, userName, user.employee_id, DEFAULT_PASSWORD);
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error resetting password:', err);
    res.status(500).json({ error: 'Failed to reset password', details: err.message });
  }
});

module.exports = router;