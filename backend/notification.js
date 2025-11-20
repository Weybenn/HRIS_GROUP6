const express = require('express');
const { pool } = require('./db_config');

const router = express.Router();

const adminConnections = new Set();
const employeeConnections = new Map();

function normalizeUserId(userId) {
  return String(userId);
}

/* ===========================
   ADMIN NOTIFICATIONS
=========================== */

router.get('/notifications/admin', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 100), 500);

    let rows;
    try {
      // Try with read column
      [rows] = await pool.query(
        `SELECT id, user_id, trnngprog_id, trnngreg_id, applicant_id, eval_id, message, timestamp, COALESCE(\`read\`, 0) as \`read\`
         FROM notification_admin
         ORDER BY timestamp DESC
         LIMIT ?`,
        [limit]
      );
    } catch (columnError) {
      // If read column doesn't exist, select without it
      if (columnError.code === 'ER_BAD_FIELD_ERROR' || columnError.message.includes('read')) {
        console.warn('read column not found in query. Please run migration_add_read_column.sql');
        [rows] = await pool.query(
          `SELECT id, user_id, trnngprog_id, trnngreg_id, applicant_id, eval_id, message, timestamp, 0 as \`read\`
           FROM notification_admin
           ORDER BY timestamp DESC
           LIMIT ?`,
          [limit]
        );
      } else {
        throw columnError;
      }
    }

    res.json(rows);
  } catch (err) {
    console.error('Error fetching admin notifications:', err);
    res.status(500).json({ error: 'Failed to fetch admin notifications' });
  }
});

/* ===========================
   MARK AS READ/UNREAD - ADMIN
=========================== */

router.post('/notifications/admin/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query(
      'UPDATE notification_admin SET `read` = 1 WHERE id = ?',
      [id]
    );

    // Fetch updated notification
    const [rows] = await pool.query(
      `SELECT id, user_id, trnngprog_id, trnngreg_id, applicant_id, eval_id, message, timestamp, COALESCE(\`read\`, 0) as \`read\`
       FROM notification_admin WHERE id = ?`,
      [id]
    );

    const updatedNotif = rows[0];

    // Send real-time update to all admin connections
    adminConnections.forEach(conn => {
      try {
        conn.write(`data: ${JSON.stringify({ 
          type: 'notification_updated', 
          data: updatedNotif 
        })}\n\n`);
      } catch (err) {
        console.error('Error sending real-time update:', err);
      }
    });

    res.json({ success: true, notification: updatedNotif });
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

router.post('/notifications/admin/:id/unread', async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query(
      'UPDATE notification_admin SET `read` = 0 WHERE id = ?',
      [id]
    );

    // Fetch updated notification
    const [rows] = await pool.query(
      `SELECT id, user_id, trnngprog_id, trnngreg_id, applicant_id, eval_id, message, timestamp, COALESCE(\`read\`, 0) as \`read\`
       FROM notification_admin WHERE id = ?`,
      [id]
    );

    const updatedNotif = rows[0];

    // Send real-time update to all admin connections
    adminConnections.forEach(conn => {
      try {
        conn.write(`data: ${JSON.stringify({ 
          type: 'notification_updated', 
          data: updatedNotif 
        })}\n\n`);
      } catch (err) {
        console.error('Error sending real-time update:', err);
      }
    });

    res.json({ success: true, notification: updatedNotif });
  } catch (err) {
    console.error('Error marking notification as unread:', err);
    res.status(500).json({ error: 'Failed to mark notification as unread' });
  }
});

/* ===========================
   EMPLOYEE NOTIFICATIONS
=========================== */

router.get('/notifications/employee', async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: 'user_id is required' });

    const limit = Math.min(Number(req.query.limit || 100), 500);

    const [rows] = await pool.query(
      `SELECT id, user_id, trnngreg_id, eval_id, message, timestamp
       FROM notification_employee
       WHERE user_id = ?
       ORDER BY timestamp DESC
       LIMIT ?`,
      [user_id, limit]
    );

    res.json(rows);

  } catch (err) {
    console.error('Error fetching employee notifications:', err);
    res.status(500).json({ error: 'Failed to fetch employee notifications' });
  }
});


