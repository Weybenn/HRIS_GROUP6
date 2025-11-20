const express = require('express');
const { pool } = require('./db_config');
const { createEvaluationAdminNotification } = require('./notification');

const router = express.Router();

router.get('/evaluation-management/training-programs', async (req, res) => {
  let connection;
  try {
    connection = await pool.getConnection();
    
    const [allPrograms] = await connection.execute(
      `SELECT id, program_name, register_link FROM training_program WHERE register_link = 1 ORDER BY id`
    );
    console.log('All training programs:', allPrograms);
    
    const [rows] = await connection.execute(
      `SELECT 
         tp.id,
         tp.program_name,
         tp.date,
         tp.time,
         tp.venue,
         tp.mode,
         tp.instructor,
         tp.upload_photo,
         tp.max_participants,
         tp.register_link,
         COALESCE(cd.department, 'All Departments') AS department,
         COUNT(DISTINCT tr.id) as total_participants,
         COUNT(DISTINCT ef.id) as submitted_evaluations
       FROM training_program tp
       LEFT JOIN college_department cd ON tp.department_id = cd.id
       LEFT JOIN training_registration tr ON tp.id = tr.training_id AND tr.status = 'Approved'
       LEFT JOIN evaluation_form ef ON tr.id = ef.trnngreg_id
       WHERE tp.register_link = 1
       GROUP BY tp.id, tp.program_name, tp.date, tp.time, tp.venue, tp.mode, tp.instructor, tp.upload_photo, tp.max_participants, tp.register_link, cd.department
       ORDER BY tp.date DESC, tp.time DESC`
    );
    
    console.log('Training programs with evaluation data found:', rows.length);
    console.log('Sample data:', rows[0]);
    
    res.json(rows);
  } catch (err) {
    console.error('Error fetching training programs:', err);
    res.status(500).json({ error: 'Failed to fetch training programs' });
  } finally {
    if (connection) connection.release();
  }
});

router.get('/evaluation-management/analytics/:programId', async (req, res) => {
  const programId = req.params.programId;
  let connection;
  
  try {
    connection = await pool.getConnection();
    
    const [participantsResult] = await connection.execute(
      `SELECT COUNT(*) as total_participants
       FROM training_registration tr
       WHERE tr.training_id = ? AND tr.status = 'Approved'`,
      [programId]
    );
    
    const totalParticipants = participantsResult[0].total_participants;
    
    const [evaluationsResult] = await connection.execute(
      `SELECT COUNT(*) as submitted_evaluations
       FROM evaluation_form ef
       JOIN training_registration tr ON ef.trnngreg_id = tr.id
       WHERE tr.training_id = ? AND tr.status = 'Approved'`,
      [programId]
    );
    
    const submittedEvaluations = evaluationsResult[0].submitted_evaluations;
    
    const [evaluationData] = await connection.execute(
      `SELECT ef.q1, ef.q2, ef.q3, ef.q4, ef.q5
       FROM evaluation_form ef
       JOIN training_registration tr ON ef.trnngreg_id = tr.id
       WHERE tr.training_id = ? AND tr.status = 'Approved'`,
      [programId]
    );
    
    let analyticsData = {
      totalParticipants,
      submittedEvaluations,
      overallSatisfaction: 0,
      questionAnalytics: []
    };
    
    if (evaluationData.length > 0) {
      let totalRating = 0;
      let totalResponses = 0;
      
      evaluationData.forEach(row => {
        totalRating += parseInt(row.q1) + parseInt(row.q2) + parseInt(row.q3) + parseInt(row.q4) + parseInt(row.q5);
        totalResponses += 5;
      });
      
      analyticsData.overallSatisfaction = totalRating / totalResponses;
      
      const questions = [
        'Overall Organization — How satisfied are you with the overall organization and coordination of the training program?',
        'Content Clarity and Relevance — How satisfied are you with the clarity, relevance, and depth of the topics presented?',
        'Speaker\'s Expertise and Delivery — How satisfied are you with the speaker\'s knowledge of the subject matter and presentation style?',
        'Venue, Facilities, and Schedule Management — How satisfied are you with the quality of the venue, available facilities, and time management throughout the seminar?',
        'Personal and Professional Value — How satisfied are you with the seminar\'s usefulness and its contribution to your personal or professional growth?'
      ];
      
      for (let q = 1; q <= 5; q++) {
        const questionKey = `q${q}`;
        const responses = evaluationData.map(row => parseInt(row[questionKey]));
        
        const averageRating = responses.reduce((sum, rating) => sum + rating, 0) / responses.length;
        
        const distribution = [0, 0, 0, 0, 0];
        responses.forEach(rating => {
          distribution[rating - 1]++;
        });
        
        analyticsData.questionAnalytics.push({
          question: questions[q - 1],
          averageRating,
          distribution,
          totalResponses: responses.length
        });
      }
    }
    
    res.json(analyticsData);
  } catch (err) {
    console.error('Error fetching analytics data:', err);
    res.status(500).json({ error: 'Failed to fetch analytics data' });
  } finally {
    if (connection) connection.release();
  }
});

