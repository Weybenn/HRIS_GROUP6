const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');
const puppeteer = require('puppeteer');
const { createConnection } = require('./db_config');

const CERTIFICATES_SUBDIR = path.posix.join('uploads', 'certificates');
const SIGNATURES_SUBDIR = path.posix.join('uploads', 'signatures');
const CERTIFICATES_DIR = path.join(__dirname, CERTIFICATES_SUBDIR);
const SIGNATURES_DIR = path.join(__dirname, SIGNATURES_SUBDIR);
const FRONTEND_LOGO_PATH = path.resolve(__dirname, '../frontend/src/assets/logo/EARIST_Logo.png');

const ensureDirectory = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const escapeHtml = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const formatDisplayDate = (dateInput) => {
  if (!dateInput) {
    return '';
  }
  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const toMysqlDateTime = (date) => {
  const pad = (num) => String(num).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

let cachedTransporter = null;
let cachedWatermark = null;

const loadWatermark = () => {
  if (cachedWatermark) {
    return cachedWatermark;
  }

  try {
    const logoBuffer = fs.readFileSync(FRONTEND_LOGO_PATH);
    cachedWatermark = `data:image/png;base64,${logoBuffer.toString('base64')}`;
  } catch (error) {
    console.warn('⚠️  EARIST logo not found for certificate watermark:', error.message);
    cachedWatermark = null;
  }

  return cachedWatermark;
};

const createMailTransporter = () => {
  if (cachedTransporter) {
    return cachedTransporter;
  }

  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;

  if (!emailUser || !emailPass) {
    throw new Error('Email credentials not configured. Please set EMAIL_USER and EMAIL_PASS environment variables.');
  }

  cachedTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: emailUser,
      pass: emailPass,
    },
  });

  cachedTransporter.verify((error) => {
    if (error) {
      console.error('Email transporter verification failed:', error);
    } else {
      console.log('✅ Email transporter is ready to send emails');
    }
  });

  return cachedTransporter;
};

const sanitizeNameParts = (participant) => {
  const safe = {
    first: participant.first_name || '',
    middle: participant.middle_name || '',
    last: participant.last_name || '',
  };

  if (safe.middle.trim().toUpperCase() === 'NA') {
    safe.middle = '';
  }

  return [safe.first, safe.middle, safe.last].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
};

