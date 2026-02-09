-- Add suggested_mos field to recruits table
-- Stores AI-generated MOS suggestions as JSON

ALTER TABLE recruits 
ADD COLUMN IF NOT EXISTS suggested_mos TEXT;

-- Add comment for documentation
COMMENT ON COLUMN recruits.suggested_mos IS 'AI-generated MOS suggestions stored as JSON array';
