-- Migration 012: Add approximate IP geolocation fields to qr_scans
-- Stores non-precise location metadata (city/region/country) without browser geolocation prompts

ALTER TABLE qr_scans
  ADD COLUMN IF NOT EXISTS scan_country TEXT,
  ADD COLUMN IF NOT EXISTS scan_region TEXT,
  ADD COLUMN IF NOT EXISTS scan_city TEXT,
  ADD COLUMN IF NOT EXISTS scan_latitude TEXT,
  ADD COLUMN IF NOT EXISTS scan_longitude TEXT,
  ADD COLUMN IF NOT EXISTS scan_timezone TEXT,
  ADD COLUMN IF NOT EXISTS scan_isp TEXT;

COMMENT ON COLUMN qr_scans.scan_country IS 'Approximate country resolved from scanner IP address';
COMMENT ON COLUMN qr_scans.scan_region IS 'Approximate state/region resolved from scanner IP address';
COMMENT ON COLUMN qr_scans.scan_city IS 'Approximate city resolved from scanner IP address';
COMMENT ON COLUMN qr_scans.scan_latitude IS 'Approximate latitude resolved from scanner IP address';
COMMENT ON COLUMN qr_scans.scan_longitude IS 'Approximate longitude resolved from scanner IP address';
COMMENT ON COLUMN qr_scans.scan_timezone IS 'Approximate timezone resolved from scanner IP address';
COMMENT ON COLUMN qr_scans.scan_isp IS 'Approximate ISP/network resolved from scanner IP address';

DO $$
BEGIN
  RAISE NOTICE 'Migration 012: Added approximate location fields to qr_scans';
END $$;
