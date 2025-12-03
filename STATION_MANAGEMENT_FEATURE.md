# Station Management Feature

## Overview

The Station Management feature allows users to be assigned to specific recruiting stations based on US states. This system includes:

- **State-based stations**: One recruiting station per state (50 stations total)
- **Station codes**: Unique identifiers like "1G1A" where the first two characters represent the location
- **Station assignment**: Users are assigned a station during registration
- **Station change requests**: Users can request to transfer to a different station
- **Admin approval workflow**: Station changes require administrator approval

## Key Features

### 1. Station Selection During Registration

- New users select their recruiting station from a dropdown of all 50 states
- Each station has a unique code (e.g., "1G1A" for New York City)
- Station assignment is required during registration

### 2. Station Change Requests (Profile Page)

- Regular users and station commanders can request to change their station
- Users provide a reason for the transfer (e.g., PCS orders, family circumstances)
- Only one pending request allowed at a time
- Admin users can change their station directly without approval

### 3. Admin Dashboard - Station Change Management

- New tab in Admin Dashboard for "Station Change Requests"
- Shows:
  - Requester information
  - Current station (red highlight)
  - Requested station (green highlight)
  - Reason for transfer
- Approve or deny requests with optional reason notes
- Upon approval, user's station is automatically updated

## Database Schema

### Stations Table

```sql
CREATE TABLE stations (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  station_code TEXT UNIQUE NOT NULL,
  state TEXT,
  city TEXT,
  address TEXT,
  zip_code TEXT,
  phone_number TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Station Change Requests Table

```sql
CREATE TABLE station_change_requests (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  current_station_id UUID REFERENCES stations(id),
  requested_station_id UUID NOT NULL REFERENCES stations(id),
  reason TEXT,
  status TEXT DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  created_at TIMESTAMP
);
```

## Station Codes

Station codes follow the format: `[Location Code][District Code]`

### Examples:

- **1G1A** = New York City Recruiting Station
- **2A1B** = New Jersey Recruiting Station
- **3A2A** = Florida Recruiting Station
- **4A3A** = Illinois Recruiting Station
- **5A4A** = Texas Recruiting Station
- **6A5A** = California Recruiting Station
- **6B5B** = Washington Recruiting Station
- **7A6A** = Alaska Recruiting Station
- **7B6B** = Hawaii Recruiting Station

The first two characters (e.g., "1G") represent the location/region code. The last two characters represent the district within that region.

## API Endpoints

### Public Endpoints

- `GET /api/stations` - Get all recruiting stations
- `GET /api/stations/:id` - Get a specific station by ID

### Authenticated User Endpoints

- `POST /api/station-change-requests` - Create a new station change request
- `GET /api/station-change-requests/my-request` - Get user's pending request

### Admin Endpoints

- `GET /api/admin/station-change-requests` - Get all pending station change requests
- `POST /api/admin/station-change-requests/:id/approve` - Approve a request
- `POST /api/admin/station-change-requests/:id/deny` - Deny a request

## User Flows

### Registration Flow

1. User navigates to registration page
2. Fills out standard information
3. Selects recruiting station from dropdown (required)
4. Submits registration
5. User is assigned to the selected station

### Station Change Request Flow (Regular User)

1. User navigates to Profile page
2. Sees "Change Recruiting Station" card
3. Views current station information
4. Selects new desired station from dropdown
5. Provides reason for transfer
6. Submits request
7. Admin receives notification
8. Admin reviews and approves/denies
9. User's station is updated (if approved)

### Admin Approval Flow

1. Admin logs in and navigates to Admin Dashboard
2. Clicks "Station Change Requests" tab
3. Reviews pending requests
4. Sees:
   - User information
   - Current station (highlighted in red)
   - Requested station (highlighted in green)
   - Reason for transfer
5. Clicks "Approve" or "Deny"
6. (Optional) Provides notes when denying
7. Request is processed and user's station is updated

## Security & Access Control

### Role-Based Permissions

**Regular Recruiter:**

- Can select station during registration
- Can request station change (requires approval)
- Cannot view other users' stations

**Station Commander:**

- Same as regular recruiter
- Can request station change (requires approval)
- **IMPORTANT:** If station transfer approved, automatically demoted to recruiter
- Must request station commander access again at new station
- Can view all recruiters at their station (while commander)

**Admin:**

- Can change their own station directly (no approval)
- Can approve/deny all station change requests
- Can view all users and all stations
- Admin role never gets demoted (highest privilege level)

### 🔒 Automatic Demotion on Transfer

**Critical Security Feature:**
When a station commander's transfer request is approved, they are **automatically demoted to regular recruiter**. This prevents privilege escalation and ensures proper authorization at the new station.

**Example:**

```
1. User is Station Commander at NYC
2. Requests transfer to California
3. Admin approves transfer
4. ✅ User moved to California
5. ✅ User demoted to recruiter (automatic)
6. User must request Station Commander access at California
7. Admin reviews and approves new commander request
8. User becomes Station Commander at California
```

See `STATION_TRANSFER_ROLE_DEMOTION.md` for complete details.

## Deployment

### Running the Migration

```bash
cd /Users/alexmoran/Documents/programming/cybit-k8s
./deploy-station-management.sh
```

The deployment script will:

1. Create `station_change_requests` table
2. Insert all 50 state-based stations
3. Assign NYC station (1G1A) to admin user
4. Randomly assign stations to all existing users
5. Rebuild and deploy the application
6. Verify the deployment

### Manual Migration (if needed)

```bash
# Copy migration file
kubectl cp migrations/004_add_station_management.sql $POSTGRES_POD:/tmp/migration.sql

