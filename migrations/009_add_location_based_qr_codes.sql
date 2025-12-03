-- Migration 009: Add Location-Based QR Codes
-- This migration adds support for location-labeled QR codes that users can generate on-demand
-- Each location QR code is unique and tracks where scans occurred

-- Create qr_code_locations table
CREATE TABLE IF NOT EXISTS qr_code_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  location_label TEXT NOT NULL, -- User-provided label like "High School Career Fair", "Mall Kiosk", etc.
  qr_code TEXT NOT NULL UNIQUE, -- Unique QR code identifier for this location
  qr_type TEXT NOT NULL DEFAULT 'application', -- 'application' or 'survey'
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_qr_code_locations_recruiter_id ON qr_code_locations (recruiter_id);
CREATE INDEX IF NOT EXISTS idx_qr_code_locations_qr_code ON qr_code_locations (qr_code);
CREATE INDEX IF NOT EXISTS idx_qr_code_locations_qr_type ON qr_code_locations (qr_type);

-- Add location_qr_code_id to qr_scans table to track which QR was scanned
ALTER TABLE qr_scans 
ADD COLUMN IF NOT EXISTS location_qr_code_id UUID REFERENCES qr_code_locations(id) ON DELETE SET NULL;

-- Create index for location QR code lookups
CREATE INDEX IF NOT EXISTS idx_qr_scans_location_qr_code_id ON qr_scans (location_qr_code_id);

-- Add comments for documentation
COMMENT ON TABLE qr_code_locations IS 'Location-based QR codes that users generate on-demand with custom labels';
COMMENT ON COLUMN qr_code_locations.location_label IS 'User-provided label describing where this QR code is used';
COMMENT ON COLUMN qr_code_locations.qr_code IS 'Unique QR code identifier (different from user default QR code)';
COMMENT ON COLUMN qr_scans.location_qr_code_id IS 'If set, indicates this scan was from a location-based QR code (not the default)';

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON qr_code_locations TO armyrecruiter;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration 009: Location-based QR codes table created successfully';
  RAISE NOTICE '📊 Users can now:';
  RAISE NOTICE '   - Generate QR codes with custom location labels';
  RAISE NOTICE '   - Track where QR codes are being scanned';
  RAISE NOTICE '   - See analytics by location in dashboard';
END $$;


