/**
 * Backfill script to create notifications for existing training registrations
 * Run this once to create notifications for all existing registrations
 * 
 * Usage: node backfill_notifications.js
 */

const { pool } = require('./db_config');
const { 
  createTrainingRegistrationNotification, 
  createTrainingRegistrationAdminNotification 
} = require('./notification');

async function backfillNotifications() {
  let connection;
  try {
    connection = await pool.getConnection();
    
    console.log('🔍 Fetching all training registrations...');
    
    // Get all training registrations that don't have notifications yet
    const [registrations] = await connection.execute(`
      SELECT 
        tr.id as registration_id,
        tr.user_id,
        tr.training_id,
        tr.submitted_at,
        tp.program_name,
        -- Check if admin notification exists
        (SELECT COUNT(*) FROM notification_admin WHERE trnngreg_id = tr.id) as admin_notif_exists,
        -- Check if employee notification exists
        (SELECT COUNT(*) FROM notification_employee WHERE trnngreg_id = tr.id) as employee_notif_exists
      FROM training_registration tr
      JOIN training_program tp ON tr.training_id = tp.id
      WHERE tr.status = 'Approved'
      ORDER BY tr.submitted_at DESC
    `);
    
    console.log(`📊 Found ${registrations.length} training registrations`);
    
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    for (const reg of registrations) {
      try {
        // Skip if notifications already exist
        if (reg.admin_notif_exists > 0 && reg.employee_notif_exists > 0) {
          console.log(`⏭️  Skipping registration ${reg.registration_id} - notifications already exist`);
          skippedCount++;
          continue;
        }
        
        console.log(`\n📝 Processing registration ${reg.registration_id} for user ${reg.user_id}`);
        console.log(`   Training: ${reg.program_name}`);
        
        // Create employee notification if it doesn't exist
        if (reg.employee_notif_exists === 0) {
          try {
            await createTrainingRegistrationNotification(reg.user_id, reg.program_name, reg.registration_id);
            console.log(`   ✅ Employee notification created`);
          } catch (err) {
            console.error(`   ❌ Error creating employee notification:`, err.message);
          }
        }
        
        // Create admin notification if it doesn't exist
        if (reg.admin_notif_exists === 0) {
          try {
            await createTrainingRegistrationAdminNotification(
              reg.user_id, 
              reg.program_name, 
              reg.training_id, 
              reg.registration_id
            );
            console.log(`   ✅ Admin notification created`);
          } catch (err) {
            console.error(`   ❌ Error creating admin notification:`, err.message);
          }
        }
        
        successCount++;
      } catch (err) {
        console.error(`❌ Error processing registration ${reg.registration_id}:`, err.message);
        errorCount++;
      }
    }
    
    console.log(`\n✅ Backfill completed!`);
    console.log(`   Success: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    
  } catch (err) {
    console.error('❌ Fatal error during backfill:', err);
    throw err;
  } finally {
    if (connection) connection.release();
    // Close the pool to allow the script to exit
    await pool.end();
  }
}

// Run the backfill
if (require.main === module) {
  backfillNotifications()
    .then(() => {
      console.log('\n🎉 Backfill script completed successfully');
      process.exit(0);
    })
    .catch(err => {
      console.error('\n💥 Backfill script failed:', err);
      process.exit(1);
    });
}

module.exports = { backfillNotifications };

