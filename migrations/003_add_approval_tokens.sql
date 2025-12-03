-- Migration: Add Approval Tokens for Email-Based Approval
-- Created: 2025-11-23
-- Description: Adds token-based approval system for station commander requests

-- Add token columns to station_commander_requests
ALTER TABLE station_commander_requests 
  ADD COLUMN IF NOT EXISTS approval_token TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS token_expires TIMESTAMP;

-- Create index for token lookups
CREATE INDEX IF NOT EXISTS idx_station_commander_requests_token ON station_commander_requests(approval_token);

COMMENT ON COLUMN station_commander_requests.approval_token IS 'Unique token for email-based approval link';
COMMENT ON COLUMN station_commander_requests.token_expires IS 'Token expiration timestamp (7 days from creation)';

