const express = require('express');
const { createConnection } = require('./db_config');
const { 
  createTrainingCompletionNotification, 
  createEvaluationReminderNotification,
  createTrainingCompletionAdminNotification 
} = require('./notification');

const getTrainingPrograms = async () => {
  let connection;
  try {
    connection = await createConnection();
    const query = `
      SELECT
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
        tp.created_at
      FROM training_program tp
      ORDER BY tp.date ASC, tp.time ASC
    `;
    const [rows] = await connection.execute(query);
    return rows;
  } catch (error) {
    console.error('Error fetching training programs:', error);
    throw error;
  } finally {
    if (connection) await connection.end();
  }
};

const getTrainingProgramsWithApprovedRegistrants = async () => {
  let connection;
  try {
    connection = await createConnection();
    const query = `
      SELECT DISTINCT
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
        tp.created_at
      FROM training_program tp
      JOIN training_registration tr ON tr.training_id = tp.id
      WHERE tr.status = 'Approved'
      ORDER BY tp.date ASC, tp.time ASC
    `;
    const [rows] = await connection.execute(query);
    return rows;
  } catch (error) {
    console.error('Error fetching training programs with approved registrants:', error);
    throw error;
  } finally {
    if (connection) await connection.end();
  }
};

const getApprovedParticipants = async (trainingId) => {
  let connection;
  try {
    connection = await createConnection();
    const query = `
      SELECT
        tr.id,
        tr.user_id,
        tr.training_id,
        tr.progress_status,
        tr.submitted_at,
        tr.updated_at,
        CASE 
          WHEN tr.progress_status = 'Completed' THEN tr.updated_at
          ELSE NULL
        END as completed_at,
        u.first_name,
        u.last_name,
        u.email,
        u.employee_id,
        cd.department,
        po.program
      FROM training_registration tr
      JOIN users u ON tr.user_id = u.id
      LEFT JOIN college_department cd ON u.department_id = cd.id
      LEFT JOIN program_offerings po ON u.program_id = po.id
      WHERE tr.training_id = ?
        AND tr.status = 'Approved'
      ORDER BY tr.submitted_at DESC
    `;
    const [rows] = await connection.execute(query, [trainingId]);
    return rows;
  } catch (error) {
    console.error('Error fetching approved participants:', error);
    throw error;
  } finally {
    if (connection) await connection.end();
  }
};

const startTrainingProgram = async (trainingId) => {
  let connection;
  try {
    connection = await createConnection();
    const query = `
      UPDATE training_registration
      SET progress_status = 'In Progress', updated_at = CURRENT_TIMESTAMP
      WHERE training_id = ?
        AND status = 'Approved'
        AND (progress_status = 'Not Started' OR progress_status IS NULL)
    `;
    const [result] = await connection.execute(query, [trainingId]);
    console.log(`startTrainingProgram: set In Progress for trainingId=${trainingId}, affectedRows=${result.affectedRows}`);
    return { success: true, affectedRows: result.affectedRows };
  } catch (error) {
    console.error('Error starting training program:', error);
    throw error;
  } finally {
    if (connection) await connection.end();
  }
};

const autoStartProgramsForToday = async () => {
  let connection;
  try {
    connection = await createConnection();
    const query = `
      UPDATE training_registration tr
      JOIN training_program tp ON tr.training_id = tp.id
      SET tr.progress_status = 'In Progress', tr.updated_at = CURRENT_TIMESTAMP
      WHERE DATE(tp.date) = CURDATE()
        AND tr.status = 'Approved'
        AND (tr.progress_status = 'Not Started' OR tr.progress_status IS NULL)
    `;
    const [result] = await connection.execute(query);
    console.log(`autoStartProgramsForToday: set In Progress for todays programs, affectedRows=${result.affectedRows}`);
    return { success: true, affectedRows: result.affectedRows };
  } catch (error) {
    console.error('Error auto-starting programs for today:', error);
    throw error;
  } finally {
    if (connection) await connection.end();
  }
};

function startAutoStartJob() {
  (async () => {
    try {
      console.log('Auto-start job triggered on startup: checking for trainings scheduled today...');
      await autoStartProgramsForToday();
      console.log('Auto-start job completed on startup.');
      setInterval(() => {
        autoStartProgramsForToday().catch(err => console.error('Auto-start interval error:', err));
      }, 15 * 60 * 1000);
    } catch (err) {
      console.error('Error running autoStartProgramsForToday on startup:', err);
    }
  })();
}

const router = express.Router();

router.get('/training-management/training-programs', async (_req, res) => {
  try {
    const programs = await getTrainingProgramsWithApprovedRegistrants();
    res.json(programs);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch training programs' });
  }
});

router.get('/training-management/training-programs/:id/participants', async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'Training program ID is required' });
  try {
    const participants = await getApprovedParticipants(id);
    res.json(participants);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch participants' });
  }
});

router.post('/training-management/training-programs/:id/start', async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: 'Training program ID is required' });
  try {
    const result = await startTrainingProgram(id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to start training program' });
  }
});

