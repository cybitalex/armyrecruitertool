-- Delete specified user accounts and clean related data.
-- Run against Army Recruiter DB (e.g. psql $DATABASE_URL -f scripts/delete-users.sql)
-- Or from k8s: kubectl exec -it army-postgres-xxx -- psql -U armyrecruiter -d army_recruiter -f - < scripts/delete-users.sql

-- 1. Unlink recruits from these recruiters
UPDATE recruits
SET recruiter_id = NULL
WHERE recruiter_id IN (SELECT id FROM users WHERE email IN (
  'sc3rec3@cybitteam.testinator.email',
  'sc3rec2@cybitteam.testinator.email',
  'sc3rec1@cybitteam.testinator.email',
  'sc2rec3@cybitteam.testinator.email',
  'sc2rec2@cybitteam.testinator.email',
  'sc2rec1@cybitteam.testinator.email',
  'sc1rec3@cybitteam.testinator.email',
  'sc1rec2@cybitteam.testinator.email',
  'sc1rec1@cybitteam.testinator.email',
  'sc3@cybitteam.testinator.email',
  'sc2@cybitteam.testinator.email',
  'sc1@cybitteam.testinator.email',
  'alex.moran@snhu.edu',
  'kai.c.olson.mil@army.mil',
  'alexmoran.official3@gmail.com'
));

-- 2. Delete QR survey responses by these recruiters
DELETE FROM qr_survey_responses
WHERE recruiter_id IN (SELECT id FROM users WHERE email IN (
  'sc3rec3@cybitteam.testinator.email',
  'sc3rec2@cybitteam.testinator.email',
  'sc3rec1@cybitteam.testinator.email',
  'sc2rec3@cybitteam.testinator.email',
  'sc2rec2@cybitteam.testinator.email',
  'sc2rec1@cybitteam.testinator.email',
  'sc1rec3@cybitteam.testinator.email',
  'sc1rec2@cybitteam.testinator.email',
  'sc1rec1@cybitteam.testinator.email',
  'sc3@cybitteam.testinator.email',
  'sc2@cybitteam.testinator.email',
  'sc1@cybitteam.testinator.email',
  'alex.moran@snhu.edu',
  'kai.c.olson.mil@army.mil',
  'alexmoran.official3@gmail.com'
));

-- 3. Delete station_commander_requests where these users are the requester
DELETE FROM station_commander_requests
WHERE user_id IN (SELECT id FROM users WHERE email IN (
  'sc3rec3@cybitteam.testinator.email',
  'sc3rec2@cybitteam.testinator.email',
  'sc3rec1@cybitteam.testinator.email',
  'sc2rec3@cybitteam.testinator.email',
  'sc2rec2@cybitteam.testinator.email',
  'sc2rec1@cybitteam.testinator.email',
  'sc1rec3@cybitteam.testinator.email',
  'sc1rec2@cybitteam.testinator.email',
  'sc1rec1@cybitteam.testinator.email',
  'sc3@cybitteam.testinator.email',
  'sc2@cybitteam.testinator.email',
  'sc1@cybitteam.testinator.email',
  'alex.moran@snhu.edu',
  'kai.c.olson.mil@army.mil',
  'alexmoran.official3@gmail.com'
));

-- 4. Clear reviewedBy in station_commander_requests
UPDATE station_commander_requests
SET reviewed_by = NULL
WHERE reviewed_by IN (SELECT id FROM users WHERE email IN (
  'sc3rec3@cybitteam.testinator.email',
  'sc3rec2@cybitteam.testinator.email',
  'sc3rec1@cybitteam.testinator.email',
  'sc2rec3@cybitteam.testinator.email',
  'sc2rec2@cybitteam.testinator.email',
  'sc2rec1@cybitteam.testinator.email',
  'sc1rec3@cybitteam.testinator.email',
  'sc1rec2@cybitteam.testinator.email',
  'sc1rec1@cybitteam.testinator.email',
  'sc3@cybitteam.testinator.email',
  'sc2@cybitteam.testinator.email',
  'sc1@cybitteam.testinator.email',
  'alex.moran@snhu.edu',
  'kai.c.olson.mil@army.mil',
  'alexmoran.official3@gmail.com'
));

-- 5. Clear reviewedBy in station_change_requests
UPDATE station_change_requests
SET reviewed_by = NULL
WHERE reviewed_by IN (SELECT id FROM users WHERE email IN (
  'sc3rec3@cybitteam.testinator.email',
  'sc3rec2@cybitteam.testinator.email',
  'sc3rec1@cybitteam.testinator.email',
  'sc2rec3@cybitteam.testinator.email',
  'sc2rec2@cybitteam.testinator.email',
  'sc2rec1@cybitteam.testinator.email',
  'sc1rec3@cybitteam.testinator.email',
  'sc1rec2@cybitteam.testinator.email',
  'sc1rec1@cybitteam.testinator.email',
  'sc3@cybitteam.testinator.email',
  'sc2@cybitteam.testinator.email',
  'sc1@cybitteam.testinator.email',
  'alex.moran@snhu.edu',
  'kai.c.olson.mil@army.mil',
  'alexmoran.official3@gmail.com'
));

-- 6. Delete users (cascades will remove qr_code_locations, qr_scans, station_change_requests, notifications)
DELETE FROM users
WHERE email IN (
  'sc3rec3@cybitteam.testinator.email',
  'sc3rec2@cybitteam.testinator.email',
  'sc3rec1@cybitteam.testinator.email',
  'sc2rec3@cybitteam.testinator.email',
  'sc2rec2@cybitteam.testinator.email',
  'sc2rec1@cybitteam.testinator.email',
  'sc1rec3@cybitteam.testinator.email',
  'sc1rec2@cybitteam.testinator.email',
  'sc1rec1@cybitteam.testinator.email',
  'sc3@cybitteam.testinator.email',
  'sc2@cybitteam.testinator.email',
  'sc1@cybitteam.testinator.email',
  'alex.moran@snhu.edu',
  'kai.c.olson.mil@army.mil',
  'alexmoran.official3@gmail.com'
);
