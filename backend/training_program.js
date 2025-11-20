const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const { addTrainingProgram, getTrainingPrograms, deleteTrainingProgram, updateTrainingProgram } = require('./add_training_program');
const { pool } = require('./db_config');

const getUpcomingEvents = async () => {
  try {
    const connection = await pool.getConnection();

    const [rows] = await connection.execute(
      `SELECT
        tp.id,
        tp.program_name,
        tp.date,
        tp.time,
        tp.venue,
        tp.mode,
        tp.instructor,
        tp.description,
        tp.upload_photo,
        tp.max_participants,
        tp.register_link,
        tp.created_at,
        u.first_name,
        u.last_name,
        u.profile_picture,
        COALESCE(cd.department, 'All Departments') AS department
      FROM training_program tp
      LEFT JOIN users u ON tp.employee_id = u.id
      LEFT JOIN college_department cd ON tp.department_id = cd.id
      WHERE TIMESTAMP(tp.date, tp.time) > NOW() AND tp.register_link = '1'
      ORDER BY tp.date ASC, tp.time ASC
      LIMIT 3`
    );

    connection.release();
    return rows;
  } catch (error) {
    console.error('Error fetching upcoming events:', error);
    throw error;
  }
};

const getAllUpcomingEvents = async () => {
  try {
    const connection = await pool.getConnection();

    const [rows] = await connection.execute(
      `SELECT
        tp.id,
        tp.program_name,
        tp.date,
        tp.time,
        tp.venue,
        tp.mode,
        tp.instructor,
        tp.description,
        tp.upload_photo,
        tp.max_participants,
        tp.register_link,
        tp.created_at,
        u.first_name,
        u.last_name,
        u.profile_picture,
        COALESCE(cd.department, 'All Departments') AS department
      FROM training_program tp
      LEFT JOIN users u ON tp.employee_id = u.id
      LEFT JOIN college_department cd ON tp.department_id = cd.id
      WHERE TIMESTAMP(tp.date, tp.time) > NOW() AND tp.register_link = '1'
      ORDER BY tp.date ASC, tp.time ASC`
    );

    connection.release();
    return rows;
  } catch (error) {
    console.error('Error fetching all upcoming events:', error);
    throw error;
  }
};

const router = express.Router();

const trainingConnections = new Set();

const programUploadsDir = path.join(__dirname, 'uploads', 'program');
if (!fs.existsSync(programUploadsDir)) {
  fs.mkdirSync(programUploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, programUploadsDir);
  },
  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const sanitizedOriginal = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `program_${timestamp}_${sanitizedOriginal}`);
  }
});
const upload = multer({ storage });

router.get('/upcoming-events', async (_req, res) => {
  try {
    const events = await getUpcomingEvents();
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch upcoming events' });
  }
});

router.get('/all-upcoming-events', async (_req, res) => {
  try {
    const events = await getAllUpcomingEvents();
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch all upcoming events' });
  }
});

router.get('/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  trainingConnections.add(res);

  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

  const heartbeat = setInterval(() => {
    try {
      res.write(': keep-alive\n\n');
    } catch (_) {
    }
  }, 25000);

  req.on('close', () => {
    trainingConnections.delete(res);
    clearInterval(heartbeat);
  });
});

router.post('/add-training-program', upload.single('photo'), async (req, res) => {
  const {
    employee_id,
    program_name,
    date,
    time,
    venue,
    mode,
    instructor,
    description,
    max_participants,
    department_id
  } = req.body || {};

  const register_link = req.body && (req.body.register_link === '1' || req.body.register_link === 1 || req.body.register_link === true || req.body.register_link === 'true') ? 1 : 0;
  const upload_photo = req.file ? `program/${req.file.filename}` : null;

  if (!employee_id || !program_name || !date || !time || !mode) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const normalizedDepartmentId = (department_id === undefined || department_id === null || department_id === '' || department_id === 'ALL') ? null : Number(department_id);
      const result = await addTrainingProgram({
      employee_id,
      program_name,
      date,
      time,
      venue,
      mode,
      instructor,
      description,
      upload_photo,
      max_participants,
      register_link,
      department_id: normalizedDepartmentId
    });
    
    if (register_link === 1) {
      trainingConnections.forEach(connection => {
        try {
          connection.write(`data: ${JSON.stringify({ 
            type: 'new_training', 
            register_link: 1,
            training_id: result.training_id 
          })}\n\n`);
        } catch (err) {
          console.error('Error sending training update via SSE:', err);
          trainingConnections.delete(connection);
        }
      });
    }
    
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add training program', details: err.message });
  }
});

router.get('/training-programs', async (_req, res) => {
  try {
    const trainingPrograms = await getTrainingPrograms();
    res.json(trainingPrograms);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch training programs' });
  }
});

router.delete('/training-programs/:id', async (req, res) => {
  const { id } = req.params;
  const { employee_id } = req.body || {};
  if (!employee_id) {
    return res.status(400).json({ error: 'Employee ID is required' });
  }
  try {
    const result = await deleteTrainingProgram(id, employee_id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to delete training program' });
  }
});

router.put('/training-programs/:id', upload.single('photo'), async (req, res) => {
  const { id } = req.params;
  const {
    employee_id,
    program_name,
    date,
    time,
    venue,
    mode,
    instructor,
    description,
    max_participants,
    register_link,
    department_id
  } = req.body || {};

  const remove_photo = req.body && (req.body.remove_photo === '1' || req.body.remove_photo === 1 || req.body.remove_photo === true || req.body.remove_photo === 'true');

  if (!id) return res.status(400).json({ error: 'Training program ID is required' });

  try {
    const upload_photo = req.file ? `program/${req.file.filename}` : undefined;
    const result = await updateTrainingProgram(id, {
      employee_id,
      program_name,
      date,
      time,
      venue,
      mode,
      instructor,
      description,
      upload_photo,
      max_participants: max_participants ? Number(max_participants) : undefined,
      register_link: register_link !== undefined ? (register_link === '1' || register_link === 1 || register_link === 'true') : undefined,
      remove_photo,
      department_id: (department_id === undefined || department_id === null || department_id === '' || department_id === 'ALL') ? null : Number(department_id)
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to update training program' });
  }
});

module.exports = {
  getUpcomingEvents,
  getAllUpcomingEvents,
  router
};