# Run migration
kubectl exec -it $POSTGRES_POD -- psql -U armyrecruiter -d army_recruiter -f /tmp/migration.sql
```

## Future Enhancements

Potential future improvements:

1. **City-level stations**: Add cities within each state for more granular assignments
2. **Station hierarchy**: Create battalions, companies, and platoons structure
3. **Automatic approval**: PCS orders verification could auto-approve transfers
4. **Station statistics**: Show recruiter count and performance by station
5. **Station commanders by station**: Allow multiple commanders per station
6. **Bulk transfers**: Admin ability to transfer multiple users at once

## Testing

### Test Station Selection (Registration)

1. Go to `/register`
2. Select "New York" from station dropdown
3. Complete registration
4. Verify station assignment in database

### Test Station Change Request

1. Login as regular user
2. Go to `/profile`
3. Scroll to "Change Recruiting Station"
4. Select a different station
5. Provide reason
6. Submit request
7. Login as admin
8. Go to `/admin/requests`
9. Switch to "Station Change Requests" tab
10. Approve or deny the request

### Test Admin Direct Change

1. Login as admin
2. Go to `/profile`
3. Scroll to "Change Recruiting Station"
4. Should see blue alert indicating admin privilege
5. Station should change immediately without approval

## Troubleshooting

### Users not showing stations

- Check if migration ran: `SELECT COUNT(*) FROM stations;`
- Check if users have station_id: `SELECT COUNT(*) FROM users WHERE station_id IS NOT NULL;`
- Re-run the random assignment part of migration if needed

### Station change requests not appearing

- Check table exists: `\dt station_change_requests`
- Verify request was created: `SELECT * FROM station_change_requests WHERE status = 'pending';`
- Check browser console for API errors

### Admin cannot change station directly

- Verify admin role: `SELECT email, role FROM users WHERE email = 'moran.alex@icloud.com';`
- Should be 'admin', not 'station_commander'

## Related Files

- **Schema**: `ArmyRecruitTool/shared/schema.ts`
- **Station Data**: `ArmyRecruitTool/shared/stationsData.ts`
- **Migration**: `ArmyRecruitTool/migrations/004_add_station_management.sql`
- **Registration Page**: `ArmyRecruitTool/client/src/pages/register.tsx`
- **Profile Page**: `ArmyRecruitTool/client/src/pages/profile.tsx`
- **Admin Page**: `ArmyRecruitTool/client/src/pages/admin-requests.tsx`
- **Backend Routes**: `ArmyRecruitTool/server/routes.ts`
- **Deployment Script**: `cybit-k8s/deploy-station-management.sh`
