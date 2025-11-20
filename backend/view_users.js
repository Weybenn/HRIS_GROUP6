const express = require('express');
const { createConnection } = require('./db_config');
const router = express.Router();

router.get('/users', async (req, res) => {
  const { search } = req.query;
  let conn;
  try {
    conn = await createConnection();
    let query = `SELECT id, first_name, middle_name, last_name, position, status FROM users`;
    let params = [];
    if (search) {
      query += ` WHERE CONCAT_WS(' ', first_name, middle_name, last_name) LIKE ?`;
      params.push(`%${search}%`);
    }
    query += ' ORDER BY id ASC';
    const [rows] = await conn.execute(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users', details: err.message });
  } finally {
    if (conn) await conn.end();
  }
});

router.get('/users/:id', async (req, res) => {
  const { id } = req.params;
  let conn;
  try {
    conn = await createConnection();
    const query = `
      SELECT 
        u.id,
        u.first_name,
        u.middle_name,
        u.last_name,
        u.employee_id,
        u.email,
        u.position,
        u.status,
        u.profile_picture,
        u.department_id,
        u.program_id,
        cd.department AS department,
        po.program AS program
      FROM users u
      LEFT JOIN college_department cd ON u.department_id = cd.id
      LEFT JOIN program_offerings po ON u.program_id = po.id
      WHERE u.id = ?
      LIMIT 1
    `;
    const [rows] = await conn.execute(query, [id]);
    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch user details', details: err.message });
  } finally {
    if (conn) await conn.end();
  }
});

module.exports = router;
