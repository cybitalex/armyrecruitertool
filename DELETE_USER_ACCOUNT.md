# Delete User Account Guide

This guide explains how to delete a user account from the Army Recruiter Tool database, allowing them to re-register with the same email address.

## Overview

When you delete a user account, the following data is permanently removed:
- User account information
- All recruits/applications associated with the user
- All QR scan records
- All survey responses
- All station commander requests
- All station change requests

**⚠️ WARNING: This action cannot be undone!**

## Duplicate Email Check

The system already prevents duplicate email registrations. When someone tries to register with an email that already exists, they will see the error message: **"User with this email already exists"**.

This check happens:
1. **Backend**: The `registerUser` function in `server/auth.ts` checks for existing users before creating a new account
2. **API Response**: Returns HTTP status code 409 (Conflict) with the error message
3. **Frontend**: Displays the error message in a red alert box on the registration page

## How to Delete a User Account

### Option 1: Automated Script (Recommended)

Use the provided shell script for a safe, interactive deletion process:

```bash
cd /Users/alexmoran/Documents/programming/cybit-k8s
chmod +x delete-user-account.sh
./delete-user-account.sh user@example.com
```

The script will:
1. Verify the user exists
2. Show you what data will be deleted
3. Ask for confirmation (twice for safety)
4. Delete all related records
5. Delete the user account
6. Verify the deletion was successful

### Option 2: Manual SQL Deletion

If you prefer to run SQL commands directly:

1. **Get the PostgreSQL pod name:**
   ```bash
   kubectl get pods -l app=army-postgres
   ```

2. **Connect to the database:**
   ```bash
   POSTGRES_POD=$(kubectl get pods -l app=army-postgres -o jsonpath='{.items[0].metadata.name}')
   kubectl exec -it $POSTGRES_POD -- psql -U armyrecruiter -d army_recruiter
   ```

3. **Verify the user exists:**
   ```sql
   SELECT id, email, full_name, role, created_at 
   FROM users 
   WHERE email = 'user@example.com';
   ```

4. **Count related records (optional):**
   ```sql
   SELECT 
     (SELECT COUNT(*) FROM recruits WHERE recruiter_id = (SELECT id FROM users WHERE email = 'user@example.com')) as recruits_count,
     (SELECT COUNT(*) FROM qr_scans WHERE recruiter_id = (SELECT id FROM users WHERE email = 'user@example.com')) as qr_scans_count,
     (SELECT COUNT(*) FROM qr_survey_responses WHERE recruiter_id = (SELECT id FROM users WHERE email = 'user@example.com')) as survey_responses_count,
     (SELECT COUNT(*) FROM station_commander_requests WHERE user_id = (SELECT id FROM users WHERE email = 'user@example.com')) as sc_requests_count,
     (SELECT COUNT(*) FROM station_change_requests WHERE user_id = (SELECT id FROM users WHERE email = 'user@example.com')) as station_change_requests_count;
   ```

5. **Delete related records:**
   ```sql
   -- Delete recruits
   DELETE FROM recruits 
   WHERE recruiter_id = (SELECT id FROM users WHERE email = 'user@example.com');
   
   -- Delete survey responses
   DELETE FROM qr_survey_responses 
   WHERE recruiter_id = (SELECT id FROM users WHERE email = 'user@example.com');
   
   -- Delete station commander requests
   DELETE FROM station_commander_requests 
   WHERE user_id = (SELECT id FROM users WHERE email = 'user@example.com');
   ```

6. **Delete the user account:**
   ```sql
   DELETE FROM users 
   WHERE email = 'user@example.com';
   ```

7. **Verify deletion:**
   ```sql
   SELECT COUNT(*) FROM users WHERE email = 'user@example.com';
   -- Should return 0
   ```

### Option 3: Using Migration File

You can also use the migration file directly:

1. **Edit the migration file:**
   ```bash
   nano /Users/alexmoran/Documents/programming/ArmyRecruitTool/migrations/008_delete_user_account.sql
   ```
   
   Replace `'USER_EMAIL_HERE'` with the actual email address.

2. **Copy to the pod and run:**
   ```bash
   POSTGRES_POD=$(kubectl get pods -l app=army-postgres -o jsonpath='{.items[0].metadata.name}')
   kubectl cp migrations/008_delete_user_account.sql $POSTGRES_POD:/tmp/delete_user.sql
   kubectl exec -it $POSTGRES_POD -- psql -U armyrecruiter -d army_recruiter -f /tmp/delete_user.sql
   ```

## What Gets Deleted

### Automatically Deleted (CASCADE)
- **QR Scans**: Deleted automatically when user is deleted (foreign key with `ON DELETE CASCADE`)
- **Station Change Requests**: Deleted automatically when user is deleted (foreign key with `ON DELETE CASCADE`)

### Manually Deleted (Before User)
- **Recruits**: Applications must be deleted first to avoid orphaned records
- **Survey Responses**: Must be deleted first
- **Station Commander Requests**: Must be deleted first

## After Deletion

Once the account is deleted:
1. The user can register again with the same email address
2. They will need to complete the full registration process
3. They will receive a new verification email
4. All previous data is permanently removed

## Troubleshooting

### "User not found" Error
- Double-check the email address spelling
- Email is case-sensitive in the database
- Try: `SELECT email FROM users WHERE email ILIKE '%partial%';` to search

### Foreign Key Constraint Errors
- Make sure you're deleting related records first
- Check the order: recruits → survey responses → station commander requests → user

### Cannot Connect to Database
- Verify PostgreSQL pod is running: `kubectl get pods -l app=army-postgres`
- Check pod logs: `kubectl logs -l app=army-postgres`

## Security Notes

- Only administrators should have access to delete user accounts
- Always verify the email address before deletion
- Consider backing up data before deletion if it might be needed later
- The deletion script requires explicit confirmation to prevent accidents

## Related Files

- **Deletion Script**: `cybit-k8s/delete-user-account.sh`
- **SQL Migration**: `migrations/008_delete_user_account.sql`
- **Registration Code**: `server/auth.ts` (lines 641-647 for duplicate check)
- **API Route**: `server/routes.ts` (line 45-57 for registration endpoint)

