-- Migration 007: Remove Medical and Legal Field Requirements
-- These fields are no longer collected in the application form
-- Making them nullable for existing and future records

-- Make criminal_history nullable (was previously NOT NULL)
ALTER TABLE recruits ALTER COLUMN criminal_history DROP NOT NULL;

-- Add comment to document deprecation
COMMENT ON COLUMN recruits.medical_conditions IS 'DEPRECATED - No longer collected as of 2024. Field kept for historical data.';
COMMENT ON COLUMN recruits.criminal_history IS 'DEPRECATED - No longer collected as of 2024. Field kept for historical data.';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 007: Medical and legal fields are now optional';
  RAISE NOTICE '📋 criminal_history is now nullable';
  RAISE NOTICE '📋 Fields kept in database for historical records';
END $$;

