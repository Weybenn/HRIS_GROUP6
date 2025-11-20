const express = require('express');
const { pool } = require('./db_config');

const getEmployeeProfile = async (employeeId) => {
  try {
    const connection = await pool.getConnection();

    const [rows] = await connection.execute(
      `SELECT
        u.employee_id,
        u.first_name,
        u.middle_name,
        u.last_name,
        u.email,
        u.profile_picture,
        cd.department,
        po.program
      FROM users u
      LEFT JOIN college_department cd ON u.department_id = cd.id
      LEFT JOIN program_offerings po ON u.program_id = po.id
      WHERE u.employee_id = ? AND u.status = 'active'`,
      [employeeId]
    );

    connection.release();

    if (rows.length === 0) {
      throw new Error('Employee not found');
    }

    return rows[0];
  } catch (error) {
    console.error('Error fetching employee profile:', error);
    throw error;
  }
};

const router = express.Router();

router.get('/employee-profile/:employeeId', async (req, res) => {
  const { employeeId } = req.params;
  if (!employeeId) {
    return res.status(400).json({ error: 'Employee ID is required' });
  }
  try {
    const profile = await getEmployeeProfile(employeeId);
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch employee profile' });
  }
});

module.exports = {
  getEmployeeProfile,
  router
};
