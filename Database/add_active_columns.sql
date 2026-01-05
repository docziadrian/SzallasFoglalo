
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS active TINYINT(1) NOT NULL DEFAULT 1;

ALTER TABLE accomodations
  ADD COLUMN IF NOT EXISTS active TINYINT(1) NOT NULL DEFAULT 1;


-- This file is superseded by add_active_and_is_active_columns.sql which adds both
-- `active` and `is_active` columns and is safer to run:
-- Please run: add_active_and_is_active_columns.sql

-- If you prefer a quick manual command, run (one-line per statement):
-- ALTER TABLE users ADD COLUMN active TINYINT(1) NOT NULL DEFAULT 1;
-- ALTER TABLE users ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1;
-- ALTER TABLE accomodations ADD COLUMN active TINYINT(1) NOT NULL DEFAULT 1;
-- ALTER TABLE accomodations ADD COLUMN is_active TINYINT(1) NOT NULL DEFAULT 1;
