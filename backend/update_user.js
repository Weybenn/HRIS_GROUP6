const express = require('express');
const { createConnection } = require('./db_config');

const router = express.Router();

router.put('/update-user', async (req, res) => {
  const {
    id,
    first_name,
    middle_name,
    last_name,
    email,
    position,
    department_id,
    program_id,
    status
  } = req.body || {};

  if (!id || !first_name || !last_name || !email || !position) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const normalizedPosition = String(position || '').toLowerCase();
  if (!['admin', 'employee'].includes(normalizedPosition)) {
    return res.status(400).json({ error: 'Invalid position' });
  }

  const normalizedStatus = status ? String(status).toLowerCase() : 'active';
  if (!['active', 'inactive'].includes(normalizedStatus)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const requiresDeptProgram = normalizedPosition === 'employee';
  const normalizedDepartmentId = requiresDeptProgram ? department_id : null;
  const normalizedProgramId = requiresDeptProgram ? program_id : null;

  let conn;
  try {
    conn = await createConnection();
    const [result] = await conn.execute(
      `UPDATE users 
       SET first_name = ?, middle_name = ?, last_name = ?, email = ?, position = ?, department_id = ?, program_id = ?, status = ?
       WHERE id = ?`,
      [
        first_name,
        middle_name || 'NA',
        last_name,
        email,
        normalizedPosition,
        normalizedDepartmentId,
        normalizedProgramId,
        normalizedStatus,
        id
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user', details: err.message });
  } finally {
    if (conn) await conn.end();
  }
});

module.exports = router;