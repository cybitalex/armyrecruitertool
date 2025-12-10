-- Migration 011: Make Height and Weight Fields Nullable
-- These fields are deprecated and no longer collected in the application form
-- Making them nullable to fix database constraint violations

-- Make height and weight fields nullable (they were previously NOT NULL)
ALTER TABLE recruits ALTER COLUMN height_feet DROP NOT NULL;
ALTER TABLE recruits ALTER COLUMN height_inches DROP NOT NULL;
ALTER TABLE recruits ALTER COLUMN weight DROP NOT NULL;

-- Add comments to document deprecation
COMMENT ON COLUMN recruits.height_feet IS 'DEPRECATED - No longer collected. Field kept for historical data.';
COMMENT ON COLUMN recruits.height_inches IS 'DEPRECATED - No longer collected. Field kept for historical data.';
COMMENT ON COLUMN recruits.weight IS 'DEPRECATED - No longer collected. Field kept for historical data.';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 011: Height and weight fields are now nullable';
  RAISE NOTICE '📋 height_feet, height_inches, and weight are now optional';
  RAISE NOTICE '📋 Fields kept in database for historical records';
END $$;

