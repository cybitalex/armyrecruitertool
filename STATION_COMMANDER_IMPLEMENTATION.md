# Station Commander Feature - Implementation Summary

## Overview
This document describes the complete implementation of the Station Commander feature for the Army Recruiter Tool. This feature allows station commanders to view all recruiter data, manage their station, and export comprehensive reports.

## Features Implemented

### 1. **Role-Based User System**
- Added `role` field to users table with four possible values:
  - `recruiter` - Standard recruiter account (default)
  - `station_commander` - Approved station commander with elevated access
  - `pending_station_commander` - Pending approval for station commander access
  - `admin` - System administrator with full access

### 2. **Registration Flow Enhancement**
- Added account type selection during registration
- Two options: "Recruiter" or "Station Commander"
- Station Commander requests require justification text
- Automatic request creation and admin notification email

### 3. **Admin Approval System**
- **Route:** `/admin/requests`
- **Access:** Admin role only
- **Features:**
  - View all pending station commander requests
  - See requester details (name, rank, unit, email, justification)
  - Approve or deny requests with optional reason
  - Automatic email notifications to users on approval/denial
  
**API Endpoints:**
- `GET /api/admin/station-commander-requests` - List pending requests
- `POST /api/admin/station-commander-requests/:id/approve` - Approve request
- `POST /api/admin/station-commander-requests/:id/deny` - Deny request

### 4. **Station Commander Dashboard**
- **Route:** `/station-commander`
- **Access:** Station commanders and admins only
- **Features:**
  - View all recruiters at the station with individual stats
  - Station-wide totals (monthly and all-time)
  - Breakdown by leads, prospects, and applicants
  - Export comprehensive Excel reports

**Statistics Displayed:**
- **Monthly Stats** (current month):
  - Total recruits
  - Leads (pending status)
  - Prospects (contacted/qualified status)
  - Applicants (qualified status)
  
- **All-Time Stats:**
  - Total recruits
  - QR code scans vs. direct entries
  - Full breakdown by status

### 5. **Export Functionality**
Station commanders can export a comprehensive Excel report with three sheets:

**Sheet 1 - Summary:**
- Station commander info
- Station totals (monthly and all-time)
- Generation timestamp

**Sheet 2 - Recruiter Stats:**
- All recruiters with individual performance metrics
- Monthly and all-time breakdowns
- Source tracking (QR vs Direct)

**Sheet 3 - All Recruits:**
- Complete recruit details for all recruiters at the station
- Includes recruiter name with each recruit
- Full contact and status information

### 6. **Email Notification System**

**Admin Notifications:**
- Sent to: `alex.cybitdevs@gmail.com`
- Triggered when: User requests station commander access
- Contains: User details and justification

**User Notifications:**
- **Approval Email:** Confirms station commander access granted
- **Denial Email:** Explains denial (optional reason included)
- Both include relevant details and next steps

### 7. **Security & Authorization**

**Middleware Functions:**
- `requireAdmin` - Ensures user has admin role
- `requireStationCommander` - Ensures user is station commander or admin

**Protected Routes:**
- Station commander endpoints check role before granting access
- Admin endpoints require admin role
- Regular recruiter endpoints remain accessible to all roles

## Database Schema Changes

### New Tables

#### `stations` table:
```sql
- id (UUID, primary key)
- name (text) - e.g., "Atlanta Recruiting Station"
- station_code (text, unique) - e.g., "ATL-001"
- address, city, state, zip_code (text)
- phone_number (text)
- created_at, updated_at (timestamps)
```

#### `station_commander_requests` table:
```sql
- id (UUID, primary key)
- user_id (UUID, foreign key to users)
- requested_station_id (UUID, foreign key to stations)
- justification (text)
- status (text: pending/approved/denied)
- reviewed_by (UUID, foreign key to users)
- reviewed_at (timestamp)
- review_notes (text)
- created_at (timestamp)
```

### Modified Tables

#### `users` table additions:
```sql
- role (text, default 'recruiter')
- station_id (UUID, foreign key to stations)
```

## Setup Instructions

### 1. Run Database Migration
```bash
# The migration file is already created at:
# migrations/002_add_station_commander_features.sql

# Run it using your database client or psql:
psql -U your_user -d your_database -f migrations/002_add_station_commander_features.sql
```

### 2. Create Your Admin Account
You need to manually set your account as admin in the database:

```sql
-- Update your user to be an admin
UPDATE users 
SET role = 'admin' 
WHERE email = 'your_email@example.com';
```

