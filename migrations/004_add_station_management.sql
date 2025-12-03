-- Migration 004: Add station management features
-- Creates station_change_requests table and populates state-based stations

-- Create station_change_requests table
CREATE TABLE IF NOT EXISTS station_change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  current_station_id UUID REFERENCES stations(id),
  requested_station_id UUID NOT NULL REFERENCES stations(id),
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_station_change_requests_user_id ON station_change_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_station_change_requests_status ON station_change_requests(status);

-- Insert state-based recruiting stations
INSERT INTO stations (name, station_code, state) VALUES
  -- Northeast
  ('New York City Recruiting Station', '1G1A', 'New York'),
  ('New Jersey Recruiting Station', '2A1B', 'New Jersey'),
  ('Pennsylvania Recruiting Station', '2B1C', 'Pennsylvania'),
  ('Massachusetts Recruiting Station', '2C1D', 'Massachusetts'),
  ('Connecticut Recruiting Station', '2D1E', 'Connecticut'),
  ('Rhode Island Recruiting Station', '2E1F', 'Rhode Island'),
  ('Vermont Recruiting Station', '2F1G', 'Vermont'),
  ('New Hampshire Recruiting Station', '2G1H', 'New Hampshire'),
  ('Maine Recruiting Station', '2H1I', 'Maine'),
  
  -- Southeast
  ('Florida Recruiting Station', '3A2A', 'Florida'),
  ('Georgia Recruiting Station', '3B2B', 'Georgia'),
  ('North Carolina Recruiting Station', '3C2C', 'North Carolina'),
  ('South Carolina Recruiting Station', '3D2D', 'South Carolina'),
  ('Virginia Recruiting Station', '3E2E', 'Virginia'),
  ('West Virginia Recruiting Station', '3F2F', 'West Virginia'),
  ('Maryland Recruiting Station', '3G2G', 'Maryland'),
  ('Delaware Recruiting Station', '3H2H', 'Delaware'),
  
  -- Midwest
  ('Illinois Recruiting Station', '4A3A', 'Illinois'),
  ('Ohio Recruiting Station', '4B3B', 'Ohio'),
  ('Michigan Recruiting Station', '4C3C', 'Michigan'),
  ('Indiana Recruiting Station', '4D3D', 'Indiana'),
  ('Wisconsin Recruiting Station', '4E3E', 'Wisconsin'),
  ('Minnesota Recruiting Station', '4F3F', 'Minnesota'),
  ('Iowa Recruiting Station', '4G3G', 'Iowa'),
  ('Missouri Recruiting Station', '4H3H', 'Missouri'),
  ('Kansas Recruiting Station', '4I3I', 'Kansas'),
  ('Nebraska Recruiting Station', '4J3J', 'Nebraska'),
  ('North Dakota Recruiting Station', '4K3K', 'North Dakota'),
  ('South Dakota Recruiting Station', '4L3L', 'South Dakota'),
  
  -- South
  ('Texas Recruiting Station', '5A4A', 'Texas'),
  ('Oklahoma Recruiting Station', '5B4B', 'Oklahoma'),
  ('Arkansas Recruiting Station', '5C4C', 'Arkansas'),
  ('Louisiana Recruiting Station', '5D4D', 'Louisiana'),
  ('Mississippi Recruiting Station', '5E4E', 'Mississippi'),
  ('Alabama Recruiting Station', '5F4F', 'Alabama'),
  ('Tennessee Recruiting Station', '5G4G', 'Tennessee'),
  ('Kentucky Recruiting Station', '5H4H', 'Kentucky'),
  
  -- West
  ('California Recruiting Station', '6A5A', 'California'),
  ('Washington Recruiting Station', '6B5B', 'Washington'),
  ('Oregon Recruiting Station', '6C5C', 'Oregon'),
  ('Nevada Recruiting Station', '6D5D', 'Nevada'),
  ('Arizona Recruiting Station', '6E5E', 'Arizona'),
  ('New Mexico Recruiting Station', '6F5F', 'New Mexico'),
  ('Colorado Recruiting Station', '6G5G', 'Colorado'),
  ('Utah Recruiting Station', '6H5H', 'Utah'),
  ('Idaho Recruiting Station', '6I5I', 'Idaho'),
  ('Montana Recruiting Station', '6J5J', 'Montana'),
  ('Wyoming Recruiting Station', '6K5K', 'Wyoming'),
  
  -- Pacific
  ('Alaska Recruiting Station', '7A6A', 'Alaska'),
  ('Hawaii Recruiting Station', '7B6B', 'Hawaii')
ON CONFLICT (station_code) DO NOTHING;

-- Assign NYC station to admin user (moran.alex@icloud.com)
UPDATE users 
SET station_id = (SELECT id FROM stations WHERE station_code = '1G1A')
WHERE email = 'moran.alex@icloud.com' AND station_id IS NULL;

-- Randomly assign stations to existing users who don't have one
-- This uses a random station from the available stations
WITH random_assignments AS (
  SELECT 
    u.id as user_id,
    s.id as station_id,
    ROW_NUMBER() OVER (PARTITION BY u.id ORDER BY random()) as rn
  FROM users u
  CROSS JOIN stations s
  WHERE u.station_id IS NULL
)
UPDATE users
SET station_id = ra.station_id
FROM random_assignments ra
WHERE users.id = ra.user_id AND ra.rn = 1;

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Migration 004 completed: Added station management features';
  RAISE NOTICE 'Created station_change_requests table';
  RAISE NOTICE 'Inserted % state-based stations', (SELECT COUNT(*) FROM stations);
  RAISE NOTICE 'Assigned stations to % users', (SELECT COUNT(*) FROM users WHERE station_id IS NOT NULL);
END $$;

