const fs = require('fs');
const path = require('path');
const express = require('express');
const { pool } = require('./db_config');
const {
  generateCertificate,
  saveCertificate,
  saveSignatureFile,
  sendCertificateEmail,
  updateCertificateStatus,
} = require('./certificate_service');

const router = express.Router();

const parseCertificateData = (raw) => {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn('Failed to parse certificate data JSON:', error.message);
    return null;
  }
};

const mapParticipantRow = (row) => {
  const normalizedCertificateUrl = row.certificate_url
    ? `/${row.certificate_url.replace(/\\/g, '/')}`
    : null;

  const middleName = row.middle_name && row.middle_name.trim().toUpperCase() === 'NA'
    ? null
    : row.middle_name;

  return {
    id: row.registration_id,
    registration_id: row.registration_id,
    user_id: row.user_id,
    training_id: row.training_id,
    first_name: row.first_name,
    middle_name: middleName,
    last_name: row.last_name,
    email: row.email,
    employee_id: row.employee_id,
    training_title: row.training_title,
    training_date: row.training_date,
    venue: row.venue,
    instructor: row.instructor,
    progress_status: row.progress_status,
    certificate_status: row.certificate_status || 'Ready to Generate',
    certificate_url: normalizedCertificateUrl,
    completed_at: row.completed_at ? new Date(row.completed_at).toISOString() : null,
    generated_at: row.generated_at ? new Date(row.generated_at).toISOString() : null,
    sent_at: row.sent_at ? new Date(row.sent_at).toISOString() : null,
    certificate_details: parseCertificateData(row.certificate_data),
  };
};

router.get('/training/:trainingId/participants', async (req, res) => {
  const trainingId = Number(req.params.trainingId);

  if (!Number.isInteger(trainingId)) {
    return res.status(400).json({ error: 'Invalid training ID' });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    const [rows] = await connection.execute(
      `
        SELECT
          tr.id AS registration_id,
          tr.user_id,
          tr.training_id,
          tr.status AS registration_status,
          tr.progress_status,
          tr.completed_at,
          u.first_name,
          u.middle_name,
          u.last_name,
          u.email,
          u.employee_id,
          tp.program_name AS training_title,
          tp.date AS training_date,
          tp.venue,
          tp.instructor,
          c.id AS certificate_id,
          c.certificate_url,
          c.status AS certificate_status,
          c.generated_at,
          c.sent_at,
          c.certificate_data
        FROM training_registration tr
        INNER JOIN users u ON u.id = tr.user_id
        INNER JOIN training_program tp ON tp.id = tr.training_id
        LEFT JOIN certificates c ON c.registration_id = tr.id
        WHERE tr.training_id = ?
          AND tr.status = 'Approved'
          AND tr.progress_status = 'Completed'
        ORDER BY u.last_name ASC, u.first_name ASC
      `,
      [trainingId]
    );

    const participants = rows.map(mapParticipantRow);
    res.json(participants);
  } catch (error) {
    console.error('Error fetching certificate participants:', error);
    res.status(500).json({ error: 'Failed to fetch participants' });
  } finally {
    if (connection) connection.release();
  }
});

