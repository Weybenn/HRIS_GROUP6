const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createConnection } = require('./db_config');
const { createJobApplicationAdminNotification } = require('./notification');
const { sendStatusUpdateEmail } = require('./email_applicant_status');

const router = express.Router();
const https = require('https');

function resolveCategoryLabel(input) {
  if (!input) return input;
  const slug = String(input).toLowerCase();
  const slugToLabel = {
    'administrative-staff': 'Administrative Staff',
    'academic-faculty': 'Academic Faculty',
    'it-technical-support': 'IT & Technical Support',
    'facilities-maintenance': 'Facilities & Maintenance',
    'finance-accounting': 'Finance & Accounting',
    'student-support-services': 'Student Support Services'
  };
  return slugToLabel[slug] || input;
}

function toCategorySlug(category) {
  if (!category) return '';
  const label = String(category).trim();
  const labelToSlug = {
    'Administrative Staff': 'administrative-staff',
    'Academic Faculty': 'academic-faculty',
    'IT & Technical Support': 'it-technical-support',
    'Facilities & Maintenance': 'facilities-maintenance',
    'Finance & Accounting': 'finance-accounting',
    'Student Support Services': 'student-support-services'
  };
  if (labelToSlug[label]) return labelToSlug[label];
  return label
    .toLowerCase()
    .replace(/&/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads', 'resume');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'resume_' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'));
    }
  }
});

router.get('/', async (req, res) => {
  try {
    const connection = await createConnection();
    
    const [rows] = await connection.execute(`
      SELECT af.*, jo.job_title, jd.category
      FROM applicant_form af
      JOIN job_offerings jo ON af.joboffer_id = jo.id
      JOIN job_department jd ON jo.jbdprtmnt_id = jd.id
      ORDER BY af.created_at DESC
    `);
    
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error('Error fetching applicants:', error);
    res.status(500).json({ error: 'Failed to fetch applicants' });
  }
});

router.get('/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const label = resolveCategoryLabel(category);
    const connection = await createConnection();
    
    const [rows] = await connection.execute(`
      SELECT af.*, jo.job_title, jd.category
      FROM applicant_form af
      JOIN job_offerings jo ON af.joboffer_id = jo.id
      JOIN job_department jd ON jo.jbdprtmnt_id = jd.id
      WHERE jd.category = ?
      ORDER BY af.created_at DESC
    `, [label]);
    
    await connection.end();
    res.json(rows);
  } catch (error) {
    console.error('Error fetching applicants by category:', error);
    res.status(500).json({ error: 'Failed to fetch applicants' });
  }
});

router.get('/counts-by-category', async (req, res) => {
  try {
    const connection = await createConnection();
    
    const [rows] = await connection.execute(`
      SELECT jd.category, COUNT(af.id) as count
      FROM job_department jd
      LEFT JOIN job_offerings jo ON jd.id = jo.jbdprtmnt_id
      LEFT JOIN applicant_form af ON jo.id = af.joboffer_id
      GROUP BY jd.id, jd.category
    `);
    
    const counts = {};
    rows.forEach(row => {
      const categorySlug = toCategorySlug(row.category);
      counts[categorySlug] = row.count;
    });
    
    await connection.end();
    res.json(counts);
  } catch (error) {
    console.error('Error fetching applicant counts:', error);
    res.status(500).json({ error: 'Failed to fetch applicant counts' });
  }
});

