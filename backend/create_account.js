const bcrypt = require('bcryptjs');
const express = require('express');
const { pool } = require('./db_config');
const { sendAccountCreationEmail } = require('./email_create_reset_account');

async function getDepartments() {
  const [rows] = await pool.query('SELECT id, department FROM college_department');
  return rows;
}

async function getPrograms(departmentId) {
  const [rows] = await pool.query('SELECT id, program FROM program_offerings WHERE college_department_id = ?', [departmentId]);
  return rows;
}

async function getNextEmployeeId() {
  const [rows] = await pool.query("SELECT employee_id FROM users WHERE employee_id LIKE '2025-%' ORDER BY employee_id DESC LIMIT 1");
  if (rows.length === 0) return '2025-00001';
  const lastId = rows[0].employee_id;
  const num = parseInt(lastId.split('-')[1], 10) + 1;
  return `2025-${num.toString().padStart(5, '0')}`;
}

async function createAccount({ first_name, middle_name, last_name, email, department_id, program_id, position }) {
  const employee_id = await getNextEmployeeId();
  const plainPassword = 'EARIST1945';
  const password = await bcrypt.hash(plainPassword, 10);
  const normalizedPosition = String(position || '').toLowerCase();
  const normalizedDepartmentId = (normalizedPosition === 'employee') ? department_id : null;
  const normalizedProgramId = (normalizedPosition === 'employee') ? program_id : null;
  await pool.query(
    `INSERT INTO users (first_name, middle_name, last_name, employee_id, email, password, position, department_id, program_id, status, profile_picture) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', NULL)`,
    [first_name, middle_name, last_name, employee_id, email, password, normalizedPosition, normalizedDepartmentId, normalizedProgramId]
  );
  return employee_id;
}

const router = express.Router();

router.get('/departments', async (_req, res) => {
  try {
    const departments = await getDepartments();
    res.json(departments);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

router.get('/programs', async (req, res) => {
  const { departmentId } = req.query;
  if (!departmentId) return res.status(400).json({ error: 'departmentId required' });
  try {
    const programs = await getPrograms(departmentId);
    res.json(programs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch programs' });
  }
});

router.get('/next-employee-id', async (_req, res) => {
  try {
    const nextId = await getNextEmployeeId();
    res.json({ employee_id: nextId });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch next employee ID' });
  }
});

router.post('/create-account', async (req, res) => {
  const { first_name, middle_name, last_name, email, department_id, program_id, position } = req.body || {};
  if (!first_name || !last_name || !email || !position) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  const normalizedPosition = String(position || '').toLowerCase();
  if (!['admin','employee'].includes(normalizedPosition)) {
    return res.status(400).json({ error: 'Invalid position' });
  }
  const requiresDeptProgram = normalizedPosition === 'employee';
  if (requiresDeptProgram && (!department_id || !program_id)) {
    return res.status(400).json({ error: 'Department and program are required for employees' });
  }
  try {
    const DEFAULT_PASSWORD = 'EARIST1945';
    const employee_id = await createAccount({ first_name, middle_name, last_name, email, department_id: requiresDeptProgram ? department_id : null, program_id: requiresDeptProgram ? program_id : null, position: normalizedPosition });
    
    const userName = `${first_name} ${middle_name || ''} ${last_name}`.trim();
    try {
      await sendAccountCreationEmail(email, userName, employee_id, DEFAULT_PASSWORD);
    } catch (emailError) {
      console.error('Failed to send account creation email:', emailError);
    }
    
    res.json({ success: true, employee_id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create account', details: err.message });
  }
});

module.exports = {
  getDepartments,
  getPrograms,
  getNextEmployeeId,
  createAccount,
  router
};
