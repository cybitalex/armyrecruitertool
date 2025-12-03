-- Migration 010: Add survey conversion tracking to qr_scans
-- Adds ability to mark survey QR scans as converted once a survey is submitted

ALTER TABLE qr_scans
  ADD COLUMN IF NOT EXISTS converted_to_survey BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS survey_response_id UUID REFERENCES qr_survey_responses(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_qr_scans_survey_response_id ON qr_scans (survey_response_id);

COMMENT ON COLUMN qr_scans.converted_to_survey IS 'TRUE if a survey scan resulted in a submitted survey response';
COMMENT ON COLUMN qr_scans.survey_response_id IS 'Links to the survey response if the scan converted to a survey';

DO $$
BEGIN
  RAISE NOTICE '✅ Migration 010: Survey conversion tracking columns added to qr_scans';
END $$;
