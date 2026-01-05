-- Simple migration: add `active` and `is_active` columns to users and accomodations
-- This file does NOT query information_schema and therefore should not require extra permissions.
-- IMPORTANT: Backup your database before running any ALTER statements!
-- Run these statements in your MySQL client or via the mysql CLI.

-- Add columns to users
ALTER TABLE `users` ADD COLUMN `active` TINYINT(1) NOT NULL DEFAULT 1;
ALTER TABLE `users` ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1;

-- Add columns to accomodations
ALTER TABLE `accomodations` ADD COLUMN `active` TINYINT(1) NOT NULL DEFAULT 1;
ALTER TABLE `accomodations` ADD COLUMN `is_active` TINYINT(1) NOT NULL DEFAULT 1;


-- If any of these statements fail because the column already exists, you can ignore that error
-- or check existing columns with:
-- SHOW COLUMNS FROM `users` LIKE 'active';
-- SHOW COLUMNS FROM `accomodations` LIKE 'active';

-- After running, verify:
-- SELECT id, name, active, is_active FROM users LIMIT 10;
-- SELECT id, name, active, is_active FROM accomodations LIMIT 10;
