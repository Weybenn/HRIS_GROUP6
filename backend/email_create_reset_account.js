const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
});

/**
 * Send password reset notification email
 */
async function sendPasswordResetEmail(userEmail, userName, employeeId, newPassword) {
  const mailOptions = {
    from: `"EARIST HRIS" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: 'Password Reset Confirmation - EARIST HRIS',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #6D2323; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #6D2323; margin: 0;">EARIST HRIS</h1>
          <p style="color: #666; margin: 5px 0;">Human Resource Information System</p>
        </div>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0;">Password Reset Confirmation</h2>
          <p style="color: #666; line-height: 1.6;">
            Dear ${userName},
          </p>
          <p style="color: #666; line-height: 1.6;">
            Your password has been successfully reset by an administrator. Please use the following credentials to log in:
          </p>
          
          <div style="background-color: #fff; border: 2px solid #6D2323; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <div style="margin-bottom: 12px;">
              <strong style="color: #6D2323;">Employee ID:</strong>
              <div style="font-size: 18px; font-weight: bold; color: #333; margin-top: 4px;">${employeeId}</div>
            </div>
            <div>
              <strong style="color: #6D2323;">New Password:</strong>
              <div style="font-size: 18px; font-weight: bold; color: #333; margin-top: 4px; font-family: 'Courier New', monospace; letter-spacing: 2px;">${newPassword}</div>
            </div>
          </div>
          
          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="color: #856404; font-size: 14px; line-height: 1.6; margin: 0;">
              <strong>Important Security Notice:</strong> For your security, please change your password after logging in. Do not share your password with anyone.
            </p>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0;">
            If you did not request this password reset, please contact your system administrator immediately.
          </p>
        </div>
        
        <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 20px;">
          <p style="color: #999; font-size: 12px; margin: 5px 0; line-height: 1.5;">
            This is an automated message from the EARIST Human Resource Information System. Please do not reply to this email.
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Password reset email sent successfully to ${userEmail}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send account creation notification email
 */
async function sendAccountCreationEmail(userEmail, userName, employeeId, password) {
  const mailOptions = {
    from: `"EARIST HRIS" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: 'Welcome to EARIST HRIS - Your Account Has Been Created',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 2px solid #6D2323; border-radius: 10px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #6D2323; margin: 0;">EARIST HRIS</h1>
          <p style="color: #666; margin: 5px 0;">Human Resource Information System</p>
        </div>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0;">Welcome to EARIST HRIS!</h2>
          <p style="color: #666; line-height: 1.6;">
            Dear ${userName},
          </p>
          <p style="color: #666; line-height: 1.6;">
            Your account has been successfully created in the EARIST Human Resource Information System. You can now access the system using the following credentials:
          </p>
          
          <div style="background-color: #fff; border: 2px solid #6D2323; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <div style="margin-bottom: 12px;">
              <strong style="color: #6D2323;">Username (Employee ID):</strong>
              <div style="font-size: 18px; font-weight: bold; color: #333; margin-top: 4px;">${employeeId}</div>
            </div>
            <div>
              <strong style="color: #6D2323;">Password:</strong>
              <div style="font-size: 18px; font-weight: bold; color: #333; margin-top: 4px; font-family: 'Courier New', monospace; letter-spacing: 2px;">${password}</div>
            </div>
          </div>
          
          <div style="background-color: #d1ecf1; border-left: 4px solid #0c5460; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="color: #0c5460; font-size: 14px; line-height: 1.6; margin: 0;">
              <strong>Next Steps:</strong> Please log in to the system and change your password for security purposes. You can access the system at the login page.
            </p>
          </div>
          
          <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="color: #856404; font-size: 14px; line-height: 1.6; margin: 0;">
              <strong>Security Reminder:</strong> Keep your login credentials confidential. Do not share your password with anyone.
            </p>
          </div>
          
          <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0;">
            If you have any questions or need assistance, please contact the HR department.
          </p>
        </div>
        
        <div style="border-top: 1px solid #ddd; padding-top: 20px; margin-top: 20px;">
          <p style="color: #999; font-size: 12px; margin: 5px 0; line-height: 1.5;">
            This is an automated message from the EARIST Human Resource Information System. Please do not reply to this email.
          </p>
        </div>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Account creation email sent successfully to ${userEmail}`);
    return { success: true };
  } catch (error) {
    console.error('Error sending account creation email:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendPasswordResetEmail,
  sendAccountCreationEmail,
  transporter
};

