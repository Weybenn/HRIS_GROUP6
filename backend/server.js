const express = require('express');
require('dotenv').config();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const viewUsersRouter = require('./view_users');
const updateProfileRouter = require('./update_profile');
const changePasswordRouter = require('./change_password');
const updateUserRouter = require('./update_user');
const resetPasswordRouter = require('./reset_password');
const forgotPasswordRouter = require('./forgot_password');
const homeRouter = require('./home');
const trainingRegistrationRouter = require('./training_registration');
const jobPostingRouter = require('./job_posting');
const applicantRouter = require('./applicant');
const evaluationRouter = require('./evaluation');
const { router: notificationRouter } = require('./notification');
const { router: loginRouter } = require('./login');
const { router: createAccountRouter } = require('./create_account');
const { router: trainingProgramRouter } = require('./training_program');
const { router: employeeProfileRouter } = require('./employee_profile');
const { router: registrationManagementRouter } = require('./registration_management');
const { router: trainingManagementRouter, startAutoStartJob } = require('./training_progress');
const certificatesRouter = require('./certificates');

const app = express();
const PORT = 5000;

app.set('trust proxy', true);

app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cache-Control']
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api', viewUsersRouter);
app.use('/api', updateProfileRouter);
app.use('/api', changePasswordRouter);
app.use('/api', updateUserRouter);
app.use('/api', resetPasswordRouter);
app.use('/api', forgotPasswordRouter);
app.use('/api', homeRouter);
app.use('/api/training', trainingRegistrationRouter);
app.use('/api/evaluation', evaluationRouter);
app.use('/api', notificationRouter);
app.use('/', jobPostingRouter);
app.use('/applicants', applicantRouter);
app.use('/', loginRouter);
app.use('/', createAccountRouter);
app.use('/', trainingProgramRouter);
app.use('/', employeeProfileRouter);
app.use('/', registrationManagementRouter);
app.use('/', trainingManagementRouter);
app.use('/certificates', certificatesRouter);

startAutoStartJob();

app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📡 Real-time notifications enabled via Server-Sent Events`);
  console.log(`🔗 CORS configured for localhost:3000 and localhost:5173`);
});
