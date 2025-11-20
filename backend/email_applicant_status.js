const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const getEmailTemplate = (status, applicantName, jobTitle) => {
  const templates = {
    exam: {
      subject: 'Application Status Update - Examination Required',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #8B5CF6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">EARIST HRIS - Application Status Update</h2>
          </div>
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
            <p>Dear ${applicantName},</p>
            <p>We are pleased to inform you that your application for the position of <strong>${jobTitle}</strong> has progressed to the next stage.</p>
            <div style="background-color: #f3e8ff; border-left: 4px solid #8B5CF6; padding: 15px; margin: 20px 0;">
              <h3 style="color: #8B5CF6; margin-top: 0;">📝 Examination Required</h3>
              <p style="margin-bottom: 0;">Your application status has been updated to <strong>Exam</strong>. You will be required to take an examination as part of our selection process.</p>
            </div>
            <p>Please wait for further instructions regarding the examination schedule and requirements. We will contact you soon with the details.</p>
            <p>If you have any questions, please don't hesitate to contact our HR department.</p>
            <br>
            <p>Best regards,<br>
            <strong>EARIST Human Resources Department</strong></p>
          </div>
        </div>
      `
    },
    interview: {
      subject: 'Application Status Update - Interview Scheduled',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #1976d2; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">EARIST HRIS - Application Status Update</h2>
          </div>
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
            <p>Dear ${applicantName},</p>
            <p>We are pleased to inform you that your application for the position of <strong>${jobTitle}</strong> has progressed to the next stage.</p>
            <div style="background-color: #e3f2fd; border-left: 4px solid #1976d2; padding: 15px; margin: 20px 0;">
              <h3 style="color: #1976d2; margin-top: 0;">💼 Interview Scheduled</h3>
              <p style="margin-bottom: 0;">Your application status has been updated to <strong>Interview</strong>. You will be contacted soon to schedule your interview.</p>
            </div>
            <p>Please prepare for your interview and wait for further instructions regarding the schedule and format.</p>
            <p>If you have any questions, please don't hesitate to contact our HR department.</p>
            <br>
            <p>Best regards,<br>
            <strong>EARIST Human Resources Department</strong></p>
          </div>
        </div>
      `
    },
    approved: {
      subject: 'Congratulations! Application Approved',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">EARIST HRIS - Congratulations!</h2>
          </div>
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
            <p>Dear ${applicantName},</p>
            <p>We are delighted to inform you that your application for the position of <strong>${jobTitle}</strong> has been successful!</p>
            <div style="background-color: #d1fae5; border-left: 4px solid #10B981; padding: 15px; margin: 20px 0;">
              <h3 style="color: #10B981; margin-top: 0;">🎉 Application Approved</h3>
              <p style="margin-bottom: 0;">Congratulations! Your application has been approved. Welcome to the EARIST team!</p>
            </div>
            <p>You will receive further instructions regarding your onboarding process and start date from our HR department.</p>
            <p>If you have any questions, please don't hesitate to contact us.</p>
            <br>
            <p>Best regards,<br>
            <strong>EARIST Human Resources Department</strong></p>
          </div>
        </div>
      `
    },
    declined: {
      subject: 'Application Status Update',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #EF4444; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
            <h2 style="margin: 0;">EARIST HRIS - Application Status Update</h2>
          </div>
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px;">
            <p>Dear ${applicantName},</p>
            <p>Thank you for your interest in the position of <strong>${jobTitle}</strong> at EARIST.</p>
            <div style="background-color: #fee2e2; border-left: 4px solid #EF4444; padding: 15px; margin: 20px 0;">
              <h3 style="color: #EF4444; margin-top: 0;">📋 Application Status</h3>
              <p style="margin-bottom: 0;">After careful consideration, we regret to inform you that your application has not been successful at this time.</p>
            </div>
            <p>We appreciate the time and effort you invested in your application. We encourage you to apply for other suitable positions in the future.</p>
            <p>If you have any questions, please don't hesitate to contact our HR department.</p>
            <br>
            <p>Best regards,<br>
            <strong>EARIST Human Resources Department</strong></p>
          </div>
        </div>
      `
    }
  };
  
  return templates[status] || templates.exam;
};

const sendStatusUpdateEmail = async (applicantEmail, applicantName, jobTitle, status) => {
  try {
    const template = getEmailTemplate(status, applicantName, jobTitle);
    
    const mailOptions = {
      from: `"EARIST HRIS" <${process.env.EMAIL_USER}>`,
      to: applicantEmail,
      subject: template.subject,
      html: template.html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendStatusUpdateEmail,
  transporter
};
