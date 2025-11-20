-- Migration: Add read column to notification_admin table
-- This migration adds a read column to track whether notifications have been read

ALTER TABLE `notification_admin` 
ADD COLUMN `read` TINYINT(1) NOT NULL DEFAULT 0 
AFTER `timestamp`;

-- Update existing notifications to be marked as unread (0)
UPDATE `notification_admin` SET `read` = 0 WHERE `read` IS NULL;

-- Optional: Add index for better query performance when filtering by read status
-- CREATE INDEX `idx_notification_admin_read` ON `notification_admin` (`read`);

