-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Nov 12, 2025 at 08:41 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `hris_earist`
--

-- --------------------------------------------------------

--
-- Table structure for table `applicant_form`
--

CREATE TABLE `applicant_form` (
  `id` int(11) NOT NULL,
  `joboffer_id` int(11) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(150) NOT NULL,
  `phone_number` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `resume` varchar(255) DEFAULT NULL,
  `status` enum('pending','exam','interview','approved','declined') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `certificates`
--

CREATE TABLE `certificates` (
  `id` int(11) NOT NULL,
  `registration_id` int(11) NOT NULL,
  `training_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `certificate_url` varchar(255) DEFAULT NULL,
  `generated_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `sent_at` timestamp NULL DEFAULT NULL,
  `status` enum('Generated','Sent','Failed') DEFAULT 'Generated',
  `certificate_data` longtext DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `college_department`
--

CREATE TABLE `college_department` (
  `id` int(11) NOT NULL,
  `department` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `college_department`
--

INSERT INTO `college_department` (`id`, `department`) VALUES
(1, 'College of Architecture and Fine Arts'),
(2, 'College of Arts and Sciences'),
(3, 'College of Business and Public Administration'),
(4, 'College of Computing Studies'),
(5, 'College of Criminal Justice Education'),
(6, 'College of Education'),
(7, 'College of Engineering'),
(8, 'College of Hospitality and Tourism Management'),
(9, 'College of Industrial Technology');

-- --------------------------------------------------------

--
-- Table structure for table `evaluation_form`
--

CREATE TABLE `evaluation_form` (
  `id` int(11) NOT NULL,
  `trnngreg_id` int(11) NOT NULL,
  `q1` enum('1','2','3','4','5') NOT NULL COMMENT '1 - Very Dissatisfied | 2 - Dissatisfied | 3 - Neutral | 4 - Satisfied | 5 - Very Satisfied',
  `q2` enum('1','2','3','4','5') NOT NULL COMMENT '1 - Very Dissatisfied | 2 - Dissatisfied | 3 - Neutral | 4 - Satisfied | 5 - Very Satisfied',
  `q3` enum('1','2','3','4','5') NOT NULL COMMENT '1 - Very Dissatisfied | 2 - Dissatisfied | 3 - Neutral | 4 - Satisfied | 5 - Very Satisfied',
  `q4` enum('1','2','3','4','5') NOT NULL COMMENT '1 - Very Dissatisfied | 2 - Dissatisfied | 3 - Neutral | 4 - Satisfied | 5 - Very Satisfied',
  `q5` enum('1','2','3','4','5') NOT NULL COMMENT '1 - Very Dissatisfied | 2 - Dissatisfied | 3 - Neutral | 4 - Satisfied | 5 - Very Satisfied',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_department`
--

CREATE TABLE `job_department` (
  `id` int(11) NOT NULL,
  `category` varchar(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `job_department`
--

INSERT INTO `job_department` (`id`, `category`) VALUES
(1, 'Administrative Staff'),
(2, 'Academic Faculty'),
(3, 'IT & Technical Support'),
(4, 'Facilities & Maintenance'),
(5, 'Finance & Accounting'),
(6, 'Student Support Services');

-- --------------------------------------------------------

--
-- Table structure for table `job_offerings`
--

CREATE TABLE `job_offerings` (
  `id` int(11) NOT NULL,
  `jbdprtmnt_id` int(11) NOT NULL,
  `job_title` varchar(150) NOT NULL,
  `location` varchar(150) NOT NULL,
  `employment_type` enum('Part-Time','Full-Time','Contractual','Temporary','Probationary','Internship') NOT NULL,
  `salary` decimal(10,2) DEFAULT 0.00,
  `description` text DEFAULT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `job_offerings`
--

INSERT INTO `job_offerings` (`id`, `jbdprtmnt_id`, `job_title`, `location`, `employment_type`, `salary`, `description`, `status`, `created_at`, `updated_at`) VALUES
(1, 1, 'Administrative Assistant', 'EARIST Manila', 'Full-Time', 28000.00, 'Provides clerical and administrative support to ensure efficient office operations. Handles correspondence, scheduling, and document filing.', 'Active', '2025-10-19 15:49:11', '2025-10-19 15:49:11'),
(2, 2, 'Instructor I – Information Technology Department', 'EARIST Manila', 'Full-Time', 25000.00, 'Teaches undergraduate IT courses, prepares lesson materials, and evaluates student performance in alignment with institutional standards.', 'Active', '2025-10-19 15:50:17', '2025-10-19 15:50:17'),
(3, 3, 'IT Support Specialist', 'EARIST Manila', 'Part-Time', 18000.00, 'Provides technical assistance to staff and faculty, troubleshoots computer and network issues, and maintains IT inventory.', 'Active', '2025-10-19 15:51:33', '2025-10-19 15:51:33'),
(4, 3, 'Web Developer', 'EARIST Manila', 'Full-Time', 32000.00, 'Develops and maintains the institution’s websites and online portals. Collaborates with departments to ensure functionality and security.', 'Inactive', '2025-10-19 15:52:25', '2025-11-04 01:27:29'),
(5, 3, 'Network Administrator', 'EARIST Manila', 'Full-Time', 30000.00, 'Manages network systems and servers, ensuring secure and reliable connectivity across all campus facilities.', 'Active', '2025-10-19 15:53:01', '2025-10-19 15:53:01'),
(6, 4, 'Building Maintenance Technician', 'EARIST Manila', 'Full-Time', 25000.00, 'Performs routine inspections, repairs, and maintenance of campus buildings and facilities to ensure safety and functionality.', 'Active', '2025-10-19 15:54:11', '2025-10-19 15:54:11'),
(7, 5, 'Accounting Clerk', 'EARIST Manila', 'Full-Time', 28000.00, 'Assists in preparing financial statements, processing transactions, and maintaining accurate financial records for audit and reporting.', 'Active', '2025-10-19 15:54:40', '2025-10-19 15:54:40'),
(8, 6, 'Guidance Counselor', 'EARIST Manila', 'Full-Time', 30000.00, 'Provides counseling and guidance to students, helping them address academic, personal, and career concerns.', 'Active', '2025-10-19 15:55:12', '2025-10-19 15:55:12'),
(9, 3, 'Systems Analyst', 'EARIST Manila', 'Full-Time', 27500.00, 'Analyzes, designs, and implements IT systems to improve institutional processes and data management.', 'Active', '2025-10-21 12:42:16', '2025-10-21 12:42:16');

-- --------------------------------------------------------

--
-- Table structure for table `notification_admin`
--

CREATE TABLE `notification_admin` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `trnngprog_id` int(11) DEFAULT NULL,
  `trnngreg_id` int(11) DEFAULT NULL,
  `applicant_id` int(11) DEFAULT NULL,
  `eval_id` int(11) DEFAULT NULL,
  `message` text NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notification_employee`
--

CREATE TABLE `notification_employee` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `trnngreg_id` int(11) DEFAULT NULL,
  `eval_id` int(11) DEFAULT NULL,
  `message` text NOT NULL,
  `timestamp` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `program_offerings`
--

CREATE TABLE `program_offerings` (
  `id` int(11) NOT NULL,
  `college_department_id` int(11) NOT NULL,
  `program` varchar(150) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `program_offerings`
--

INSERT INTO `program_offerings` (`id`, `college_department_id`, `program`) VALUES
(1, 1, 'Bachelor of Science in Architecture'),
(2, 1, 'Bachelor of Science in Interior Design'),
(3, 1, 'Bachelor of Fine Arts'),
(4, 2, 'Bachelor of Science in Psychology'),
(5, 2, 'Bachelor of Science in Applied Physics'),
(6, 2, 'Bachelor of Science in Mathematics'),
(7, 3, 'Bachelor of Science in Office Administration'),
(8, 3, 'Bachelor of Science in Business Administration'),
(9, 3, 'Bachelor of Science in Entrepreneurship'),
(10, 3, 'Bachelor in Public Administration'),
(11, 4, 'Bachelor of Science in Computer Science'),
(12, 4, 'Bachelor of Science in Information Technology'),
(13, 5, 'Bachelor of Science in Criminology'),
(14, 6, 'Bachelor of Secondary Education (BSE)'),
(15, 6, 'Bachelor of Special Needs Education (BSNEd)'),
(16, 6, 'Bachelor of Technology and Livelihood Education (BTLEd)'),
(17, 7, 'Bachelor of Science in Chemical Engineering'),
(18, 7, 'Bachelor of Science in Electrical Engineering'),
(19, 7, 'Bachelor of Science in Civil Engineering'),
(20, 7, 'Bachelor of Science in Mechanical Engineering'),
(21, 7, 'Bachelor of Science in Computer Engineering'),
(22, 7, 'Bachelor of Science in Electronics and Communication Engineering'),
(23, 8, 'Bachelor of Science in Tourism Management'),
(24, 8, 'Bachelor of Science in Hospitality Management'),
(25, 9, 'Bachelor of Science in Industrial Technology');

-- --------------------------------------------------------

--
-- Table structure for table `training_program`
--

CREATE TABLE `training_program` (
  `id` int(11) NOT NULL,
  `department_id` int(11) DEFAULT NULL,
  `employee_id` int(11) NOT NULL,
  `program_name` varchar(255) NOT NULL,
  `date` date NOT NULL,
  `time` time NOT NULL,
  `venue` varchar(255) DEFAULT NULL,
  `mode` enum('Face-to-Face','Online','Hybrid') NOT NULL,
  `instructor` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `upload_photo` varchar(255) DEFAULT NULL,
  `max_participants` int(11) DEFAULT NULL,
  `register_link` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `training_program`
--

INSERT INTO `training_program` (`id`, `department_id`, `employee_id`, `program_name`, `date`, `time`, `venue`, `mode`, `instructor`, `description`, `upload_photo`, `max_participants`, `register_link`, `created_at`, `updated_at`) VALUES
(1, 4, 1, 'Advanced Cybersecurity and Ethical Hacking', '2025-11-21', '10:30:00', 'Computer Lab 1 Room 301, College of Computing Studies', 'Face-to-Face', 'Engr. Michael Reyes, Certified Ethical Hacker (CEH)', '<p data-start=\"254\" data-end=\"617\">This advanced training program is designed to equip participants with in-depth knowledge of cybersecurity principles, ethical hacking techniques, and real-world defense strategies against cyber threats. It focuses on identifying vulnerabilities, performing penetration testing, and implementing robust security measures for institutional and enterprise systems.</p><p data-start=\"254\" data-end=\"617\"><br></p><strong data-start=\"623\" data-end=\"638\">Objectives:</strong><ul data-start=\"641\" data-end=\"957\"><li data-start=\"641\" data-end=\"722\"><p data-start=\"643\" data-end=\"722\">To enhance participants’ understanding of network and system vulnerabilities.</p></li><li data-start=\"723\" data-end=\"802\"><p data-start=\"725\" data-end=\"802\">To develop skills in ethical hacking and penetration testing methodologies.</p></li><li data-start=\"803\" data-end=\"874\"><p data-start=\"805\" data-end=\"874\">To strengthen digital forensics and incident response capabilities.</p></li><li data-start=\"875\" data-end=\"957\"><p data-start=\"877\" data-end=\"957\">To promote responsible cybersecurity practices aligned with ethical standards.</p></li></ul>', 'program/program_1760888268610_Cover_1.png', 10, '1', '2025-10-19 15:37:48', '2025-11-12 07:39:33'),
(2, NULL, 1, 'Professional Development and Team Building Workshop', '2025-11-15', '10:30:00', 'EARIST Main Campus – Multipurpose Hall', 'Face-to-Face', 'Human Resource Development Office (HRDO), EARIST', 'Participants will gain practical strategies to improve collaboration, communication, and productivity within their departments, contributing to a more cohesive institutional environment.<div><strong data-start=\"512\" data-end=\"526\"><br></strong></div><div><strong data-start=\"512\" data-end=\"526\">Objectives:</strong><ul data-start=\"527\" data-end=\"874\"><li data-start=\"527\" data-end=\"605\"><p data-start=\"529\" data-end=\"605\">To enhance employees’ communication, leadership, and collaboration skills.</p></li><li data-start=\"606\" data-end=\"696\"><p data-start=\"608\" data-end=\"696\">To foster teamwork and strengthen interpersonal relationships among staff and faculty.</p></li><li data-start=\"697\" data-end=\"788\"><p data-start=\"699\" data-end=\"788\">To develop problem-solving and decision-making abilities through team-based activities.</p></li><li data-start=\"789\" data-end=\"874\"><p data-start=\"791\" data-end=\"874\">To promote a positive and motivating work culture aligned with institutional goals.</p></li></ul></div>', 'program/program_1761049762645_Cover_3.png', 100, '1', '2025-10-21 12:29:22', '2025-11-12 07:37:59');

-- --------------------------------------------------------

--
-- Table structure for table `training_registration`
--

CREATE TABLE `training_registration` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `training_id` int(11) NOT NULL,
  `status` enum('Approved') DEFAULT 'Approved',
  `progress_status` enum('Not Started','In Progress','On Hold','Completed','Incomplete') DEFAULT 'Not Started',
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `completed_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `middle_name` varchar(50) DEFAULT NULL,
  `last_name` varchar(50) NOT NULL,
  `employee_id` varchar(20) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `position` enum('admin','employee') NOT NULL,
  `department_id` int(11) DEFAULT NULL,
  `program_id` int(11) DEFAULT NULL,
  `profile_picture` varchar(255) DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `first_name`, `middle_name`, `last_name`, `employee_id`, `email`, `password`, `position`, `department_id`, `program_id`, `profile_picture`, `status`, `created_at`, `updated_at`) VALUES
(1, 'Laurence Paul', 'Galvan', 'Quiniano', '2025-00001', 'quiniano.lp.bsinfotech@gmail.com', '$2a$10$YriqMgAE7HE3H8dKJGoeguKC84h7yX3Cn0YfALs9EltuXxQOPS60G', 'admin', NULL, NULL, '/uploads/profile/pp_1_1761794729106.png', 'active', '2025-10-19 17:12:16', '2025-11-07 19:25:51'),
(2, 'Raven', 'De Leon', 'Baliciado', '2025-00002', 'baliciado.r.bsinfotech@gmail.com', '$2a$10$Nq9IgnEm.G/WDeowLIfx.uFhJcrw3.jLrVneG8iqL7Y1H0t0aoqLu', 'employee', 4, 12, '/uploads/profile/pp_2_1762513194820.jpg', 'active', '2025-10-19 23:31:40', '2025-11-07 18:59:54'),
(3, 'Nikki', 'NA', 'De Guzman', '2025-00003', 'deguzman.n.bsinfotech@gmail.com', '$2a$10$xyhhOclZIxz0fQ5fadRzuO2pZdnG7W8QUL8fkEVkmP.9VN/hOQOzC', 'employee', 4, 12, NULL, 'active', '2025-10-19 23:32:40', '2025-11-04 00:05:29'),
(4, 'Ericka Anne', 'Tugas', 'Yang', '2025-00004', 'yang.ea.bsinfotech@gmail.com', '$2a$10$Ftg/9zdkRB8qde54rGj4OO7plXYUvpun/Nr46g4cSjPgeZ.TIjEMK', 'employee', 4, 11, NULL, 'active', '2025-10-19 23:33:29', '2025-11-05 15:46:08');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `applicant_form`
--
ALTER TABLE `applicant_form`
  ADD PRIMARY KEY (`id`),
  ADD KEY `joboffer_id` (`joboffer_id`);

--
-- Indexes for table `certificates`
--
ALTER TABLE `certificates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `registration_id` (`registration_id`),
  ADD KEY `training_id` (`training_id`),
  ADD KEY `user_id` (`user_id`);

--
-- Indexes for table `college_department`
--
ALTER TABLE `college_department`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `evaluation_form`
--
ALTER TABLE `evaluation_form`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_eval_trainingreg` (`trnngreg_id`);

--
-- Indexes for table `job_department`
--
ALTER TABLE `job_department`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `job_offerings`
--
ALTER TABLE `job_offerings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_job_department` (`jbdprtmnt_id`);

--
-- Indexes for table `notification_admin`
--
ALTER TABLE `notification_admin`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_notificationadmin_user` (`user_id`),
  ADD KEY `fk_notificationadmin_trainingprogram` (`trnngprog_id`),
  ADD KEY `fk_notificationadmin_trainingregistration` (`trnngreg_id`),
  ADD KEY `fk_notificationadmin_applicant` (`applicant_id`),
  ADD KEY `fk_notificationadmin_evaluation` (`eval_id`);

--
-- Indexes for table `notification_employee`
--
ALTER TABLE `notification_employee`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_notificationemp_user` (`user_id`),
  ADD KEY `fk_notificationemp_trainingregistration` (`trnngreg_id`),
  ADD KEY `fk_notificationemp_evaluation` (`eval_id`);

--
-- Indexes for table `program_offerings`
--
ALTER TABLE `program_offerings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `college_department_id` (`college_department_id`);

--
-- Indexes for table `training_program`
--
ALTER TABLE `training_program`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_employee` (`employee_id`),
  ADD KEY `fk_training_department` (`department_id`);

--
-- Indexes for table `training_registration`
--
ALTER TABLE `training_registration`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_user` (`user_id`),
  ADD KEY `fk_training` (`training_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `employee_id` (`employee_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `department_id` (`department_id`),
  ADD KEY `program_id` (`program_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `applicant_form`
--
ALTER TABLE `applicant_form`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `certificates`
--
ALTER TABLE `certificates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `college_department`
--
ALTER TABLE `college_department`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `evaluation_form`
--
ALTER TABLE `evaluation_form`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `job_department`
--
ALTER TABLE `job_department`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `job_offerings`
--
ALTER TABLE `job_offerings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `notification_admin`
--
ALTER TABLE `notification_admin`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `notification_employee`
--
ALTER TABLE `notification_employee`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `program_offerings`
--
ALTER TABLE `program_offerings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=26;

--
-- AUTO_INCREMENT for table `training_program`
--
ALTER TABLE `training_program`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `training_registration`
--
ALTER TABLE `training_registration`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `applicant_form`
--
ALTER TABLE `applicant_form`
  ADD CONSTRAINT `applicant_form_ibfk_1` FOREIGN KEY (`joboffer_id`) REFERENCES `job_offerings` (`id`);

--
-- Constraints for table `certificates`
--
ALTER TABLE `certificates`
  ADD CONSTRAINT `certificates_ibfk_1` FOREIGN KEY (`registration_id`) REFERENCES `training_registration` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `certificates_ibfk_2` FOREIGN KEY (`training_id`) REFERENCES `training_program` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `certificates_ibfk_3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `evaluation_form`
--
ALTER TABLE `evaluation_form`
  ADD CONSTRAINT `fk_eval_trainingreg` FOREIGN KEY (`trnngreg_id`) REFERENCES `training_registration` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `job_offerings`
--
ALTER TABLE `job_offerings`
  ADD CONSTRAINT `fk_job_department` FOREIGN KEY (`jbdprtmnt_id`) REFERENCES `job_department` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `program_offerings`
--
ALTER TABLE `program_offerings`
  ADD CONSTRAINT `program_offerings_ibfk_1` FOREIGN KEY (`college_department_id`) REFERENCES `college_department` (`id`);

--
-- Constraints for table `training_program`
--
ALTER TABLE `training_program`
  ADD CONSTRAINT `fk_employee` FOREIGN KEY (`employee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_training_department` FOREIGN KEY (`department_id`) REFERENCES `college_department` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `training_registration`
--
ALTER TABLE `training_registration`
  ADD CONSTRAINT `fk_training` FOREIGN KEY (`training_id`) REFERENCES `training_program` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`department_id`) REFERENCES `college_department` (`id`),
  ADD CONSTRAINT `users_ibfk_2` FOREIGN KEY (`program_id`) REFERENCES `program_offerings` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
