const express = require('express');
const { pool } = require('./db_config');
const { createAdminNotification } = require('./notification');

const router = express.Router();

router.post('/forgot-password/check-email', async (req, res) => {
  const { email } = req.body || {};
  
  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const [users] = await pool.query(
      'SELECT id, first_name, middle_name, last_name, employee_id, email, position FROM users WHERE email = ?',
      [email.trim()]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'Email not found. Please check your email address and try again.' });
    }

    const user = users[0];

    res.json({
      success: true,
      user: {
        id: user.id,
        first_name: user.first_name,
        middle_name: user.middle_name,
        last_name: user.last_name,
        employee_id: user.employee_id,
        email: user.email
      }
    });
  } catch (err) {
    console.error('Error checking email:', err);
    res.status(500).json({ error: 'Failed to check email', details: err.message });
  }
});

router.post('/forgot-password', async (req, res) => {
  const { email, user_id } = req.body || {};
  
  if (!email || !email.trim()) {
    return res.status(400).json({ error: 'Email is required' });
  }

  if (!user_id) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const [users] = await pool.query(
      'SELECT id, first_name, middle_name, last_name, employee_id, email FROM users WHERE id = ? AND email = ?',
      [user_id, email.trim()]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found or email mismatch' });
    }

    const user = users[0];

    const message = `Password reset requested by ${user.first_name} ${user.middle_name || ''} ${user.last_name} (${user.employee_id}). Email: ${user.email}`;
    
    await createAdminNotification({
      user_id: user.id,
      trnngprog_id: null,
      trnngreg_id: null,
      applicant_id: null,
      eval_id: null,
      message: message
    });

    res.json({
      success: true,
      message: 'Password reset request submitted successfully'
    });
  } catch (err) {
    console.error('Error processing forgot password request:', err);
    res.status(500).json({ error: 'Failed to process password reset request', details: err.message });
  }
});

module.exports = router;