/* ===========================
   DELETE ALL - ADMIN
=========================== */

router.post('/notifications/admin/delete-all', async (req, res) => {
  try {
    await pool.query('DELETE FROM notification_admin');

    adminConnections.forEach(connection => {
      try {
        connection.write(`data: ${JSON.stringify({
          type: 'notifications_updated', 
          data: []
        })}\n\n`);
      } catch (err) {
        console.error('Error sending real-time update to admin:', err);
      }
    });

    res.json({ success: true, message: 'All admin notifications deleted' });
  } catch (err) {
    console.error('Error deleting admin notifications:', err);
    res.status(500).json({ error: 'Failed to delete admin notifications' });
  }
});

/* ===========================
   DELETE ALL - EMPLOYEE
=========================== */

router.post('/notifications/employee/delete-all', async (req, res) => {
  try {
    const { user_id, employee_id } = req.body;
    if (!user_id && !employee_id)
      return res.status(400).json({ error: 'user_id or employee_id is required' });

    await pool.query(
      'DELETE FROM notification_employee WHERE user_id = ? OR employee_id = ?', 
      [user_id || null, employee_id || null]
    );

    const key = normalizeUserId(user_id || employee_id);
    const userConnections = employeeConnections.get(key);

    if (userConnections) {
      userConnections.forEach(connection => {
        try {
          connection.write(`data: ${JSON.stringify({
            type: 'notifications_updated', 
            data: []
          })}\n\n`);
        } catch (err) {
          console.error('Error sending real-time update to employee:', err);
        }
      });
    }

    res.json({ success: true, message: 'All employee notifications deleted' });
  } catch (err) {
    console.error('Error deleting employee notifications:', err);
    res.status(500).json({ error: 'Failed to delete employee notifications' });
  }
});

/* ===========================
   SSE STREAMS
=========================== */

// Admin Stream
router.get('/notifications/admin/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  adminConnections.add(res);

  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

  const heartbeat = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 25000);

  req.on('close', () => {
    adminConnections.delete(res);
    clearInterval(heartbeat);
  });
});

// Employee Stream
router.get('/notifications/employee/stream', (req, res) => {
  const { user_id, employee_id } = req.query;

  if (!user_id && !employee_id) {
    return res.status(400).json({ error: 'user_id or employee_id is required' });
  }

  const key = normalizeUserId(user_id || employee_id);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  if (!employeeConnections.has(key)) {
    employeeConnections.set(key, new Set());
  }

  employeeConnections.get(key).add(res);

  res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

  const heartbeat = setInterval(() => {
    res.write(': keep-alive\n\n');
  }, 25000);

  req.on('close', () => {
    const conns = employeeConnections.get(key);
    if (conns) {
      conns.delete(res);
      if (conns.size === 0) {
        employeeConnections.delete(key);
      }
    }
    clearInterval(heartbeat);
  });
});

/* ===========================
   CREATE NOTIFICATIONS
=========================== */