### 3. Configure Email (if not already done)
Ensure these environment variables are set:
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
```

### 4. Restart the Application
```bash
# If using PM2
pm2 restart all

# Or if running directly
npm run dev
```

## Usage Guide

### For Regular Users (Recruiters)
1. Register normally - select "Recruiter" as account type
2. Use standard dashboard features
3. Can request station commander access later if needed

### For Station Commander Applicants
1. During registration, select "Station Commander" as account type
2. Provide detailed justification explaining why you need this access
3. Wait for email notification about approval/denial
4. If approved, access Station Commander Dashboard from the navigation menu

### For Administrators
1. Navigate to **Admin Requests** from the header menu
2. Review pending station commander requests
3. Read the justification and user details
4. Click **Approve** to grant access (optional: assign to a station)
5. Click **Deny** to reject (optional: provide a reason)
6. User receives automatic email notification

### For Station Commanders
1. Navigate to **Station Overview** from the header menu
2. View station-wide statistics (monthly and all-time)
3. Review individual recruiter performance
4. Click **Export Full Report** to download Excel report
5. Excel file includes three detailed sheets with all data

## Navigation Structure

### Header Menu (Role-Based):
- **All Roles:** Dashboard, Prospecting, New Application, Profile
- **Station Commander + Admin:** Station Overview
- **Admin Only:** Admin Requests

## API Endpoints Reference

### Authentication
- `POST /api/auth/register` - Enhanced with `accountType` and `justification` fields

### Admin
- `GET /api/admin/station-commander-requests` - List pending requests
- `POST /api/admin/station-commander-requests/:id/approve` - Approve request
- `POST /api/admin/station-commander-requests/:id/deny` - Deny request

### Station Commander
- `GET /api/station-commander/recruiters` - Get all recruiters with stats
- `GET /api/station-commander/recruits/export` - Get detailed recruit data for export

## Files Created/Modified

### New Files:
- `migrations/002_add_station_commander_features.sql` - Database migration
- `client/src/pages/admin-requests.tsx` - Admin approval dashboard
- `client/src/pages/station-commander-dashboard.tsx` - Station commander overview

### Modified Files:
- `shared/schema.ts` - Added stations and requests tables
- `shared/constants.ts` - Added role and account type constants
- `client/src/pages/register.tsx` - Added account type selection
- `client/src/lib/api.ts` - Added admin and station commander API functions
- `client/src/components/header.tsx` - Added role-based navigation
- `client/src/App.tsx` - Added new routes
- `server/auth.ts` - Enhanced registration and added email functions
- `server/routes.ts` - Added admin and station commander endpoints

## Security Considerations

1. **Role Verification:** All protected endpoints verify user role before granting access
2. **Session-Based:** Uses existing session authentication
3. **SQL Injection Prevention:** Uses parameterized queries via Drizzle ORM
4. **Email Privacy:** Only admin receives notification emails, not broadcasted
5. **Data Isolation:** Station commanders only see their station's data

## Testing Recommendations

1. **Test Registration Flow:**
   - Register as recruiter
   - Register as station commander with justification

2. **Test Admin Approval:**
   - Login as admin
   - View pending requests
   - Approve and deny requests
   - Verify email notifications

3. **Test Station Commander Dashboard:**
   - Login as approved station commander
   - Verify stats display correctly
   - Export report and verify Excel format
   - Check data accuracy

4. **Test Authorization:**
   - Try accessing admin routes as recruiter (should fail)
   - Try accessing station commander routes as recruiter (should fail)
   - Verify proper error messages

## Support & Maintenance

### Common Issues:

**Issue:** Admin menu not showing
**Solution:** Verify your user role is set to 'admin' in database

**Issue:** Email notifications not sending
**Solution:** Check SMTP environment variables are configured correctly

**Issue:** Export button not working
**Solution:** Ensure xlsx library is installed: `npm install xlsx`

**Issue:** Stats not displaying
**Solution:** Verify recruiter data has recruiterId field populated

### Future Enhancements (Optional):
- Station assignment during approval
- Multiple stations per station commander
- Custom date range filtering for reports
- Real-time dashboard updates
- Station performance comparison
- Recruiter assignment to different stations

## Contact & Support
For issues or questions, contact: alex.cybitdevs@gmail.com

---

**Implementation Date:** November 23, 2025  
**Version:** 1.0  
**Status:** ✅ Complete and Ready for Use

