const express = require('express');
const { pool } = require('./db_config');

const router = express.Router();

const { getUpcomingEvents, getAllUpcomingEvents } = require('./training_program');

router.get('/home/training-programs', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        tp.*,
        u.first_name,
        u.last_name,
        u.employee_id AS creator_employee_id,
        u.profile_picture,
        COALESCE(cd.department, 'All Departments') AS department
      FROM training_program tp
      JOIN users u ON tp.employee_id = u.id
      LEFT JOIN college_department cd ON tp.department_id = cd.id
      WHERE (tp.date > CURDATE() OR (tp.date = CURDATE() AND tp.time >= CURTIME()))
        AND tp.register_link = '1'
      ORDER BY tp.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch home training programs' });
  }
});

router.get('/home/all-training-programs', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        tp.*,
        u.first_name,
        u.last_name,
        u.employee_id AS creator_employee_id,
        u.profile_picture,
        COALESCE(cd.department, 'All Departments') AS department
      FROM training_program tp
      JOIN users u ON tp.employee_id = u.id
      LEFT JOIN college_department cd ON tp.department_id = cd.id
      ORDER BY tp.created_at DESC
    `);
    res.json(rows);
  } catch (err) {
    console.error('Error fetching all training programs for home:', err);
    res.status(500).json({ error: 'Failed to fetch all training programs' });
  }
});

router.get('/home/summary', async (req, res) => {
  try {
    const [[programCounts]] = await pool.query(`
      SELECT COUNT(*) AS total_training_programs FROM training_program
    `);

    res.json({
      total_training_programs: Number(programCounts.total_training_programs || 0)
    });
  } catch (err) {
    console.error('Error fetching home summary:', err);
    res.status(500).json({ error: 'Failed to fetch home summary' });
  }
});

router.get('/home/training-programs/:id', async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'Training program ID is required' });
  try {
    const [rows] = await pool.query(`
      SELECT tp.*, u.first_name, u.last_name, u.employee_id AS creator_employee_id, u.profile_picture, COALESCE(cd.department, 'All Departments') AS department
      FROM training_program tp
      JOIN users u ON tp.employee_id = u.id
      LEFT JOIN college_department cd ON tp.department_id = cd.id
      WHERE tp.id = ?
      LIMIT 1
    `, [id]);
    if (!rows || rows.length === 0) return res.status(404).json({ error: 'Training program not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching training program details:', err);
    res.status(500).json({ error: 'Failed to fetch training program details' });
  }
});

router.get('/home/training-programs/:id/registrations-stats', async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'Training program ID is required' });
  try {
    const [counts] = await pool.query(`
      SELECT
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending,
        SUM(CASE WHEN status = 'Approved' THEN 1 ELSE 0 END) AS approved,
        SUM(CASE WHEN status = 'Rejected' THEN 1 ELSE 0 END) AS rejected,
        COUNT(*) AS total
      FROM training_registration
      WHERE training_id = ?
    `, [id]);
    const [[tp]] = await pool.query('SELECT department_id FROM training_program WHERE id = ? LIMIT 1', [id]);
    if (!tp) return res.status(404).json({ error: 'Training program not found' });

    let distribution = [];
    if (tp.department_id === null) {
      const [rows] = await pool.query(`
        SELECT cd.department, COUNT(tr.id) as count
        FROM training_registration tr
        JOIN users u ON tr.user_id = u.id
        LEFT JOIN college_department cd ON u.department_id = cd.id
        WHERE tr.training_id = ?
        GROUP BY cd.id, cd.department
        ORDER BY cd.department ASC
      `, [id]);
      distribution = rows.map(r => ({ label: r.department || 'Unassigned', count: Number(r.count || 0) }));
    } else {
      const [rows] = await pool.query(`
        SELECT po.program AS program, COUNT(tr.id) as count
        FROM training_registration tr
        JOIN users u ON tr.user_id = u.id
        LEFT JOIN program_offerings po ON u.program_id = po.id
        WHERE tr.training_id = ?
        GROUP BY po.id, po.program
        ORDER BY po.program ASC
      `, [id]);
      distribution = rows.map(r => ({ label: r.program || 'Unassigned Program', count: Number(r.count || 0) }));
    }

    res.json({ 
      pending: Number(counts[0].pending || 0), 
      approved: Number(counts[0].approved || 0), 
      rejected: Number(counts[0].rejected || 0), 
      total: Number(counts[0].total || 0),
      distribution
    });
  } catch (err) {
    console.error('Error fetching registration stats:', err);
    res.status(500).json({ error: 'Failed to fetch registration stats' });
  }
});

router.get('/home/upcoming-events', async (req, res) => {
  try {
    const events = await getUpcomingEvents();
    res.json(events);
  } catch (err) {
    console.error('Error in /api/home/upcoming-events:', err);
    res.status(500).json({ error: 'Failed to fetch upcoming events' });
  }
});

router.get('/home/all-upcoming-events', async (req, res) => {
  try {
    const events = await getAllUpcomingEvents();
    res.json(events);
  } catch (err) {
    console.error('Error in /api/home/all-upcoming-events:', err);
    res.status(500).json({ error: 'Failed to fetch all upcoming events' });
  }
});

router.get('/home/todays-reminders/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const [rows] = await pool.query(`
      SELECT 
        tp.id,
        tp.program_name,
        tp.time,
        tp.date
      FROM training_registration tr
      JOIN training_program tp ON tr.training_id = tp.id
      WHERE tr.user_id = ?
        AND tr.status = 'Approved'
        -- Show reminders immediately after registration (for all upcoming trainings)
        -- Exclude programs that already ended (time already passed)
        AND (tp.date > CURDATE() OR (tp.date = CURDATE() AND tp.time > CURTIME()))
      ORDER BY tp.date ASC, tp.time ASC
    `, [userId]);

    res.json(rows);
  } catch (err) {
    console.error('Error fetching reminders:', err);
    res.status(500).json({ error: 'Failed to fetch reminders' });
  }
});

module.exports = router;