router.post('/training/complete', async (req, res) => {
  try {
    const { user_id, training_program_id, registration_id } = req.body;
    
    if (!user_id || !training_program_id) {
      return res.status(400).json({ error: 'user_id and training_program_id are required' });
    }

    let connection;
    try {
      connection = await createConnection();
      
      const updateQuery = `
        UPDATE training_registration 
        SET progress_status = 'Completed', updated_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND training_id = ? AND status = 'Approved'
      `;
      
      const [updateResult] = await connection.execute(updateQuery, [user_id, training_program_id]);
      
      if (updateResult.affectedRows === 0) {
        return res.status(404).json({ error: 'Training registration not found or already completed' });
      }
      
      const [rows] = await connection.execute(
        'SELECT program_name FROM training_program WHERE id = ?',
        [training_program_id]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Training program not found' });
      }
      
      const trainingProgramName = rows[0].program_name;
      
      // Get registration_id if provided, otherwise find it
      let final_registration_id = registration_id || null;
      if (!final_registration_id) {
        const [regRows] = await connection.execute(
          'SELECT id FROM training_registration WHERE user_id = ? AND training_id = ? AND status = ? LIMIT 1',
          [user_id, training_program_id, 'Approved']
        );
        if (regRows.length > 0) {
          final_registration_id = regRows[0].id;
        }
      }
      
      console.log(`\n🚀 ===== STARTING COMPLETION NOTIFICATIONS =====`);
      console.log(`   User ID: ${user_id}`);
      console.log(`   Training ID: ${training_program_id}`);
      console.log(`   Registration ID: ${final_registration_id}`);
      console.log(`   Program Name: ${trainingProgramName}`);
      
      // Create employee notification
      try {
        console.log(`\n📝 Creating EMPLOYEE completion notification...`);
        await createTrainingCompletionNotification(user_id, trainingProgramName);
        console.log(`✅ Employee completion notification created successfully`);
      } catch (empErr) {
        console.error(`❌ Failed to create employee completion notification:`, empErr.message);
      }
      
      // Create admin notification
      try {
        console.log(`\n📝 Creating ADMIN completion notification...`);
        await createTrainingCompletionAdminNotification(user_id, trainingProgramName, training_program_id, final_registration_id);
        console.log(`✅ Admin completion notification created successfully`);
      } catch (adminErr) {
        console.error(`❌ Failed to create admin completion notification:`, adminErr.message);
      }
      
      // Create evaluation reminder notification (delayed)
      setTimeout(async () => {
        try {
          console.log(`\n📝 Creating evaluation reminder notification...`);
          await createEvaluationReminderNotification(user_id, trainingProgramName);
          console.log(`✅ Evaluation reminder notification created successfully`);
        } catch (err) {
          console.error('❌ Error creating evaluation reminder notification:', err);
        }
      }, 2000);
      
      console.log(`🚀 ===== COMPLETION NOTIFICATIONS COMPLETE =====\n`); 
      
      res.json({ 
        success: true, 
        message: `Training program "${trainingProgramName}" marked as completed for user ${user_id}`,
        affectedRows: updateResult.affectedRows
      });
      
    } finally {
      if (connection) await connection.end();
    }
    
  } catch (error) {
    console.error('Error completing training program:', error);
    res.status(500).json({ error: 'Failed to complete training program' });
  }
});

router.post('/training/evaluation-reminder', async (req, res) => {
  try {
    const { user_id, training_program_id } = req.body;
    
    if (!user_id || !training_program_id) {
      return res.status(400).json({ error: 'user_id and training_program_id are required' });
    }

    let connection;
    try {
      connection = await createConnection();
      const [rows] = await connection.execute(
        'SELECT program_name FROM training_program WHERE id = ?',
        [training_program_id]
      );
      
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Training program not found' });
      }
      
      const trainingProgramName = rows[0].program_name;
      
      await createEvaluationReminderNotification(user_id, trainingProgramName);
      
      res.json({ 
        success: true, 
        message: `Evaluation reminder sent for training program "${trainingProgramName}" to user ${user_id}` 
      });
      
    } finally {
      if (connection) await connection.end();
    }
    
  } catch (error) {
    console.error('Error sending evaluation reminder:', error);
    res.status(500).json({ error: 'Failed to send evaluation reminder' });
  }
});

router.post('/training/test-completion', async (req, res) => {
  try {
    const { user_id, training_program_name } = req.body;
    
    if (!user_id || !training_program_name) {
      return res.status(400).json({ error: 'user_id and training_program_name are required' });
    }

    await createTrainingCompletionNotification(user_id, training_program_name);
    
    setTimeout(async () => {
      try {
        await createEvaluationReminderNotification(user_id, training_program_name);
      } catch (err) {
        console.error('Error creating evaluation reminder notification:', err);
      }
    }, 2000);
    
    res.json({ 
      success: true, 
      message: `Test notifications sent for training program "${training_program_name}" to user ${user_id}` 
    });
    
  } catch (error) {
    console.error('Error sending test notifications:', error);
    res.status(500).json({ error: 'Failed to send test notifications' });
  }
});

module.exports = {
  getTrainingPrograms,
  getTrainingProgramsWithApprovedRegistrants,
  getApprovedParticipants,
  startTrainingProgram,
  autoStartProgramsForToday,
  startAutoStartJob,
  router
};