// Admin
async function createAdminNotification({ user_id, employee_id, trnngprog_id, trnngreg_id, applicant_id, eval_id, message }) {
  try {
    console.log(`\n🔵 [createAdminNotification] Starting...`);
    console.log(`   Parameters:`, { user_id, employee_id, trnngprog_id, trnngreg_id, applicant_id, eval_id, message: message?.substring(0, 50) + '...' });
    
    // Try with read column first, fallback if column doesn't exist
    // Note: notification_admin table does NOT have employee_id column
    let result;
    try {
      console.log(`   Attempting INSERT with read column...`);
      [result] = await pool.query(
        `INSERT INTO notification_admin 
          (user_id, trnngprog_id, trnngreg_id, applicant_id, eval_id, message, timestamp, \`read\`)
         VALUES (?, ?, ?, ?, ?, ?, NOW(), 0)`,
        [user_id, trnngprog_id, trnngreg_id, applicant_id, eval_id, message]
      );
      console.log(`   ✅ INSERT successful! Insert ID: ${result.insertId}`);
    } catch (columnError) {
      // If read column doesn't exist, insert without it
      if (columnError.code === 'ER_BAD_FIELD_ERROR' && (columnError.message.includes('read') || columnError.sqlMessage?.includes('read'))) {
        console.warn(`   ⚠️ read column not found, inserting without it. Please run migration_add_read_column.sql`);
        [result] = await pool.query(
          `INSERT INTO notification_admin 
            (user_id, trnngprog_id, trnngreg_id, applicant_id, eval_id, message, timestamp)
           VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [user_id, trnngprog_id, trnngreg_id, applicant_id, eval_id, message]
        );
        console.log(`   ✅ INSERT successful (without read column)! Insert ID: ${result.insertId}`);
      } else {
        console.error(`   ❌ INSERT failed with error:`, columnError);
        throw columnError;
      }
    }

    const notif = {
      id: result.insertId,
      user_id,
      trnngprog_id,
      trnngreg_id,
      applicant_id,
      eval_id,
      message,
      read: 0,
      timestamp: new Date().toISOString()
    };

    console.log(`📤 Sending admin notification, active connections: ${adminConnections.size}`);

    if (adminConnections.size > 0) {
      let sentCount = 0;
      adminConnections.forEach(conn => {
        try {
          conn.write(`data: ${JSON.stringify({ type: 'new_notification', data: notif })}\n\n`);
          sentCount++;
        } catch (err) {
          console.error('Error sending real-time admin notification:', err);
          // Remove broken connection
          adminConnections.delete(conn);
        }
      });
      console.log(`✅ Admin notification sent to ${sentCount} connection(s)`);
    } else {
      console.warn(`⚠️ No active admin SSE connections. Notification saved but not pushed in real-time.`);
    }

    console.log(`✅ Admin notification created successfully: ${message}`);
    return { success: true, id: result.insertId };
  } catch (err) {
    console.error('❌ Error creating admin notification:', err);
    console.error('Error details:', {
      message: err.message,
      code: err.code,
      sqlState: err.sqlState,
      sqlMessage: err.sqlMessage
    });
    throw err;
  }
}

// Employee
async function createEmployeeNotification({ user_id, employee_id, trnngreg_id, eval_id, message }) {
  try {
    console.log(`\n🟢 [createEmployeeNotification] Starting...`);
    console.log(`   Parameters:`, { user_id, employee_id, trnngreg_id, eval_id, message: message?.substring(0, 50) + '...' });
    
    console.log(`   Attempting INSERT into notification_employee...`);
    // Note: notification_employee table does NOT have employee_id column based on schema
    const [result] = await pool.query(
      `INSERT INTO notification_employee 
        (user_id, trnngreg_id, eval_id, message, timestamp)
       VALUES (?, ?, ?, ?, NOW())`,
      [user_id, trnngreg_id, eval_id, message]
    );
    console.log(`   ✅ INSERT successful! Insert ID: ${result.insertId}`);

    const notif = {
      id: result.insertId,
      user_id,
      trnngreg_id,
      eval_id,
      message,
      timestamp: new Date().toISOString()
    };

    const key = normalizeUserId(user_id);
    const conns = employeeConnections.get(key);

    console.log(`📤 Sending employee notification to user ${key}, active connections: ${conns ? conns.size : 0}`);

    if (conns && conns.size > 0) {
      let sentCount = 0;
      conns.forEach(conn => {
        try {
          conn.write(`data: ${JSON.stringify({ type: 'new_notification', data: notif })}\n\n`);
          sentCount++;
        } catch (err) {
          console.error('Error sending real-time employee notification:', err);
          // Remove broken connection
          conns.delete(conn);
        }
      });
      console.log(`✅ Employee notification sent to ${sentCount} connection(s)`);
    } else {
      console.warn(`⚠️ No active SSE connections for user ${key}. Notification saved but not pushed in real-time.`);
    }

    console.log(`✅ Employee notification created successfully: ${message}`);
    return { success: true, id: result.insertId };
  } catch (err) {
    console.error('❌ Error creating employee notification:', err);
    throw err;
  }
}

/* ===========================
   HELPER FUNCTIONS FOR SPECIFIC NOTIFICATIONS
=========================== */

// Training Registration Admin Notification
async function createTrainingRegistrationAdminNotification(user_id, trainingProgramName, training_id, trnngreg_id = null) {
  try {
    // Try to get user details for a better notification message
    let userName = `User ${user_id}`;
    try {
      const [userRows] = await pool.query(
        'SELECT first_name, last_name, employee_id FROM users WHERE id = ? LIMIT 1',
        [user_id]
      );
      if (userRows.length > 0) {
        const user = userRows[0];
        userName = `${user.first_name} ${user.last_name}${user.employee_id ? ` (${user.employee_id})` : ''}`;
      }
    } catch (userError) {
      console.warn('Could not fetch user details for notification:', userError.message);
    }

    const message = `${userName} has registered for training program: ${trainingProgramName}`;
    console.log(`📝 Creating admin notification: ${message}`);
    
    const result = await createAdminNotification({
      user_id,
      trnngprog_id: training_id,
      trnngreg_id,
      message
    });
    
    console.log(`✅ Training registration admin notification created successfully with ID: ${result.id}`);
    return result;
  } catch (err) {
    console.error('❌ Error creating training registration admin notification:', err);
    console.error('Error stack:', err.stack);
    throw err;
  }
}

// Training Registration Employee Notification (if needed)
async function createTrainingRegistrationNotification(user_id, trainingProgramName, trnngreg_id = null) {
  try {
    const message = `You have successfully registered for training program: ${trainingProgramName}`;
    console.log(`📝 Creating employee registration notification for user ${user_id}: ${message}`);
    
    const result = await createEmployeeNotification({
      user_id,
      trnngreg_id, // Link to training_registration table
      message
    });
    
    console.log(`✅ Training registration employee notification created successfully with ID: ${result.id}`);
    return result;
  } catch (err) {
    console.error('❌ Error creating training registration notification:', err);
    console.error('Error stack:', err.stack);
    throw err;
  }
}

// Training Completion Admin Notification
async function createTrainingCompletionAdminNotification(user_id, trainingProgramName, training_id, trnngreg_id) {
  try {
    // Try to get user details for a better notification message
    let userName = `User ${user_id}`;
    try {
      const [userRows] = await pool.query(
        'SELECT first_name, last_name, employee_id FROM users WHERE id = ? LIMIT 1',
        [user_id]
      );
      if (userRows.length > 0) {
        const user = userRows[0];
        userName = `${user.first_name} ${user.last_name}${user.employee_id ? ` (${user.employee_id})` : ''}`;
      }
    } catch (userError) {
      console.warn('Could not fetch user details for notification:', userError.message);
    }

    const message = `${userName} has completed training program: ${trainingProgramName}`;
    console.log(`📝 Creating admin notification: ${message}`);
    
    const result = await createAdminNotification({
      user_id,
      trnngprog_id: training_id,
      trnngreg_id,
      message
    });
    
    console.log(`✅ Training completion admin notification created successfully with ID: ${result.id}`);
    return result;
  } catch (err) {
    console.error('❌ Error creating training completion admin notification:', err);
    throw err;
  }
}

// Training Completion Employee Notification
async function createTrainingCompletionNotification(user_id, trainingProgramName) {
  try {
    const message = `You have completed training program: ${trainingProgramName}`;
    return await createEmployeeNotification({
      user_id,
      message
    });
  } catch (err) {
    console.error('Error creating training completion notification:', err);
    throw err;
  }
}

// Evaluation Reminder Employee Notification
async function createEvaluationReminderNotification(user_id, trainingProgramName) {
  try {
    const message = `Please submit your evaluation for training program: ${trainingProgramName}`;
    return await createEmployeeNotification({
      user_id,
      message
    });
  } catch (err) {
    console.error('Error creating evaluation reminder notification:', err);
    throw err;
  }
}

// Evaluation Submission Admin Notification
async function createEvaluationAdminNotification(user_id, trainingProgramName, eval_id) {
  try {
    // Try to get user details for a better notification message
    let userName = `User ${user_id}`;
    try {
      const [userRows] = await pool.query(
        'SELECT first_name, last_name, employee_id FROM users WHERE id = ? LIMIT 1',
        [user_id]
      );
      if (userRows.length > 0) {
        const user = userRows[0];
        userName = `${user.first_name} ${user.last_name}${user.employee_id ? ` (${user.employee_id})` : ''}`;
      }
    } catch (userError) {
      console.warn('Could not fetch user details for notification:', userError.message);
    }

    const message = `${userName} has submitted an evaluation for training program: ${trainingProgramName}`;
    console.log(`📝 Creating admin notification: ${message}`);
    
    const result = await createAdminNotification({
      user_id,
      eval_id,
      message
    });
    
    console.log(`✅ Evaluation admin notification created successfully with ID: ${result.id}`);
    return result;
  } catch (err) {
    console.error('❌ Error creating evaluation admin notification:', err);
    throw err;
  }
}

/* ===========================
   TEST ENDPOINT - Verify Connection
=========================== */

router.get('/notifications/test-connection', async (req, res) => {
  try {
    // Check database connection
    const [adminCount] = await pool.query('SELECT COUNT(*) as count FROM notification_admin');
    const [employeeCount] = await pool.query('SELECT COUNT(*) as count FROM notification_employee');
    const [registrationCount] = await pool.query('SELECT COUNT(*) as count FROM training_registration WHERE status = ?', ['Approved']);
    
    // Check active SSE connections
    const adminConnectionsCount = adminConnections.size;
    const employeeConnectionsCount = Array.from(employeeConnections.values()).reduce((sum, conns) => sum + conns.size, 0);
    
    res.json({
      success: true,
      database: {
        admin_notifications: adminCount[0].count,
        employee_notifications: employeeCount[0].count,
        training_registrations: registrationCount[0].count
      },
      sse_connections: {
        admin: adminConnectionsCount,
        employee: employeeConnectionsCount,
        total: adminConnectionsCount + employeeConnectionsCount
      },
      message: 'Notification system is connected and operational'
    });
  } catch (err) {
    console.error('Error in test connection:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

// Test endpoint to manually create notifications
router.post('/notifications/test-create', async (req, res) => {
  try {
    const { user_id, training_program_name, training_id, registration_id } = req.body;
    
    if (!user_id || !training_program_name) {
      return res.status(400).json({ 
        success: false, 
        error: 'user_id and training_program_name are required' 
      });
    }

    console.log('\n🧪 TEST: Creating test notifications...');
    
    const results = {
      employee: null,
      admin: null,
      errors: []
    };

    // Test employee notification
    try {
      const empResult = await createTrainingRegistrationNotification(
        user_id, 
        training_program_name, 
        registration_id || null
      );
      results.employee = { success: true, id: empResult.id };
      console.log('✅ Test employee notification created:', empResult.id);
    } catch (err) {
      results.employee = { success: false, error: err.message };
      results.errors.push({ type: 'employee', error: err.message });
      console.error('❌ Test employee notification failed:', err.message);
    }

    // Test admin notification
    try {
      const adminResult = await createTrainingRegistrationAdminNotification(
        user_id, 
        training_program_name, 
        training_id || null, 
        registration_id || null
      );
      results.admin = { success: true, id: adminResult.id };
      console.log('✅ Test admin notification created:', adminResult.id);
    } catch (err) {
      results.admin = { success: false, error: err.message };
      results.errors.push({ type: 'admin', error: err.message });
      console.error('❌ Test admin notification failed:', err.message);
    }

    res.json({
      success: true,
      message: 'Test notifications created',
      results
    });
  } catch (err) {
    console.error('Error in test create:', err);
    res.status(500).json({ 
      success: false, 
      error: err.message 
    });
  }
});

module.exports = {
  router,
  createAdminNotification,
  createEmployeeNotification,
  createTrainingRegistrationAdminNotification,
  createTrainingRegistrationNotification,
  createTrainingCompletionAdminNotification,
  createTrainingCompletionNotification,
  createEvaluationReminderNotification,
  createEvaluationAdminNotification
};