router.get('/completed', async (req, res) => {
  const userId = Number(req.query.user_id);
  if (!userId) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  let connection;
  try {
    connection = await pool.getConnection();
    const [rows] = await connection.execute(
      `SELECT 
         tr.id AS registration_id,
         tr.training_id,
         tr.progress_status,
         tr.submitted_at,
         tp.program_name,
         tp.date,
         tp.time,
         tp.venue,
         tp.mode,
         tp.instructor,
         tp.upload_photo,
         tp.max_participants,
         COALESCE(cd.department, 'All Departments') AS department,
         CASE WHEN ef.id IS NULL THEN 0 ELSE 1 END AS evaluated
       FROM training_registration tr
       JOIN training_program tp ON tr.training_id = tp.id
       LEFT JOIN college_department cd ON tp.department_id = cd.id
       LEFT JOIN evaluation_form ef ON ef.trnngreg_id = tr.id
       WHERE tr.user_id = ? AND tr.status = 'Approved' AND tr.progress_status = 'Completed'
       ORDER BY tp.date DESC, tp.time DESC`,
      [userId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Error fetching completed trainings:', err);
    res.status(500).json({ error: 'Failed to fetch completed trainings' });
  } finally {
    if (connection) connection.release();
  }
});

router.post('/submit', async (req, res) => {
  const { user_id, registration_id, q1, q2, q3, q4, q5 } = req.body || {};

  if (!user_id || !registration_id || !q1 || !q2 || !q3 || !q4 || !q5) {
    return res.status(400).json({ error: 'user_id, registration_id, and all questions q1..q5 are required' });
  }

  const valid = new Set(['1','2','3','4','5', 1,2,3,4,5]);
  if (![q1,q2,q3,q4,q5].every(v => valid.has(v))) {
    return res.status(400).json({ error: 'Question responses must be in range 1-5' });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    const [[reg]] = await connection.execute(
      `SELECT tr.id, tr.user_id, tr.progress_status FROM training_registration tr WHERE tr.id = ? LIMIT 1`,
      [registration_id]
    );
    if (!reg || Number(reg.user_id) !== Number(user_id)) {
      return res.status(403).json({ error: 'Registration not found for this user' });
    }
    if (reg.progress_status !== 'Completed') {
      return res.status(409).json({ error: 'Evaluation allowed only after training is marked Completed' });
    }

    const [[existing]] = await connection.execute(
      `SELECT id FROM evaluation_form WHERE trnngreg_id = ? LIMIT 1`,
      [registration_id]
    );
    if (existing) {
      return res.status(409).json({ error: 'Evaluation already submitted for this training' });
    }

    const [result] = await connection.execute(
      `INSERT INTO evaluation_form (trnngreg_id, q1, q2, q3, q4, q5, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [registration_id, String(q1), String(q2), String(q3), String(q4), String(q5)]
    );

    try {
      const [trainingData] = await connection.execute(
        `SELECT tp.program_name 
         FROM training_program tp 
         JOIN training_registration tr ON tp.id = tr.training_id 
         WHERE tr.id = ?`,
        [registration_id]
      );
      
      if (trainingData.length > 0) {
        const trainingProgramName = trainingData[0].program_name;
        await createEvaluationAdminNotification(user_id, trainingProgramName, result.insertId);
      }
    } catch (notificationError) {
      console.error('Error creating evaluation notification:', notificationError);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Error submitting evaluation:', err);
    res.status(500).json({ error: 'Failed to submit evaluation' });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;