const buildCertificateHtml = (participant, training, options = {}) => {
  const {
    bodyText = '',
    leftSignerName = '',
    leftSignerPosition = '',
    rightSignerName = '',
    rightSignerPosition = '',
    leftSignatureDataUri = null,
    rightSignatureDataUri = null,
    watermarkDataUri = null,
    dateIssued = '',
  } = options;

  const participantName = sanitizeNameParts(participant);
  const formattedDateIssued = formatDisplayDate(dateIssued);

  return `
    <html>
      <head>
        <meta charset="UTF-8" />
        <style>
          @page {
            size: A4 landscape;
            margin: 0;
          }
          * { box-sizing: border-box; }
          body {
            font-family: 'Poppins', sans-serif;
            margin: 0;
            padding: 0;
            background: #f6f2e8;
            color: #1f1f1f;
          }
          .certificate-wrapper {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: stretch;
            justify-content: stretch;
          }
          .certificate {
            position: relative;
            width: 100%;
            height: 100%;
            background: #fff;
            display: flex;
            flex-direction: column;
            padding: 48px 72px 64px;
          }
          .certificate:before {
            content: '';
            position: absolute;
            top: 32px;
            left: 32px;
            right: 32px;
            bottom: 40px;
            border: 12px solid #6D2323;
            pointer-events: none;
          }
          .certificate:after {
            content: '';
            position: absolute;
            top: 60px;
            left: 60px;
            right: 60px;
            bottom: 66px;
            border: 2px dashed #c49543;
            pointer-events: none;
            opacity: 0.8;
          }
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 320px;
            height: auto;
            opacity: 0.25;
            pointer-events: none;
          }
          .header {
            text-align: center;
            margin-bottom: 16px;
            position: relative;
            z-index: 1;
          }
          .header h1 {
            margin: 0;
            font-size: 44px;
            letter-spacing: 8px;
            color: #6D2323;
          }
          .header h2 {
            margin: 6px 0 0;
            font-size: 20px;
            letter-spacing: 6px;
            color: #c49543;
          }
          .body-section {
            text-align: center;
            line-height: 1.6;
            font-size: 16px;
            margin: 0 48px;
            position: relative;
            z-index: 1;
          }
          .body-section .recipient {
            font-size: 30px;
            font-weight: 700;
            color: #b8860b;
            margin: 20px 0 12px;
            text-transform: uppercase;
          }
          .body-section .description {
            font-size: 16px;
            color: #333;
            white-space: pre-line;
          }
          .date-issued {
            margin-top: 24px;
            font-size: 15px;
            color: #4b5563;
            font-weight: 600;
          }
          .signatures {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            gap: 80px;
            margin: 48px 96px 0;
            position: relative;
            z-index: 1;
          }
          .signature-block {
            flex: 1;
            text-align: center;
            min-height: 200px;
            padding-bottom: 18px;
            display: flex;
            flex-direction: column;
            justify-content: flex-end;
            align-items: center;
          }
          .signature-block img {
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
            margin-bottom: 10px;
          }
          .signature-line {
            width: 280px;
            border-top: 2px solid #6D2323;
            margin: 0 auto 16px;
          }
          .signer-name {
            font-size: 16px;
            font-weight: 700;
            color: #111827;
            text-transform: uppercase;
            margin: 0;
          }
          .signer-position {
            font-size: 14px;
            font-weight: 500;
            color: #4b5563;
            margin: 4px 0 0;
          }
        </style>
      </head>
      <body>
        <div class="certificate-wrapper">
          <div class="certificate">
            ${watermarkDataUri ? `<img class="watermark" src="${watermarkDataUri}" alt="EARIST Watermark" />` : ''}
            <div class="header" style="padding-top: 48px;">
              <h1>CERTIFICATE</h1>
              <h2>OF COMPLETION</h2>
            </div>
            <div class="body-section">
              <div>This certifies that</div>
              <div class="recipient">${escapeHtml(participantName)}</div>
              <div class="description">${escapeHtml(bodyText)}</div>
              ${formattedDateIssued ? `<div class="date-issued">Date Issued: ${escapeHtml(formattedDateIssued)}</div>` : ''}
            </div>
            <div class="signatures">
              <div class="signature-block">
                ${leftSignatureDataUri ? `<img src="${leftSignatureDataUri}" alt="Left signer e-signature" />` : ''}
                <div class="signature-line"></div>
                <p class="signer-name">${escapeHtml(leftSignerName)}</p>
                <p class="signer-position">${escapeHtml(leftSignerPosition)}</p>
              </div>
              <div class="signature-block">
                ${rightSignatureDataUri ? `<img src="${rightSignatureDataUri}" alt="Right signer e-signature" />` : ''}
                <div class="signature-line"></div>
                <p class="signer-name">${escapeHtml(rightSignerName)}</p>
                <p class="signer-position">${escapeHtml(rightSignerPosition)}</p>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  `;
};

const resolveDataUriFromPath = (relativePath) => {
  if (!relativePath) {
    return null;
  }

  const safeRelative = relativePath.replace(/^\/+/, '');
  const absolutePath = path.join(__dirname, safeRelative);

  if (!fs.existsSync(absolutePath)) {
    return null;
  }

  const buffer = fs.readFileSync(absolutePath);
  const extension = path.extname(absolutePath).toLowerCase();
  const mimeType = extension === '.svg'
    ? 'image/svg+xml'
    : extension === '.jpg' || extension === '.jpeg'
      ? 'image/jpeg'
      : 'image/png';

  return `data:${mimeType};base64,${buffer.toString('base64')}`;
};

const generateCertificate = async (participant, training, options = {}) => {
  ensureDirectory(CERTIFICATES_DIR);

  const { dateIssued } = options;
  const html = buildCertificateHtml(participant, training, {
    ...options,
    watermarkDataUri: loadWatermark(),
    leftSignatureDataUri: resolveDataUriFromPath(options.leftSignaturePath),
    rightSignatureDataUri: resolveDataUriFromPath(options.rightSignaturePath),
  });

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const page = await browser.newPage();

  await page.setContent(html, { waitUntil: 'domcontentloaded' });

  const timestamp = Date.now();
  const fileName = `certificate_${participant.registration_id || participant.id}_${timestamp}.pdf`;
  const storagePath = path.posix.join(CERTIFICATES_SUBDIR, fileName);
  const absolutePath = path.join(__dirname, storagePath);

  await page.pdf({
    path: absolutePath,
    format: 'A4',
    landscape: true,
    printBackground: true,
    margin: { top: '20mm', bottom: '20mm', left: '20mm', right: '20mm' },
  });

  await browser.close();

  return {
    fileName,
    storagePath,
    publicPath: `/${storagePath.replace(/\\/g, '/')}`,
    absolutePath,
    dateIssued,
  };
};

