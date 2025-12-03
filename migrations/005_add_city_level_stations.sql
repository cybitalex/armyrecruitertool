-- Migration 005: Add City-Level Recruiting Stations
-- Replaces state-level stations with 215 major city stations
-- Reassigns existing users to city-level stations

-- Step 1: Clear existing state-level stations
DELETE FROM station_change_requests;
DELETE FROM station_commander_requests WHERE requested_station_id IS NOT NULL;
UPDATE users SET station_id = NULL;
DELETE FROM stations;

-- Step 2: Insert 215 major city recruiting stations
-- NEW YORK (10 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('1G1A', 'Manhattan Recruiting Station', 'Manhattan', 'New York', '10001'),
('1G2B', 'Brooklyn Recruiting Station', 'Brooklyn', 'New York', '11201'),
('1G3Q', 'Queens Recruiting Station', 'Queens', 'New York', '11354'),
('1G4X', 'Bronx Recruiting Station', 'Bronx', 'New York', '10451'),
('1G5S', 'Staten Island Recruiting Station', 'Staten Island', 'New York', '10301'),
('1H1B', 'Buffalo Recruiting Station', 'Buffalo', 'New York', '14202'),
('1H2R', 'Rochester Recruiting Station', 'Rochester', 'New York', '14604'),
('1H3S', 'Syracuse Recruiting Station', 'Syracuse', 'New York', '13202'),
('1H4A', 'Albany Recruiting Station', 'Albany', 'New York', '12207'),
('1G6Y', 'Yonkers Recruiting Station', 'Yonkers', 'New York', '10701');

-- CALIFORNIA (13 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('6A1L', 'Los Angeles Downtown Recruiting Station', 'Los Angeles', 'California', '90012'),
('6A2H', 'Los Angeles Hollywood Recruiting Station', 'Los Angeles', 'California', '90028'),
('6B1S', 'San Diego Recruiting Station', 'San Diego', 'California', '92101'),
('6C1J', 'San Jose Recruiting Station', 'San Jose', 'California', '95110'),
('6C2F', 'San Francisco Recruiting Station', 'San Francisco', 'California', '94102'),
('6D1F', 'Fresno Recruiting Station', 'Fresno', 'California', '93721'),
('6D2S', 'Sacramento Recruiting Station', 'Sacramento', 'California', '95814'),
('6A3L', 'Long Beach Recruiting Station', 'Long Beach', 'California', '90802'),
('6C3O', 'Oakland Recruiting Station', 'Oakland', 'California', '94612'),
('6D3B', 'Bakersfield Recruiting Station', 'Bakersfield', 'California', '93301'),
('6A4A', 'Anaheim Recruiting Station', 'Anaheim', 'California', '92805'),
('6E1R', 'Riverside Recruiting Station', 'Riverside', 'California', '92501'),
('6D4S', 'Stockton Recruiting Station', 'Stockton', 'California', '95202');

-- TEXAS (12 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('5A1H', 'Houston Downtown Recruiting Station', 'Houston', 'Texas', '77002'),
('5A2H', 'Houston Galleria Recruiting Station', 'Houston', 'Texas', '77056'),
('5B1S', 'San Antonio Recruiting Station', 'San Antonio', 'Texas', '78205'),
('5C1D', 'Dallas Downtown Recruiting Station', 'Dallas', 'Texas', '75201'),
('5C2D', 'Dallas North Recruiting Station', 'Dallas', 'Texas', '75248'),
('5D1A', 'Austin Recruiting Station', 'Austin', 'Texas', '78701'),
('5C3F', 'Fort Worth Recruiting Station', 'Fort Worth', 'Texas', '76102'),
('5E1E', 'El Paso Recruiting Station', 'El Paso', 'Texas', '79901'),
('5C4A', 'Arlington Recruiting Station', 'Arlington', 'Texas', '76010'),
('5B2C', 'Corpus Christi Recruiting Station', 'Corpus Christi', 'Texas', '78401'),
('5C5P', 'Plano Recruiting Station', 'Plano', 'Texas', '75074'),
('5F1L', 'Laredo Recruiting Station', 'Laredo', 'Texas', '78040');

-- FLORIDA (10 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('3A1M', 'Miami Recruiting Station', 'Miami', 'Florida', '33130'),
('3A2M', 'Miami Beach Recruiting Station', 'Miami', 'Florida', '33139'),
('3B1T', 'Tampa Recruiting Station', 'Tampa', 'Florida', '33602'),
('3C1O', 'Orlando Recruiting Station', 'Orlando', 'Florida', '32801'),
('3D1J', 'Jacksonville Recruiting Station', 'Jacksonville', 'Florida', '32202'),
('3A3F', 'Fort Lauderdale Recruiting Station', 'Fort Lauderdale', 'Florida', '33301'),
('3B2S', 'St. Petersburg Recruiting Station', 'St. Petersburg', 'Florida', '33701'),
('3D2T', 'Tallahassee Recruiting Station', 'Tallahassee', 'Florida', '32301'),
('3E1C', 'Cape Coral Recruiting Station', 'Cape Coral', 'Florida', '33990'),
('3A4P', 'Pembroke Pines Recruiting Station', 'Pembroke Pines', 'Florida', '33024');

-- ILLINOIS (8 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('4A1C', 'Chicago Downtown Recruiting Station', 'Chicago', 'Illinois', '60601'),
('4A2C', 'Chicago South Side Recruiting Station', 'Chicago', 'Illinois', '60609'),
('4A3C', 'Chicago North Side Recruiting Station', 'Chicago', 'Illinois', '60614'),
('4A4A', 'Aurora Recruiting Station', 'Aurora', 'Illinois', '60505'),
('4B1R', 'Rockford Recruiting Station', 'Rockford', 'Illinois', '61101'),
('4A5J', 'Joliet Recruiting Station', 'Joliet', 'Illinois', '60432'),
('4A6N', 'Naperville Recruiting Station', 'Naperville', 'Illinois', '60540'),
('4C1S', 'Springfield Recruiting Station', 'Springfield', 'Illinois', '62701');

-- PENNSYLVANIA (7 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('2B1P', 'Philadelphia Center City Recruiting Station', 'Philadelphia', 'Pennsylvania', '19102'),
('2B2P', 'Philadelphia North Recruiting Station', 'Philadelphia', 'Pennsylvania', '19140'),
('2C1P', 'Pittsburgh Recruiting Station', 'Pittsburgh', 'Pennsylvania', '15219'),
('2D1A', 'Allentown Recruiting Station', 'Allentown', 'Pennsylvania', '18101'),
('2E1E', 'Erie Recruiting Station', 'Erie', 'Pennsylvania', '16501'),
('2D2R', 'Reading Recruiting Station', 'Reading', 'Pennsylvania', '19601'),
('2F1S', 'Scranton Recruiting Station', 'Scranton', 'Pennsylvania', '18503');

-- OHIO (6 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('4B1C', 'Columbus Recruiting Station', 'Columbus', 'Ohio', '43215'),
('4C1C', 'Cleveland Recruiting Station', 'Cleveland', 'Ohio', '44113'),
('4D1C', 'Cincinnati Recruiting Station', 'Cincinnati', 'Ohio', '45202'),
('4C2T', 'Toledo Recruiting Station', 'Toledo', 'Ohio', '43604'),
('4C3A', 'Akron Recruiting Station', 'Akron', 'Ohio', '44308'),
('4D2D', 'Dayton Recruiting Station', 'Dayton', 'Ohio', '45402');

-- GEORGIA (6 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('3B1A', 'Atlanta Downtown Recruiting Station', 'Atlanta', 'Georgia', '30303'),
('3B2A', 'Atlanta Buckhead Recruiting Station', 'Atlanta', 'Georgia', '30326'),
('3F1A', 'Augusta Recruiting Station', 'Augusta', 'Georgia', '30901'),
('3F2C', 'Columbus Recruiting Station', 'Columbus', 'Georgia', '31901'),
('3F3S', 'Savannah Recruiting Station', 'Savannah', 'Georgia', '31401'),
('3B3A', 'Athens Recruiting Station', 'Athens', 'Georgia', '30601');

-- NORTH CAROLINA (6 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('3C1C', 'Charlotte Recruiting Station', 'Charlotte', 'North Carolina', '28202'),
('3C2R', 'Raleigh Recruiting Station', 'Raleigh', 'North Carolina', '27601'),
('3C3G', 'Greensboro Recruiting Station', 'Greensboro', 'North Carolina', '27401'),
('3C4D', 'Durham Recruiting Station', 'Durham', 'North Carolina', '27701'),
('3C5W', 'Winston-Salem Recruiting Station', 'Winston-Salem', 'North Carolina', '27101'),
('3C6F', 'Fayetteville Recruiting Station', 'Fayetteville', 'North Carolina', '28301');

-- MICHIGAN (6 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('4C1D', 'Detroit Recruiting Station', 'Detroit', 'Michigan', '48226'),
('4E1G', 'Grand Rapids Recruiting Station', 'Grand Rapids', 'Michigan', '49503'),
('4C2W', 'Warren Recruiting Station', 'Warren', 'Michigan', '48089'),
('4C3S', 'Sterling Heights Recruiting Station', 'Sterling Heights', 'Michigan', '48312'),
('4C4A', 'Ann Arbor Recruiting Station', 'Ann Arbor', 'Michigan', '48104'),
('4E2L', 'Lansing Recruiting Station', 'Lansing', 'Michigan', '48933');

-- ARIZONA (6 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('6E1P', 'Phoenix Downtown Recruiting Station', 'Phoenix', 'Arizona', '85003'),
('6E2P', 'Phoenix North Recruiting Station', 'Phoenix', 'Arizona', '85020'),
('6E3T', 'Tucson Recruiting Station', 'Tucson', 'Arizona', '85701'),
('6E4M', 'Mesa Recruiting Station', 'Mesa', 'Arizona', '85201'),
('6E5C', 'Chandler Recruiting Station', 'Chandler', 'Arizona', '85225'),
('6E6S', 'Scottsdale Recruiting Station', 'Scottsdale', 'Arizona', '85251');

-- WASHINGTON (6 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('6B1S', 'Seattle Downtown Recruiting Station', 'Seattle', 'Washington', '98101'),
('6B2S', 'Seattle North Recruiting Station', 'Seattle', 'Washington', '98103'),
('6F1S', 'Spokane Recruiting Station', 'Spokane', 'Washington', '99201'),
('6B3T', 'Tacoma Recruiting Station', 'Tacoma', 'Washington', '98402'),
('6F2V', 'Vancouver Recruiting Station', 'Vancouver', 'Washington', '98660'),
('6B4B', 'Bellevue Recruiting Station', 'Bellevue', 'Washington', '98004');

-- MASSACHUSETTS (6 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('2C1B', 'Boston Downtown Recruiting Station', 'Boston', 'Massachusetts', '02108'),
('2C2B', 'Boston South Recruiting Station', 'Boston', 'Massachusetts', '02118'),
('2C3W', 'Worcester Recruiting Station', 'Worcester', 'Massachusetts', '01608'),
('2C4S', 'Springfield Recruiting Station', 'Springfield', 'Massachusetts', '01103'),
('2C5C', 'Cambridge Recruiting Station', 'Cambridge', 'Massachusetts', '02138'),
('2C6L', 'Lowell Recruiting Station', 'Lowell', 'Massachusetts', '01852');

-- TENNESSEE (5 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('5G1N', 'Nashville Recruiting Station', 'Nashville', 'Tennessee', '37201'),
('5G2M', 'Memphis Recruiting Station', 'Memphis', 'Tennessee', '38103'),
('5G3K', 'Knoxville Recruiting Station', 'Knoxville', 'Tennessee', '37902'),
('5G4C', 'Chattanooga Recruiting Station', 'Chattanooga', 'Tennessee', '37402'),
('5G5C', 'Clarksville Recruiting Station', 'Clarksville', 'Tennessee', '37040');

-- INDIANA (4 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('4D1I', 'Indianapolis Recruiting Station', 'Indianapolis', 'Indiana', '46204'),
('4F1F', 'Fort Wayne Recruiting Station', 'Fort Wayne', 'Indiana', '46802'),
('4D2E', 'Evansville Recruiting Station', 'Evansville', 'Indiana', '47708'),
('4F2S', 'South Bend Recruiting Station', 'South Bend', 'Indiana', '46601');

-- MISSOURI (4 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('4H1K', 'Kansas City Recruiting Station', 'Kansas City', 'Missouri', '64106'),
('4H2S', 'St. Louis Recruiting Station', 'St. Louis', 'Missouri', '63101'),
('4H3S', 'Springfield Recruiting Station', 'Springfield', 'Missouri', '65806'),
('4H4C', 'Columbia Recruiting Station', 'Columbia', 'Missouri', '65201');

-- WISCONSIN (3 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('4E1M', 'Milwaukee Recruiting Station', 'Milwaukee', 'Wisconsin', '53202'),
('4E2M', 'Madison Recruiting Station', 'Madison', 'Wisconsin', '53703'),
('4E3G', 'Green Bay Recruiting Station', 'Green Bay', 'Wisconsin', '54301');

-- MARYLAND (3 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('3G1B', 'Baltimore Recruiting Station', 'Baltimore', 'Maryland', '21201'),
('3G2S', 'Silver Spring Recruiting Station', 'Silver Spring', 'Maryland', '20910'),
('3G3F', 'Frederick Recruiting Station', 'Frederick', 'Maryland', '21701');

-- MINNESOTA (3 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('4F1M', 'Minneapolis Recruiting Station', 'Minneapolis', 'Minnesota', '55401'),
('4F2S', 'St. Paul Recruiting Station', 'St. Paul', 'Minnesota', '55102'),
('4F3R', 'Rochester Recruiting Station', 'Rochester', 'Minnesota', '55901');

-- COLORADO (4 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('6G1D', 'Denver Downtown Recruiting Station', 'Denver', 'Colorado', '80202'),
('6G2D', 'Denver Aurora Recruiting Station', 'Denver', 'Colorado', '80010'),
('6G3C', 'Colorado Springs Recruiting Station', 'Colorado Springs', 'Colorado', '80903'),
('6G4F', 'Fort Collins Recruiting Station', 'Fort Collins', 'Colorado', '80521');

-- ALABAMA (4 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('5F1B', 'Birmingham Recruiting Station', 'Birmingham', 'Alabama', '35203'),
('5F2M', 'Montgomery Recruiting Station', 'Montgomery', 'Alabama', '36104'),
('5F3M', 'Mobile Recruiting Station', 'Mobile', 'Alabama', '36602'),
('5F4H', 'Huntsville Recruiting Station', 'Huntsville', 'Alabama', '35801');

-- SOUTH CAROLINA (3 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('3D1C', 'Columbia Recruiting Station', 'Columbia', 'South Carolina', '29201'),
('3D2C', 'Charleston Recruiting Station', 'Charleston', 'South Carolina', '29401'),
('3D3G', 'Greenville Recruiting Station', 'Greenville', 'South Carolina', '29601');

-- LOUISIANA (4 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('5D1N', 'New Orleans Recruiting Station', 'New Orleans', 'Louisiana', '70112'),
('5D2B', 'Baton Rouge Recruiting Station', 'Baton Rouge', 'Louisiana', '70801'),
('5D3S', 'Shreveport Recruiting Station', 'Shreveport', 'Louisiana', '71101'),
('5D4L', 'Lafayette Recruiting Station', 'Lafayette', 'Louisiana', '70501');

-- KENTUCKY (3 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('5H1L', 'Louisville Recruiting Station', 'Louisville', 'Kentucky', '40202'),
('5H2L', 'Lexington Recruiting Station', 'Lexington', 'Kentucky', '40507'),
('5H3B', 'Bowling Green Recruiting Station', 'Bowling Green', 'Kentucky', '42101');

-- OREGON (3 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('6C1P', 'Portland Recruiting Station', 'Portland', 'Oregon', '97204'),
('6C2E', 'Eugene Recruiting Station', 'Eugene', 'Oregon', '97401'),
('6C3S', 'Salem Recruiting Station', 'Salem', 'Oregon', '97301');

-- OKLAHOMA (3 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('5B1O', 'Oklahoma City Recruiting Station', 'Oklahoma City', 'Oklahoma', '73102'),
('5B2T', 'Tulsa Recruiting Station', 'Tulsa', 'Oklahoma', '74103'),
('5B3N', 'Norman Recruiting Station', 'Norman', 'Oklahoma', '73069');

-- CONNECTICUT (4 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('2D1H', 'Hartford Recruiting Station', 'Hartford', 'Connecticut', '06103'),
('2D2N', 'New Haven Recruiting Station', 'New Haven', 'Connecticut', '06510'),
('2D3S', 'Stamford Recruiting Station', 'Stamford', 'Connecticut', '06901'),
('2D4B', 'Bridgeport Recruiting Station', 'Bridgeport', 'Connecticut', '06604');

-- IOWA (3 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('4G1D', 'Des Moines Recruiting Station', 'Des Moines', 'Iowa', '50309'),
('4G2C', 'Cedar Rapids Recruiting Station', 'Cedar Rapids', 'Iowa', '52401'),
('4G3D', 'Davenport Recruiting Station', 'Davenport', 'Iowa', '52801');

-- UTAH (3 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('6H1S', 'Salt Lake City Recruiting Station', 'Salt Lake City', 'Utah', '84101'),
('6H2W', 'West Valley City Recruiting Station', 'West Valley City', 'Utah', '84119'),
('6H3P', 'Provo Recruiting Station', 'Provo', 'Utah', '84601');

-- NEVADA (4 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('6D1L', 'Las Vegas Downtown Recruiting Station', 'Las Vegas', 'Nevada', '89101'),
('6D2L', 'Las Vegas North Recruiting Station', 'Las Vegas', 'Nevada', '89030'),
('6D3R', 'Reno Recruiting Station', 'Reno', 'Nevada', '89501'),
('6D4H', 'Henderson Recruiting Station', 'Henderson', 'Nevada', '89002');

-- ARKANSAS (3 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('5C1L', 'Little Rock Recruiting Station', 'Little Rock', 'Arkansas', '72201'),
('5C2F', 'Fort Smith Recruiting Station', 'Fort Smith', 'Arkansas', '72901'),
('5C3F', 'Fayetteville Recruiting Station', 'Fayetteville', 'Arkansas', '72701');

-- MISSISSIPPI (3 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('5E1J', 'Jackson Recruiting Station', 'Jackson', 'Mississippi', '39201'),
('5E2G', 'Gulfport Recruiting Station', 'Gulfport', 'Mississippi', '39501'),
('5E3B', 'Biloxi Recruiting Station', 'Biloxi', 'Mississippi', '39530');

-- KANSAS (3 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('4I1W', 'Wichita Recruiting Station', 'Wichita', 'Kansas', '67202'),
('4I2O', 'Overland Park Recruiting Station', 'Overland Park', 'Kansas', '66204'),
('4I3K', 'Kansas City Recruiting Station', 'Kansas City', 'Kansas', '66101');

-- NEW MEXICO (3 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('6F1A', 'Albuquerque Recruiting Station', 'Albuquerque', 'New Mexico', '87102'),
('6F2L', 'Las Cruces Recruiting Station', 'Las Cruces', 'New Mexico', '88001'),
('6F3S', 'Santa Fe Recruiting Station', 'Santa Fe', 'New Mexico', '87501');

-- NEBRASKA (2 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('4J1O', 'Omaha Recruiting Station', 'Omaha', 'Nebraska', '68102'),
('4J2L', 'Lincoln Recruiting Station', 'Lincoln', 'Nebraska', '68508');

-- WEST VIRGINIA (2 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('3F1C', 'Charleston Recruiting Station', 'Charleston', 'West Virginia', '25301'),
('3F2H', 'Huntington Recruiting Station', 'Huntington', 'West Virginia', '25701');

-- IDAHO (2 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('6I1B', 'Boise Recruiting Station', 'Boise', 'Idaho', '83702'),
('6I2M', 'Meridian Recruiting Station', 'Meridian', 'Idaho', '83642');

-- HAWAII (3 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('7B1H', 'Honolulu Recruiting Station', 'Honolulu', 'Hawaii', '96813'),
('7B2P', 'Pearl City Recruiting Station', 'Pearl City', 'Hawaii', '96782'),
('7B3H', 'Hilo Recruiting Station', 'Hilo', 'Hawaii', '96720');

-- MAINE (2 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('2H1P', 'Portland Recruiting Station', 'Portland', 'Maine', '04101'),
('2H2L', 'Lewiston Recruiting Station', 'Lewiston', 'Maine', '04240');

-- NEW HAMPSHIRE (2 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('2G1M', 'Manchester Recruiting Station', 'Manchester', 'New Hampshire', '03101'),
('2G2N', 'Nashua Recruiting Station', 'Nashua', 'New Hampshire', '03060');

-- RHODE ISLAND (2 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('2E1P', 'Providence Recruiting Station', 'Providence', 'Rhode Island', '02903'),
('2E2W', 'Warwick Recruiting Station', 'Warwick', 'Rhode Island', '02886');

-- MONTANA (2 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('6J1B', 'Billings Recruiting Station', 'Billings', 'Montana', '59101'),
('6J2M', 'Missoula Recruiting Station', 'Missoula', 'Montana', '59801');

-- DELAWARE (2 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('3H1W', 'Wilmington Recruiting Station', 'Wilmington', 'Delaware', '19801'),
('3H2D', 'Dover Recruiting Station', 'Dover', 'Delaware', '19901');

-- SOUTH DAKOTA (2 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('4L1S', 'Sioux Falls Recruiting Station', 'Sioux Falls', 'South Dakota', '57104'),
('4L2R', 'Rapid City Recruiting Station', 'Rapid City', 'South Dakota', '57701');

-- NORTH DAKOTA (2 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('4K1F', 'Fargo Recruiting Station', 'Fargo', 'North Dakota', '58102'),
('4K2B', 'Bismarck Recruiting Station', 'Bismarck', 'North Dakota', '58501');

-- ALASKA (2 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('7A1A', 'Anchorage Recruiting Station', 'Anchorage', 'Alaska', '99501'),
('7A2F', 'Fairbanks Recruiting Station', 'Fairbanks', 'Alaska', '99701');

-- VERMONT (2 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('2F1B', 'Burlington Recruiting Station', 'Burlington', 'Vermont', '05401'),
('2F2R', 'Rutland Recruiting Station', 'Rutland', 'Vermont', '05701');

-- WYOMING (2 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('6K1C', 'Cheyenne Recruiting Station', 'Cheyenne', 'Wyoming', '82001'),
('6K2C', 'Casper Recruiting Station', 'Casper', 'Wyoming', '82601');

-- NEW JERSEY (5 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('2A1N', 'Newark Recruiting Station', 'Newark', 'New Jersey', '07102'),
('2A2J', 'Jersey City Recruiting Station', 'Jersey City', 'New Jersey', '07302'),
('2A3P', 'Paterson Recruiting Station', 'Paterson', 'New Jersey', '07505'),
('2A4E', 'Elizabeth Recruiting Station', 'Elizabeth', 'New Jersey', '07201'),
('2A5T', 'Trenton Recruiting Station', 'Trenton', 'New Jersey', '08608');

-- VIRGINIA (5 stations)
INSERT INTO stations (station_code, name, city, state, zip_code) VALUES
('3E1V', 'Virginia Beach Recruiting Station', 'Virginia Beach', 'Virginia', '23451'),
('3E2N', 'Norfolk Recruiting Station', 'Norfolk', 'Virginia', '23510'),
('3E3C', 'Chesapeake Recruiting Station', 'Chesapeake', 'Virginia', '23320'),
('3E4R', 'Richmond Recruiting Station', 'Richmond', 'Virginia', '23219'),
('3E5A', 'Arlington Recruiting Station', 'Arlington', 'Virginia', '22201');

-- Step 3: Assign admin to Manhattan recruiting station
UPDATE users 
SET station_id = (SELECT id FROM stations WHERE station_code = '1G1A')
WHERE email = 'moran.alex@icloud.com' AND station_id IS NULL;

-- Step 4: Randomly assign all other existing users to city-level stations
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

-- Step 5: Create indices for faster searching
CREATE INDEX IF NOT EXISTS idx_stations_city ON stations(city);
CREATE INDEX IF NOT EXISTS idx_stations_state ON stations(state);
CREATE INDEX IF NOT EXISTS idx_stations_code ON stations(station_code);

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Migration 005 completed: City-Level Stations';
  RAISE NOTICE 'Total stations created: %', (SELECT COUNT(*) FROM stations);
  RAISE NOTICE 'Users with stations: %', (SELECT COUNT(*) FROM users WHERE station_id IS NOT NULL);
END $$;

