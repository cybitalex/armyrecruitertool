-- Migration: Add Station Commander Features
-- Created: 2025-11-23
-- Description: Adds stations table, role field to users, and station commander requests

-- Create stations table
CREATE TABLE IF NOT EXISTS stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  station_code TEXT NOT NULL UNIQUE,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  phone_number TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add role and stationId to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'recruiter',
  ADD COLUMN IF NOT EXISTS station_id UUID REFERENCES stations(id);

-- Create station_commander_requests table
CREATE TABLE IF NOT EXISTS station_commander_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requested_station_id UUID REFERENCES stations(id),
  justification TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_station_id ON users(station_id);
CREATE INDEX IF NOT EXISTS idx_station_commander_requests_status ON station_commander_requests(status);
CREATE INDEX IF NOT EXISTS idx_station_commander_requests_user_id ON station_commander_requests(user_id);

-- Insert a default station for testing
INSERT INTO stations (name, station_code, city, state)
VALUES ('Default Recruiting Station', 'DEFAULT-001', 'Atlanta', 'GA')
ON CONFLICT (station_code) DO NOTHING;

-- Create a comment for documentation
COMMENT ON TABLE stations IS 'Army recruiting stations';
COMMENT ON TABLE station_commander_requests IS 'Tracks station commander role requests requiring admin approval';
COMMENT ON COLUMN users.role IS 'User role: recruiter, station_commander, pending_station_commander, or admin';