const saveCertificate = async (registrationId, trainingId, userId, storagePath, metadata, generatedAt) => {
  let connection;
  try {
    connection = await createConnection();
    await connection.beginTransaction();

    const generatedAtIso = generatedAt.toISOString();
    const generatedAtMysql = toMysqlDateTime(generatedAt);
    const payload = {
      ...metadata,
      dateIssued: generatedAtIso,
    };

    const [existing] = await connection.execute(
      'SELECT id FROM certificates WHERE registration_id = ? LIMIT 1',
      [registrationId]
    );

    let certificateId;
    if (existing.length > 0) {
      certificateId = existing[0].id;
      await connection.execute(
        `UPDATE certificates
         SET training_id = ?,
             user_id = ?,
             certificate_url = ?,
             status = 'Generated',
             generated_at = ?,
             sent_at = NULL,
             certificate_data = ?
         WHERE id = ?`,
        [
          trainingId,
          userId,
          storagePath,
          generatedAtMysql,
          JSON.stringify(payload),
          certificateId,
        ]
      );
    } else {
      const [insertResult] = await connection.execute(
        `INSERT INTO certificates
           (registration_id, training_id, user_id, certificate_url, status, generated_at, certificate_data)
         VALUES (?, ?, ?, ?, 'Generated', ?, ?)`,
        [
          registrationId,
          trainingId,
          userId,
          storagePath,
          generatedAtMysql,
          JSON.stringify(payload),
        ]
      );
      certificateId = insertResult.insertId;
    }

    await connection.commit();

    return {
      certificateId,
      metadata: payload,
      generatedAt: generatedAtIso,
    };
  } catch (error) {
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Error during rollback:', rollbackError);
      }
    }
    console.error('Error saving certificate:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

const saveSignatureFile = (dataUri, prefix) => {
  if (!dataUri) {
    return null;
  }

  ensureDirectory(SIGNATURES_DIR);

  const matches = dataUri.match(/^data:(.+);base64,(.*)$/);
  if (!matches) {
    return dataUri; // assume already a stored path
  }

  const mimeType = matches[1];
  const base64Data = matches[2];
  const extension = mimeType.includes('svg')
    ? 'svg'
    : mimeType.includes('jpeg') || mimeType.includes('jpg')
      ? 'jpg'
      : 'png';

  const buffer = Buffer.from(base64Data, 'base64');
  const fileName = `${prefix}_${Date.now()}.${extension}`;
  const storagePath = path.posix.join(SIGNATURES_SUBDIR, fileName);
  const absolutePath = path.join(__dirname, storagePath);

  fs.writeFileSync(absolutePath, buffer);

  return `/${storagePath.replace(/\\/g, '/')}`;
};

const sendCertificateEmail = async (participant, training, certificateAbsolutePath) => {
  const transporter = createMailTransporter();

  const mailOptions = {
    from: `"EARIST HRIS" <${process.env.EMAIL_USER}>`,
    to: participant.email,
    subject: `Certificate of Completion - ${training.program_name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6D2323;">Certificate of Completion</h2>
        <p>Dear ${escapeHtml(participant.first_name)} ${escapeHtml(participant.last_name)},</p>
        <p>Congratulations! You have successfully completed the training program <strong>${escapeHtml(training.program_name)}</strong>.</p>
        <p>Your certificate of completion is attached to this email.</p>
        <p>If you have any questions, please contact the training department.</p>
        <p>Best regards,<br/>Eulogio &quot;Amang&quot; Rodriguez Institute of Science and Technology</p>
      </div>
    `,
    attachments: [
      {
        filename: `Certificate_${sanitizeNameParts(participant).replace(/\s+/g, '_')}.pdf`,
        path: certificateAbsolutePath,
      },
    ],
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

const updateCertificateStatus = async (certificateId, status) => {
  let connection;
  try {
    connection = await createConnection();
    const query = status === 'Sent'
      ? `UPDATE certificates SET status = ?, sent_at = CURRENT_TIMESTAMP WHERE id = ?`
      : `UPDATE certificates SET status = ? WHERE id = ?`;

    await connection.execute(query, [status, certificateId]);
  } catch (error) {
    console.error('Error updating certificate status:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

module.exports = {
  generateCertificate,
  saveCertificate,
  saveSignatureFile,
  sendCertificateEmail,
  updateCertificateStatus,
};
