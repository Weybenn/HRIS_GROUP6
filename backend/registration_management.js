const express = require('express');
const { createConnection } = require('./db_config');
const { 
  createTrainingCompletionNotification, 
  createEvaluationReminderNotification,
  createTrainingCompletionAdminNotification 
} = require('./notification');

const getTrainingProgramsWithRegistration = async () => {
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
        tp.created_at,
        u.first_name,
        u.last_name,
        cd.department AS department
      FROM training_program tp
      JOIN users u ON tp.employee_id = u.id
      LEFT JOIN college_department cd ON tp.department_id = cd.id
      WHERE tp.register_link = 1
      ORDER BY tp.created_at DESC
    `;

    const [rows] = await connection.execute(query);
    return rows;
  } catch (error) {
    console.error('Error fetching training programs with registration:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

const getTrainingRegistrations = async (trainingId) => {
  let connection;
  try {
    connection = await createConnection();

    const query = `
      SELECT
        tr.id,
        tr.user_id,
        tr.training_id,
        tr.status,
        tr.progress_status,
        tr.submitted_at,
        tr.updated_at,
        tr.completed_at,
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
      ORDER BY tr.submitted_at DESC
    `;

    const [rows] = await connection.execute(query, [trainingId]);
    return rows;
  } catch (error) {
    console.error('Error fetching training registrations:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};


const updateProgressStatus = async (registrationId, progressStatus, adminId) => {
  let connection;
  try {
    connection = await createConnection();

    const [registrationRows] = await connection.execute(
      `SELECT tr.id as registration_id, tr.user_id, tr.training_id, tp.program_name 
       FROM training_registration tr 
       JOIN training_program tp ON tr.training_id = tp.id 
       WHERE tr.id = ?`,
      [registrationId]
    );

    if (registrationRows.length === 0) {
      throw new Error('Registration not found');
    }

    const registration = registrationRows[0];

    const completedAtValue = progressStatus === 'Completed' ? new Date() : null;

    const query = `
      UPDATE training_registration
      SET progress_status = ?,
          completed_at = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    const [result] = await connection.execute(query, [progressStatus, completedAtValue, registrationId]);

    if (result.affectedRows === 0) {
      throw new Error('Registration not found');
    }

    if (progressStatus === 'Completed') {
      console.log(`\n🚀 ===== STARTING COMPLETION NOTIFICATIONS =====`);
      console.log(`   Registration ID: ${registrationId}`);
      console.log(`   User ID: ${registration.user_id}`);
      console.log(`   Training ID: ${registration.training_id}`);
      console.log(`   Program Name: ${registration.program_name}`);
      
      // Create employee notification
      try {
        console.log(`\n📝 Creating EMPLOYEE completion notification...`);
        await createTrainingCompletionNotification(registration.user_id, registration.program_name);
        console.log(`✅ Employee completion notification created successfully`);
      } catch (empErr) {
        console.error(`❌ Failed to create employee completion notification:`, empErr.message);
      }
      
      // Create admin notification
      try {
        console.log(`\n📝 Creating ADMIN completion notification...`);
        await createTrainingCompletionAdminNotification(
          registration.user_id, 
          registration.program_name, 
          registration.training_id, 
          registration.registration_id
        );
        console.log(`✅ Admin completion notification created successfully`);
      } catch (adminErr) {
        console.error(`❌ Failed to create admin completion notification:`, adminErr.message);
      }
      
      // Create evaluation reminder notification (delayed)
      setTimeout(async () => {
        try {
          console.log(`\n📝 Creating evaluation reminder notification...`);
          await createEvaluationReminderNotification(registration.user_id, registration.program_name);
          console.log(`✅ Evaluation reminder notification created successfully`);
        } catch (err) {
          console.error('❌ Error creating evaluation reminder notification:', err);
        }
      }, 2000);
      
      console.log(`🚀 ===== COMPLETION NOTIFICATIONS COMPLETE =====\n`);
    }

    return {
      success: true,
      message: 'Progress status updated successfully',
      completed_at: completedAtValue ? completedAtValue.toISOString() : null,
    };
  } catch (error) {
    console.error('Error updating progress status:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

const router = express.Router();

router.get('/registration-management/training-programs', async (_req, res) => {
  try {
    const programs = await getTrainingProgramsWithRegistration();
    res.json(programs);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch training programs with registration' });
  }
});

router.get('/registration-management/training-programs/:id/registrations', async (req, res) => {
  const { id } = req.params;
  if (!id) {
    return res.status(400).json({ error: 'Training program ID is required' });
  }
  try {
    const registrations = await getTrainingRegistrations(id);
    res.json(registrations);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to fetch training registrations' });
  }
});


router.put('/registration-management/registrations/:id/progress', async (req, res) => {
  const { id } = req.params;
  const { progress_status, admin_id } = req.body || {};
  if (!id || !progress_status) {
    return res.status(400).json({ error: 'Registration ID and progress status are required' });
  }
  if (!['Not Started', 'In Progress', 'On Hold', 'Completed', 'Incomplete'].includes(progress_status)) {
    return res.status(400).json({ error: 'Invalid progress status' });
  }
  try {
    const result = await updateProgressStatus(id, progress_status, admin_id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to update progress status' });
  }
});

module.exports = {
  getTrainingProgramsWithRegistration,
  getTrainingRegistrations,
  updateProgressStatus,
  router
};