router.post('/', upload.single('resume'), async (req, res) => {
  try {
    const { job_id, first_name, last_name, email, phone_number, address } = req.body;
    const captcha_token = req.body.captcha_token || req.body['g-recaptcha-response'];
    if (!captcha_token) {
      return res.status(400).json({ error: 'Captcha token is required' });
    }
    try {
      const secret = process.env.RECAPTCHA_SECRET_KEY;
      if (!secret) {
        return res.status(500).json({ error: 'Captcha misconfigured: missing RECAPTCHA_SECRET_KEY in backend/.env' });
      }
      const postData = new URLSearchParams({ secret, response: captcha_token, remoteip: req.ip }).toString();
      const verifyResult = await new Promise((resolve, reject) => {
        const reqVerify = https.request({
          hostname: 'www.google.com',
          path: '/recaptcha/api/siteverify',
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(postData)
          }
        }, (resp) => {
          let data = '';
          resp.on('data', chunk => data += chunk);
          resp.on('end', () => {
            try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
          });
        });
        reqVerify.on('error', reject);
        reqVerify.write(postData);
        reqVerify.end();
      });
      if (!verifyResult.success) {
        console.error('Captcha verify failed:', verifyResult);
        return res.status(400).json({ error: 'Captcha verification failed', details: verifyResult['error-codes'] || null });
      }
    } catch (err) {
      console.error('Captcha verification error:', err);
      return res.status(500).json({ error: 'Captcha verification error' });
    }
    const resumePath = req.file ? req.file.filename : null;
    
    const connection = await createConnection();
    
    const [jobData] = await connection.execute(
      'SELECT job_title FROM job_offerings WHERE id = ?',
      [job_id]
    );
    
    const [result] = await connection.execute(`
      INSERT INTO applicant_form (joboffer_id, first_name, last_name, email, phone_number, address, resume, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())
    `, [job_id, first_name, last_name, email, phone_number, address, resumePath]);
    
    await connection.end();
    
    try {
      if (jobData.length > 0) {
        const jobTitle = jobData[0].job_title;
        await createJobApplicationAdminNotification(null, jobTitle, result.insertId);
      }
    } catch (notificationError) {
      console.error('Error creating job application notification:', notificationError);
    }
    
    res.json({ 
      success: true, 
      message: 'Application submitted successfully',
      applicant_id: result.insertId 
    });
  } catch (error) {
    console.error('Error submitting application:', error);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

router.post('/walkin', async (req, res) => {
  try {
    const {
      job_id: jobIdRaw,
      joboffer_id: jobOfferIdRaw,
      first_name,
      last_name,
      email,
      phone_number,
      address
    } = req.body || {};

    const job_id = jobOfferIdRaw || jobIdRaw;
    if (!job_id || !first_name || !last_name || !email) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const connection = await createConnection();

    const [jobData] = await connection.execute(
      'SELECT job_title FROM job_offerings WHERE id = ? AND status = "Active"',
      [job_id]
    );

    if (!jobData || jobData.length === 0) {
      await connection.end();
      return res.status(400).json({ error: 'Invalid or inactive job offering' });
    }

    const [result] = await connection.execute(`
      INSERT INTO applicant_form (joboffer_id, first_name, last_name, email, phone_number, address, resume, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, NULL, 'pending', NOW(), NOW())
    `, [job_id, first_name, last_name, email, phone_number || null, address || null]);

    await connection.end();

    try {
      const jobTitle = jobData[0].job_title;
      await createJobApplicationAdminNotification(null, jobTitle, result.insertId);
    } catch (notificationError) {
      console.error('Error creating job application notification (walk-in):', notificationError);
    }

    res.json({
      success: true,
      message: 'Walk-in application submitted successfully',
      applicant_id: result.insertId
    });
  } catch (error) {
    console.error('Error submitting walk-in application:', error);
    res.status(500).json({ error: 'Failed to submit walk-in application' });
  }
});

router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const connection = await createConnection();
    
    const [applicantData] = await connection.execute(`
      SELECT af.first_name, af.last_name, af.email, jo.job_title
      FROM applicant_form af
      JOIN job_offerings jo ON af.joboffer_id = jo.id
      WHERE af.id = ?
    `, [id]);
    
    if (applicantData.length === 0) {
      await connection.end();
      return res.status(404).json({ error: 'Applicant not found' });
    }
    
    const applicant = applicantData[0];
    
    await connection.execute(`
      UPDATE applicant_form 
      SET status = ?, updated_at = NOW()
      WHERE id = ?
    `, [status, id]);
    
    await connection.end();
    
    try {
      const emailResult = await sendStatusUpdateEmail(
        applicant.email,
        `${applicant.first_name} ${applicant.last_name}`,
        applicant.job_title,
        status
      );
      
      if (emailResult.success) {
        console.log(`Email notification sent successfully to ${applicant.email} for status: ${status}`);
      } else {
        console.error(`Failed to send email notification to ${applicant.email}:`, emailResult.error);
      }
    } catch (emailError) {
      console.error('Error sending email notification:', emailError);
    }
    
    res.json({ success: true, message: 'Status updated successfully' });
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await createConnection();
    
    const [rows] = await connection.execute(`
      SELECT af.*, jo.job_title, jd.category
      FROM applicant_form af
      JOIN job_offerings jo ON af.joboffer_id = jo.id
      JOIN job_department jd ON jo.jbdprtmnt_id = jd.id
      WHERE af.id = ?
    `, [id]);
    
    await connection.end();
    
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Applicant not found' });
    }
    
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching applicant:', error);
    res.status(500).json({ error: 'Failed to fetch applicant' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await createConnection();
    
    const [applicant] = await connection.execute(`
      SELECT resume FROM applicant_form WHERE id = ?
    `, [id]);
    
    if (applicant.length > 0 && applicant[0].resume) {
      const resumePath = path.join(__dirname, 'uploads', 'resume', applicant[0].resume);
      if (fs.existsSync(resumePath)) {
        fs.unlinkSync(resumePath);
      }
    }
    
    await connection.execute(`
      DELETE FROM applicant_form WHERE id = ?
    `, [id]);
    
    await connection.end();
    
    res.json({ success: true, message: 'Applicant deleted successfully' });
  } catch (error) {
    console.error('Error deleting applicant:', error);
    res.status(500).json({ error: 'Failed to delete applicant' });
  }
});

module.exports = router;
