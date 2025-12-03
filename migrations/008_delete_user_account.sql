-- Migration: Delete User Account
-- This script safely deletes a user account and all related data
-- 
-- Usage:
-- Replace 'USER_EMAIL_HERE' with the actual email address
-- 
-- WARNING: This will permanently delete:
-- - User account
-- - All recruits/applications associated with the user
-- - All QR scan records (auto-deleted via CASCADE)
-- - All survey responses
-- - All station commander requests
-- - All station change requests (auto-deleted via CASCADE)
--
-- This action CANNOT be undone!

-- Step 1: Find the user ID (for verification)
-- Uncomment to check before deletion:
-- SELECT id, email, full_name, role, created_at 
-- FROM users 
-- WHERE email = 'USER_EMAIL_HERE';

-- Step 2: Count related records (for verification)
-- Uncomment to see what will be deleted:
-- SELECT 
--   (SELECT COUNT(*) FROM recruits WHERE recruiter_id = (SELECT id FROM users WHERE email = 'USER_EMAIL_HERE')) as recruits_count,
--   (SELECT COUNT(*) FROM qr_scans WHERE recruiter_id = (SELECT id FROM users WHERE email = 'USER_EMAIL_HERE')) as qr_scans_count,
--   (SELECT COUNT(*) FROM qr_survey_responses WHERE recruiter_id = (SELECT id FROM users WHERE email = 'USER_EMAIL_HERE')) as survey_responses_count,
--   (SELECT COUNT(*) FROM station_commander_requests WHERE user_id = (SELECT id FROM users WHERE email = 'USER_EMAIL_HERE')) as sc_requests_count,
--   (SELECT COUNT(*) FROM station_change_requests WHERE user_id = (SELECT id FROM users WHERE email = 'USER_EMAIL_HERE')) as station_change_requests_count;

-- Step 3: Delete related records first (to avoid foreign key issues)
-- Note: Some tables have CASCADE, but we'll be explicit for clarity

-- Delete recruits (applications) - these will be orphaned if we don't delete them
DELETE FROM recruits 
WHERE recruiter_id = (SELECT id FROM users WHERE email = 'USER_EMAIL_HERE');

-- Delete survey responses
DELETE FROM qr_survey_responses 
WHERE recruiter_id = (SELECT id FROM users WHERE email = 'USER_EMAIL_HERE');

-- Delete station commander requests
DELETE FROM station_commander_requests 
WHERE user_id = (SELECT id FROM users WHERE email = 'USER_EMAIL_HERE');

-- Note: qr_scans and station_change_requests will be auto-deleted via CASCADE

-- Step 4: Delete the user account
DELETE FROM users 
WHERE email = 'USER_EMAIL_HERE';

-- Step 5: Verify deletion
-- Uncomment to verify:
-- SELECT COUNT(*) as remaining_users FROM users WHERE email = 'USER_EMAIL_HERE';
-- Should return 0

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'User account and all related data deleted successfully';
END $$;

