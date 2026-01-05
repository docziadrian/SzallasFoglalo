-- Migration: add active and is_active flags to users and accomodations (idempotent)
-- This script will add the columns only if they don't already exist and will try to
-- keep values in sync (set is_active = active if the latter exists).

-- NOTE: Run this on the target database used by the BackEnd (e.g. via mysql CLI or your DB GUI).

-- Add columns to `users` if missing
SELECT COUNT(*) INTO @c FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'active';
SET @sql = IF(@c = 0, 'ALTER TABLE users ADD COLUMN active TINYINT(1) NOT NULL DEFAULT 1', 'SELECT "users.active_exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT COUNT(*) INTO @c FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'is_active';
SET @sql = IF(@c = 0, 'ALTER TABLE users ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1', 'SELECT "users.is_active_exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Sync values (if active exists and is_active was just created)
UPDATE users SET is_active = active WHERE is_active IS NULL AND (active IS NOT NULL);

-- Add columns to `accomodations` if missing
SELECT COUNT(*) INTO @c FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'accomodations' AND COLUMN_NAME = 'active';
SET @sql = IF(@c = 0, 'ALTER TABLE accomodations ADD COLUMN active TINYINT(1) NOT NULL DEFAULT 1', 'SELECT "accomodations.active_exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT COUNT(*) INTO @c FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'accomodations' AND COLUMN_NAME = 'is_active';
SET @sql = IF(@c = 0, 'ALTER TABLE accomodations ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1', 'SELECT "accomodations.is_active_exists"');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Sync values
UPDATE accomodations SET is_active = active WHERE is_active IS NULL AND (active IS NOT NULL);

-- Verification queries (optional):
-- SELECT id, name, active, is_active FROM users LIMIT 10;
-- SELECT id, name, active, is_active FROM accomodations LIMIT 10;

-- If your MySQL version does NOT allow prepared statements in this context, run the following
-- ALTER statements manually (one by one) if needed:
-- ALTER TABLE users ADD COLUMN active TINYINT(1) NOT NULL DEFAULT 1;
-- ALTER TABLE users ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1;
-- ALTER TABLE accomodations ADD COLUMN active TINYINT(1) NOT NULL DEFAULT 1;
-- ALTER TABLE accomodations ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1;
