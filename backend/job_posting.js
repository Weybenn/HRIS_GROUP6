const express = require('express');
const { pool } = require('./db_config');

const router = express.Router();

function sanitizeRichHtml(html) {
  if (html == null) return null;
  let safe = String(html);
  safe = safe.replace(/<!--[\s\S]*?-->/g, '');
  safe = safe.replace(/<\s*(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '');
  safe = safe.replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');
  safe = safe.replace(/\sstyle\s*=\s*("[^"]*"|'[^']*')/gi, '');
  safe = safe.replace(/<a\b([^>]*)>/gi, (m, attrs) => {
    const hrefMatch = attrs.match(/href\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/i);
    let href = hrefMatch ? hrefMatch[1] : '';
    if (href.startsWith('"') || href.startsWith("'")) href = href.slice(1, -1);
    if (!/^https?:\/\//i.test(href)) {
      href = '';
    }
    const hrefAttr = href ? ` href="${href}"` : '';
    return `<a${hrefAttr} target="_blank" rel="noopener noreferrer">`;
  });
  safe = safe.replace(/<\/?(?!b|strong|i|em|u|p|br|ul|ol|li|a|div|span\b)[a-z0-9-]+[^>]*>/gi, '');
  return safe;
}

async function resolveDepartmentId(input) {
  if (!input) return null;
  const slug = String(input).toLowerCase();
  const slugToLabel = {
    'administrative-staff': 'Administrative Staff',
    'academic-faculty': 'Academic Faculty',
    'it-technical-support': 'IT & Technical Support',
    'facilities-maintenance': 'Facilities & Maintenance',
    'finance-accounting': 'Finance & Accounting',
    'student-support-services': 'Student Support Services'
  };
  const label = slugToLabel[slug] || input;
  const [rows] = await pool.query('SELECT id FROM job_department WHERE category = ?', [label]);
  if (rows && rows.length) return rows[0].id;
  return null;
}

router.get('/job-postings', async (req, res) => {
  try {
    const { category } = req.query;
    let rows;
    if (category) {
      const depId = await resolveDepartmentId(category);
      if (!depId) return res.json([]);
      [rows] = await pool.query(
        `SELECT * FROM job_offerings WHERE jbdprtmnt_id = ? ORDER BY created_at DESC`,
        [depId]
      );
    } else {
      [rows] = await pool.query(`SELECT * FROM job_offerings ORDER BY created_at DESC`);
    }
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch job postings' });
  }
});

router.post('/job-postings', async (req, res) => {
  const {
    category, 
    job_title,
    location,
    employment_type,
    salary,
    description,
    status
  } = req.body || {};

  try {
    const depId = await resolveDepartmentId(category);
    if (!depId) return res.status(400).json({ error: 'Invalid category' });

    const emps = ['Part-Time','Full-Time','Contractual','Temporary','Probationary','Internship'];
    if (!employment_type || !emps.includes(employment_type)) {
      return res.status(400).json({ error: 'Invalid employment_type' });
    }

    if (!job_title || !location) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const safeStatus = status === 'Inactive' ? 'Inactive' : 'Active';
    const safeSalary = (salary === undefined || salary === null || salary === '') ? 0 : Number(salary);

    const [result] = await pool.query(
      `INSERT INTO job_offerings (jbdprtmnt_id, job_title, location, employment_type, salary, description, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [depId, job_title, location, employment_type, safeSalary, sanitizeRichHtml(description) || null, safeStatus]
    );

    res.json({ success: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create job posting' });
  }
});

router.put('/job-postings/:id', async (req, res) => {
  const { id } = req.params;
  const {
    category,
    job_title,
    location,
    employment_type,
    salary,
    description,
    status
  } = req.body || {};

  if (!id) return res.status(400).json({ error: 'Job ID required' });

  try {
    const fields = [];
    const values = [];

    if (category !== undefined) {
      const depId = await resolveDepartmentId(category);
      if (!depId) return res.status(400).json({ error: 'Invalid category' });
      fields.push('jbdprtmnt_id = ?');
      values.push(depId);
    }
    if (job_title !== undefined) { fields.push('job_title = ?'); values.push(job_title); }
    if (location !== undefined) { fields.push('location = ?'); values.push(location); }
    if (employment_type !== undefined) {
      const emps = ['Part-Time','Full-Time','Contractual','Temporary','Probationary','Internship'];
      if (!emps.includes(employment_type)) return res.status(400).json({ error: 'Invalid employment_type' });
      fields.push('employment_type = ?'); values.push(employment_type);
    }
    if (salary !== undefined) { fields.push('salary = ?'); values.push(Number(salary) || 0); }
    if (description !== undefined) { fields.push('description = ?'); values.push(sanitizeRichHtml(description)); }
    if (status !== undefined) { fields.push('status = ?'); values.push(status === 'Inactive' ? 'Inactive' : 'Active'); }

    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

    values.push(id);
    await pool.query(`UPDATE job_offerings SET ${fields.join(', ')} WHERE id = ?`, values);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update job posting' });
  }
});

router.delete('/job-postings/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'Job ID required' });
  try {
    await pool.query('DELETE FROM job_offerings WHERE id = ?', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete job posting' });
  }
});

module.exports = router;


