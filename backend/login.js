const bcrypt = require('bcryptjs');
const express = require('express');
const { pool } = require('./db_config');
const nodemailer = require('nodemailer');

const otpStorage = new Map();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
});

/**
 * Login user by employee_id and password
 * @param {string} employee_id
 * @param {string} password
 * @returns {Promise<object>} user info if valid, else throws error
 */
async function loginUser(employee_id, password) {
  const [rows] = await pool.query('SELECT * FROM users WHERE employee_id = ?', [employee_id]);
  if (rows.length === 0) {
    throw new Error('Invalid username or password');
  }
  const user = rows[0];
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw new Error('Invalid username or password');
  }
  const { password: _, ...userInfo } = user;
  return userInfo;
}

/**
 * Generate a 6-digit OTP
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Send OTP to user's email
 */
async function sendOTP(email, otp) {
  const mailOptions = {
    from: `"EARIST HRIS" <${process.env.SMTP_USER}>`,
    to: email,
    subject: 'Login Verification Code - EARIST HRIS',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #6D2323; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #6D2323; margin: 0;">EARIST HRIS</h1>
          <p style="color: #666; margin: 5px 0;">Human Resource Information System</p>
        </div>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0;">Login Verification Code</h2>
          <p style="color: #666; line-height: 1.6;">
            You are attempting to log in to your EARIST HRIS account. Please use the following verification code to complete your login:
          </p>
          
          <div style="background-color: #6D2323; color: white; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; font-family: 'Courier New', monospace;">
              ${otp}
            </div>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0;">
            <strong>Important:</strong> This code will expire in 5 minutes. Do not share this code with anyone.
          </p>
        </div>
        
        <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 20px;">
          <p style="color: #999; font-size: 12px; margin: 5px 0; line-height: 1.5;">
            If you did not attempt to log in, please contact your system administrator immediately.
          </p>
          <p style="color: #999; font-size: 12px; margin: 5px 0;">
            This is an automated message. Please do not reply to this email.
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending OTP email:', error);
    throw new Error('Failed to send OTP email');
  }
}

const router = express.Router();

router.post('/login', async (req, res) => {
  const { employee_id, password } = req.body || {};
  if (!employee_id || !password) {
    return res.status(400).json({ error: 'Missing username or password' });
  }
  try {
    const user = await loginUser(employee_id, password);
    res.json({ success: true, user });
  } catch (err) {
    res.status(401).json({ error: err.message });
  }
});

router.post('/login/send-otp', async (req, res) => {
  const { employee_id } = req.body || {};
  
  if (!employee_id) {
    return res.status(400).json({ success: false, error: 'Employee ID is required' });
  }

  try {
    const [rows] = await pool.query('SELECT email FROM users WHERE employee_id = ?', [employee_id]);
    
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const email = rows[0].email;
    
    const otp = generateOTP();
    const expiresAt = Date.now() + (5 * 60 * 1000); // 5 minutes
    
    otpStorage.set(employee_id, { otp, expiresAt });
    
    setTimeout(() => {
      otpStorage.delete(employee_id);
    }, 5 * 60 * 1000);
    
    console.log(`[OTP] Generated for ${employee_id} (${email}): ${otp}`);
    
    await sendOTP(email, otp);
    
    res.json({ 
      success: true, 
      message: 'OTP has been sent to your email address' 
    });
  } catch (err) {
    console.error('Error in send-otp:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message || 'Failed to send OTP' 
    });
  }
});

router.post('/login/verify-otp', async (req, res) => {
  const { employee_id, otp } = req.body || {};
  
  if (!employee_id || !otp) {
    return res.status(400).json({ 
      success: false, 
      error: 'Employee ID and OTP are required' 
    });
  }

  try {
    const storedData = otpStorage.get(employee_id);
    
    if (!storedData) {
      return res.status(400).json({ 
        success: false, 
        error: 'No active OTP found. Please request a new one.' 
      });
    }

    const { otp: storedOTP, expiresAt } = storedData;

    if (Date.now() > expiresAt) {
      otpStorage.delete(employee_id);
      return res.status(400).json({ 
        success: false, 
        error: 'OTP has expired. Please request a new one.' 
      });
    }

    if (otp !== storedOTP) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid OTP code' 
      });
    }

    otpStorage.delete(employee_id);
    
    res.json({ 
      success: true, 
      message: 'OTP verified successfully' 
    });
  } catch (err) {
    console.error('Error in verify-otp:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message || 'Failed to verify OTP' 
    });
  }
});

module.exports = { loginUser, router };