router.post('/generate/:registrationId', async (req, res) => {
  const registrationId = Number(req.params.registrationId);

  if (!Number.isInteger(registrationId)) {
    return res.status(400).json({ error: 'Invalid registration ID' });
  }

  const {
    bodyText = '',
    leftSignerName = '',
    leftSignerPosition = '',
    rightSignerName = '',
    rightSignerPosition = '',
    leftSignature = undefined,
    rightSignature = undefined,
  } = req.body || {};

  const normalizedBodyText = typeof bodyText === 'string' ? bodyText.trim() : '';
  const normalizedLeftSignerName = typeof leftSignerName === 'string' ? leftSignerName.trim() : '';
  const normalizedLeftSignerPosition = typeof leftSignerPosition === 'string' ? leftSignerPosition.trim() : '';
  const normalizedRightSignerName = typeof rightSignerName === 'string' ? rightSignerName.trim() : '';
  const normalizedRightSignerPosition = typeof rightSignerPosition === 'string' ? rightSignerPosition.trim() : '';

  let connection;
  try {
    connection = await pool.getConnection();

    const [rows] = await connection.execute(
      `
        SELECT
          tr.id AS registration_id,
          tr.progress_status,
          tr.user_id,
          tr.training_id,
          tr.updated_at,
          c.certificate_url,
          c.certificate_data,
          u.first_name,
          u.middle_name,
          u.last_name,
          u.email,
          u.employee_id,
          tp.program_name,
          tp.date,
          tp.venue,
          tp.instructor
        FROM training_registration tr
        INNER JOIN users u ON u.id = tr.user_id
        INNER JOIN training_program tp ON tp.id = tr.training_id
        LEFT JOIN certificates c ON c.registration_id = tr.id
        WHERE tr.id = ?
        LIMIT 1
      `,
      [registrationId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    const record = rows[0];

    if (record.progress_status !== 'Completed') {
      return res.status(400).json({ error: 'Training not completed yet' });
    }

    const existingMetadata = parseCertificateData(record.certificate_data) || {};

    const normalizeSignatureInput = (inputValue, fallbackPath, prefix) => {
      if (typeof inputValue === 'string' && inputValue.startsWith('data:')) {
        const newPath = saveSignatureFile(inputValue, prefix);
        if (fallbackPath && fallbackPath !== newPath) {
          const oldAbsolute = path.join(__dirname, fallbackPath.replace(/^\/+/, ''));
          if (fs.existsSync(oldAbsolute)) {
            fs.unlink(oldAbsolute, () => {});
          }
        }
        return newPath;
      }

      if (typeof inputValue === 'string' && inputValue.trim().length > 0) {
        return inputValue;
      }

      if (inputValue === null) {
        if (fallbackPath) {
          const oldAbsolute = path.join(__dirname, fallbackPath.replace(/^\/+/, ''));
          if (fs.existsSync(oldAbsolute)) {
            fs.unlink(oldAbsolute, () => {});
          }
        }
        return null;
      }

      return fallbackPath || null;
    };

    const leftSignaturePath = normalizeSignatureInput(leftSignature, existingMetadata.leftSignature, 'left_signer');
    const rightSignaturePath = normalizeSignatureInput(rightSignature, existingMetadata.rightSignature, 'right_signer');

    const participant = {
      registration_id: record.registration_id,
      id: record.user_id,
      first_name: record.first_name,
      middle_name: record.middle_name,
      last_name: record.last_name,
      email: record.email,
      employee_id: record.employee_id,
    };

    const training = {
      id: record.training_id,
      program_name: record.program_name,
      date: record.date,
      venue: record.venue,
      instructor: record.instructor,
    };

    const generatedAt = new Date();

    const certificateOptions = {
      bodyText: normalizedBodyText,
      leftSignerName: normalizedLeftSignerName,
      leftSignerPosition: normalizedLeftSignerPosition,
      rightSignerName: normalizedRightSignerName,
      rightSignerPosition: normalizedRightSignerPosition,
      leftSignaturePath,
      rightSignaturePath,
      dateIssued: generatedAt.toISOString(),
    };

    if (record.certificate_url) {
      const existingCertificatePath = path.join(__dirname, record.certificate_url.replace(/^\/+/, ''));
      if (fs.existsSync(existingCertificatePath)) {
        fs.unlink(existingCertificatePath, () => {});
      }
    }

    const { storagePath, publicPath } = await generateCertificate(participant, training, certificateOptions);

    const metadata = {
      bodyText: normalizedBodyText,
      leftSignerName: normalizedLeftSignerName,
      leftSignerPosition: normalizedLeftSignerPosition,
      rightSignerName: normalizedRightSignerName,
      rightSignerPosition: normalizedRightSignerPosition,
      leftSignature: leftSignaturePath,
      rightSignature: rightSignaturePath,
    };

    const saveResult = await saveCertificate(
      registrationId,
      training.id,
      participant.id,
      storagePath,
      metadata,
      generatedAt
    );

    res.json({
      success: true,
      message: 'Certificate generated successfully!',
      certificate_path: publicPath,
      generated_at: saveResult.generatedAt,
      certificate_details: saveResult.metadata,
    });
  } catch (error) {
    console.error('Error generating certificate:', error);
    res.status(500).json({ error: 'Failed to generate certificate' });
  } finally {
    if (connection) connection.release();
  }
});

router.post('/send/:registrationId', async (req, res) => {
  const registrationId = Number(req.params.registrationId);

  if (!Number.isInteger(registrationId)) {
    return res.status(400).json({ error: 'Invalid registration ID' });
  }

  let connection;
  try {
    connection = await pool.getConnection();

    const [rows] = await connection.execute(
      `
        SELECT
          tr.id AS registration_id,
          tr.progress_status,
          tr.user_id,
          tr.training_id,
          u.first_name,
          u.last_name,
          u.email,
          tp.program_name,
          tp.instructor,
          tp.date,
          tp.venue,
          c.id AS certificate_id,
          c.certificate_url,
          c.status AS certificate_status
        FROM training_registration tr
        INNER JOIN users u ON u.id = tr.user_id
        INNER JOIN training_program tp ON tp.id = tr.training_id
        LEFT JOIN certificates c ON c.registration_id = tr.id
        WHERE tr.id = ?
        LIMIT 1
      `,
      [registrationId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    const record = rows[0];

    if (!record.certificate_id || !record.certificate_url) {
      return res.status(400).json({ error: 'Certificate has not been generated yet' });
    }

    const certificatePath = path.join(__dirname, record.certificate_url);

    if (!fs.existsSync(certificatePath)) {
      return res.status(404).json({ error: 'Certificate file not found on server' });
    }

    const participant = {
      first_name: record.first_name,
      last_name: record.last_name,
      email: record.email,
    };

    const training = {
      program_name: record.program_name,
      instructor: record.instructor,
      date: new Date(record.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      venue: record.venue,
    };

    await sendCertificateEmail(participant, training, certificatePath);
    await updateCertificateStatus(record.certificate_id, 'Sent');

    res.json({ success: true, message: 'Certificate sent successfully!' });
  } catch (error) {
    console.error('Error sending certificate email:', error);
    res.status(500).json({ error: 'Failed to send certificate email' });
  } finally {
    if (connection) connection.release();
  }
});

module.exports = router;