const express = require('express');
const { pool } = require('./db_config');
const { 
  createTrainingRegistrationNotification, 
  createTrainingRegistrationAdminNotification 
} = require('./notification');

const router = express.Router();

const BLOCKING_PROGRESS_STATES = new Set(['Not Started', 'In Progress', 'On Hold']);

router.post('/register', async (req, res) => {
  const { user_id, training_id } = req.body || {};

  if (!user_id || !training_id) {
    return res.status(400).json({ success: false, error: 'user_id and training_id are required' });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    const [trainingRows] = await connection.execute(
      'SELECT id, program_name, date, department_id, max_participants FROM training_program WHERE id = ? LIMIT 1',
      [training_id]
    );

    if (trainingRows.length === 0) {
      return res.status(404).json({ success: false, error: 'Training program not found.' });
    }

    const currentDate = new Date();
    const programDate = new Date(trainingRows[0].date);

    if (programDate < currentDate) {
      return res.status(409).json({
        success: false,
        error: 'Registration is closed as the training program date has already passed.'
      });
    }

    const [existingSame] = await connection.execute(
      'SELECT id, status, progress_status FROM training_registration WHERE user_id = ? AND training_id = ? LIMIT 1',
      [user_id, training_id]
    );
    if (existingSame.length > 0) {
      return res.status(409).json({ success: false, error: 'You have already submitted a registration request for this training.' });
    }

    const [userRows] = await connection.execute(
      'SELECT id, department_id FROM users WHERE id = ? LIMIT 1',
      [user_id]
    );
    if (userRows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found.' });
    }
    const userDepartmentId = userRows[0].department_id;

    const trainingDepartmentId = trainingRows[0].department_id;
    const isAllDepartments = (trainingDepartmentId === null);
    if (!isAllDepartments && Number(userDepartmentId) !== Number(trainingDepartmentId)) {
      return res.status(403).json({ success: false, error: 'Registration restricted: your department does not match the training program’s department.' });
    }

    const [existingAny] = await connection.execute(
      'SELECT status, progress_status FROM training_registration WHERE user_id = ?',
      [user_id]
    );
    const hasBlocking = existingAny.some((row) =>
      row.status === 'Approved' && BLOCKING_PROGRESS_STATES.has(row.progress_status || 'Not Started')
    );
    if (hasBlocking) {
      return res.status(409).json({ success: false, error: 'You can register for another training only after completing or marking previous trainings as incomplete.' });
    }

    const maxParticipants = trainingRows[0].max_participants;
    
    if (maxParticipants !== null && maxParticipants > 0) {
      const [approvedRegistrations] = await connection.execute(
        'SELECT COUNT(*) as count FROM training_registration WHERE training_id = ? AND status = ?',
        [training_id, 'Approved']
      );

      const approvedCount = approvedRegistrations[0].count;
      
      if (approvedCount >= maxParticipants) {
        return res.status(409).json({
          success: false,
          error: `This training program has reached its maximum capacity of ${maxParticipants} participants.`
        });
      }
    }

    const status = 'Approved';
    const progress_status = 'Not Started';
    const [insertResult] = await connection.execute(
      'INSERT INTO training_registration (user_id, training_id, status, progress_status, submitted_at, updated_at) VALUES (?, ?, ?, ?, NOW(), NOW())',
      [user_id, training_id, status, progress_status]
    );

    const registration_id = insertResult.insertId;
    const trainingProgramName = trainingRows[0].program_name;

    console.log(`\n🚀 ===== STARTING NOTIFICATION CREATION =====`);
    console.log(`   User ID: ${user_id}`);
    console.log(`   Training ID: ${training_id}`);
    console.log(`   Registration ID: ${registration_id}`);
    console.log(`   Program Name: ${trainingProgramName}`);

    // Create notifications - AWAIT them to ensure they complete
    // Don't let notification errors block the registration response, but log them
    let employeeNotifSuccess = false;
    let adminNotifSuccess = false;
    
    // Create employee notification
    try {
      console.log(`\n📝 Attempting to create EMPLOYEE notification...`);
      const empResult = await createTrainingRegistrationNotification(user_id, trainingProgramName, registration_id);
      console.log(`✅ EMPLOYEE notification created successfully! ID: ${empResult.id}`);
      employeeNotifSuccess = true;
    } catch (empErr) {
      console.error(`\n❌❌❌ FAILED to create EMPLOYEE notification ❌❌❌`);
      console.error('Error message:', empErr.message);
      console.error('Error code:', empErr.code);
      console.error('Error stack:', empErr.stack);
      employeeNotifSuccess = false;
    }

    // Create admin notification
    try {
      console.log(`\n📝 Attempting to create ADMIN notification...`);
      const adminResult = await createTrainingRegistrationAdminNotification(user_id, trainingProgramName, training_id, registration_id);
      console.log(`✅ ADMIN notification created successfully! ID: ${adminResult.id}`);
      adminNotifSuccess = true;
    } catch (adminErr) {
      console.error(`\n❌❌❌ FAILED to create ADMIN notification ❌❌❌`);
      console.error('Error message:', adminErr.message);
      console.error('Error code:', adminErr.code);
      console.error('Error stack:', adminErr.stack);
      adminNotifSuccess = false;
    }

    console.log(`\n📊 NOTIFICATION SUMMARY:`);
    console.log(`   Employee: ${employeeNotifSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`   Admin: ${adminNotifSuccess ? '✅ SUCCESS' : '❌ FAILED'}`);
    console.log(`🚀 ===== NOTIFICATION CREATION COMPLETE =====\n`);

    // Return success - registration is complete regardless of notification status
    return res.json({ 
      success: true, 
      status, 
      progress_status,
      message: `Successfully registered for ${trainingProgramName}`,
      notifications: {
        employee: employeeNotifSuccess,
        admin: adminNotifSuccess
      }
    });
  } catch (err) {
    console.error('Error during training registration:', err);
    return res.status(500).json({ success: false, error: 'Internal server error' });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;
