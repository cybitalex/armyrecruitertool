-- Migration 006: Add QR Code Scan Tracking
-- This migration adds tracking for QR code scans (page visits) separate from applications
-- Allows tracking conversion rates and scan analytics

-- Create qr_scans table
CREATE TABLE IF NOT EXISTS qr_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  qr_code TEXT NOT NULL,
  scan_type TEXT NOT NULL DEFAULT 'application', -- 'application' or 'survey'
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  converted_to_application BOOLEAN DEFAULT FALSE,
  application_id UUID REFERENCES recruits(id) ON DELETE SET NULL,
  scanned_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_qr_scans_recruiter_id ON qr_scans (recruiter_id);
CREATE INDEX IF NOT EXISTS idx_qr_scans_qr_code ON qr_scans (qr_code);
CREATE INDEX IF NOT EXISTS idx_qr_scans_scanned_at ON qr_scans (scanned_at);
CREATE INDEX IF NOT EXISTS idx_qr_scans_scan_type ON qr_scans (scan_type);
CREATE INDEX IF NOT EXISTS idx_qr_scans_converted ON qr_scans (converted_to_application);

-- Add comments for documentation
COMMENT ON TABLE qr_scans IS 'Tracks every QR code scan (page visit) to measure conversion rates';
COMMENT ON COLUMN qr_scans.scan_type IS 'Type of scan: application (main form) or survey (presentation feedback)';
COMMENT ON COLUMN qr_scans.converted_to_application IS 'TRUE if the scan resulted in a completed application submission';
COMMENT ON COLUMN qr_scans.application_id IS 'Links to the application if user completed submission';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON qr_scans TO armyrecruiter;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 006: QR scan tracking table created successfully';
  RAISE NOTICE '📊 Recruiters can now track:';
  RAISE NOTICE '   - Total QR code scans (page visits)';
  RAISE NOTICE '   - Scans that converted to applications';
  RAISE NOTICE '   - Conversion rate percentage';
  RAISE NOTICE '   - Scan timestamps and analytics';
END $$;

