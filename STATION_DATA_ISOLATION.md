# Station-Based Data Isolation

## Overview

The Army Recruiter Tool implements comprehensive data isolation based on user roles and station assignments. This ensures that:
- Regular recruiters only see their own data
- Station commanders see data from all recruiters at their station
- Administrators see all data across all stations
- No data leaks between stations

## Data Isolation by Endpoint

### 1. Dashboard Display

**What Users See:**
- **Regular Recruiter**: 
  - Own station information displayed
  - Own recruits count
  - Own survey responses
  - Own QR code scans
  
- **Station Commander**: 
  - Station information displayed
  - Badge: "Station Commander - Viewing all recruiters at your station"
  - All recruits from station
  - All survey responses from station
  - Combined stats for entire station
  
- **Administrator**:
  - Current station displayed
  - Badge: "Administrator - Viewing all data across all stations"
  - All recruits from all stations
  - All survey responses from all stations
  - Combined stats across entire system

**UI Elements:**
```tsx
// Station Display (Green badge with station code)
<MapPin /> New York City Recruiting Station
Code: 1G1A • New York

// Role Badge (Blue for SC, Purple for Admin)
[Station Commander] Viewing all recruiters at your station
[Administrator] Viewing all data across all stations
```

### 2. API Endpoints with Station Filtering

#### GET `/api/recruiter/stats`
**Purpose:** Get statistics (total recruits, QR scans, direct entries)

**Filtering Logic:**
```typescript
if (user.role === 'admin') {
  // All recruits from all stations
  recruits = getAllRecruits();
} else if (user.role === 'station_commander' && user.stationId) {
  // All recruits from station
  stationRecruiters = getRecruitersAtStation(user.stationId);
  recruits = getAllRecruitsFromRecruiters(stationRecruiters);
} else {
  // Only own recruits
  recruits = getRecruitsByRecruiter(userId);
}
```

**Data Returned:**
- Total recruits count (scoped by role)
- QR code scans count (scoped by role)
- Direct entries count (scoped by role)
- Recent recruits list (scoped by role)

#### GET `/api/recruits`
**Purpose:** Get list of recruits for display

**Filtering Logic:** Same as stats endpoint

**Authorization:**
- ✅ Regular recruiter sees only their own recruits
- ✅ Station commander sees all recruits from their station
- ✅ Admin sees all recruits system-wide

#### GET `/api/recruits/:id`
**Purpose:** Get single recruit details

**Authorization Checks:**
```typescript
if (user.role === 'admin') {
  // Can view any recruit
  return recruit;
} else if (user.role === 'station_commander' && user.stationId) {
  // Can view if recruit belongs to station
  recruiter = getRecruiterForRecruit(recruit);
  if (recruiter.stationId === user.stationId) {
    return recruit;
  } else {
    return 403; // Forbidden
  }
} else if (recruit.recruiterId === userId) {
  // Can view own recruit
  return recruit;
} else {
  return 403; // Forbidden
}
```

**Security:**
- ✅ Prevents cross-station data access
- ✅ Validates station membership before showing data
- ✅ Returns 403 Forbidden if unauthorized

#### PATCH `/api/recruits/:id/status`
**Purpose:** Update recruit status (pending, contacted, qualified, disqualified)

**Authorization Checks:** Same logic as GET single recruit

**Security:**
- ✅ Can only update recruits you have permission to view
- ✅ Station commanders can update any recruit at their station
- ✅ Regular recruiters can only update their own recruits
- ✅ Admins can update any recruit

#### GET `/api/surveys/my`
**Purpose:** Get survey responses

**Filtering Logic:**
```typescript
if (user.role === 'admin') {
  // All survey responses
  responses = getAllSurveyResponses();
} else if (user.role === 'station_commander' && user.stationId) {
  // Survey responses from all recruiters at station
  stationRecruiters = getRecruitersAtStation(user.stationId);
  responses = getSurveyResponsesForRecruiters(stationRecruiters);
} else {
  // Only own survey responses
  responses = getSurveyResponsesByRecruiter(userId);
}
```

**Data Returned:**
- Total survey responses (scoped by role)
- Average rating (scoped by role)
- Survey response details (scoped by role)

#### GET `/api/recruits/export/csv`
**Purpose:** Export recruits data to CSV

**Filtering Logic:** Same as `/api/recruits` endpoint

**Security:**
- ✅ Export only includes recruits user has permission to view
- ✅ Station commanders export all station data
- ✅ Regular recruiters export only their data
- ✅ Admins export all data

## Data Flow Examples

### Example 1: Regular Recruiter Login

1. User logs in → Dashboard loads
2. Backend checks: `user.role = 'recruiter'`
3. Stats endpoint returns only user's own data
4. Recruits list shows only user's own recruits
5. Survey responses show only user's own surveys
6. Dashboard displays: User's station badge (green)

**Result:** User sees ONLY their own data, nothing from other recruiters

### Example 2: Station Commander Login

1. User logs in → Dashboard loads
2. Backend checks: `user.role = 'station_commander' && user.stationId = '1G1A'`
3. Backend finds all recruiters with `stationId = '1G1A'`
4. Stats endpoint returns combined data from all station recruiters
5. Recruits list shows all recruits from station
6. Survey responses show all surveys from station
7. Dashboard displays: Station badge + "Station Commander" badge

**Result:** User sees ALL data from their station, nothing from other stations

### Example 3: Admin Login

1. User logs in → Dashboard loads
2. Backend checks: `user.role = 'admin'`
3. Stats endpoint returns all data from all stations
4. Recruits list shows all recruits system-wide
5. Survey responses show all surveys system-wide
6. Dashboard displays: Station badge + "Administrator" badge

**Result:** User sees ALL data across entire system

### Example 4: Cross-Station Data Access Attempt

**Scenario:** Station Commander from NYC tries to view recruit from California station

1. Station Commander clicks recruit detail
2. Request: `GET /api/recruits/:californiaRecruitId`
3. Backend checks:
   - User role: `station_commander`
   - User station: `1G1A` (NYC)
   - Recruit's recruiter station: `6A5A` (California)
   - Comparison: `1G1A !== 6A5A`
4. Response: `403 Forbidden`

**Result:** Cross-station access BLOCKED ✅

## Station Assignment Flow

### New User Registration
1. User selects station from dropdown
2. Station code stored in `users.station_id`
3. User can only request to change later (admin approval required)

### Existing Users
- Migration randomly assigned stations to existing users
- Admin assigned to NYC (1G1A)
- Users can request station changes via profile page

## Security Measures

### Database Level
- ✅ All user queries include `WHERE users.station_id = ?` for SC role
- ✅ Recruit queries filtered by recruiter's station
- ✅ No direct station bypassing possible

### Application Level
- ✅ Role checked on every request
- ✅ Station membership validated before data access
- ✅ Authorization failures return 403 Forbidden
- ✅ No station data exposed in error messages

### Frontend Level
- ✅ Station badge displayed prominently
- ✅ Role badge explains what user can see
- ✅ UI reflects user's actual data scope
- ✅ Export only includes authorized data

## Testing Data Isolation

### Test 1: Regular Recruiter Cannot See Other Recruiter's Data
```bash
# Create two users at different stations
User A: Station 1G1A (NYC)
User B: Station 6A5A (California)

# User A creates recruit
POST /api/recruits (as User A)

# User B tries to view User A's recruit
GET /api/recruits/:userARecruitId (as User B)
Expected: 403 Forbidden ✅
```

### Test 2: Station Commander Sees Only Own Station
```bash
# Station Commander at NYC (1G1A)
# Regular Recruiter also at NYC (1G1A)
# Another Recruiter at California (6A5A)

# Login as Station Commander
GET /api/recruits
Expected: See NYC recruiter's data ✅
Expected: NOT see California recruiter's data ✅
```

### Test 3: Admin Sees Everything
```bash
# Admin user
GET /api/recruits
Expected: See all recruits from all stations ✅

GET /api/recruiter/stats
Expected: Stats include all stations ✅
```

### Test 4: Station Change Updates Data Access
```bash
# User starts at Station A
GET /api/recruits → Returns Station A data

# Admin approves station change to Station B
# User's station_id updated

# User refreshes dashboard
GET /api/recruits → Returns Station B data ✅
```

## Monitoring & Logging

All data access attempts are logged:
```
📊 Stats request for userId: abc123 (role: station_commander)
📊 Recruits accessible: 45
📊 Stats: total=45, qrCode=23, direct=22
```

This allows audit trails for:
- Who accessed what data
- When data was accessed
- What role they had
- What station they belonged to

## Summary

✅ **Data Isolation Implemented:**
- Regular recruiters: Own data only
- Station commanders: Station data only
- Admins: All data

✅ **Cross-Station Protection:**
- Cannot view other station's recruits
- Cannot update other station's recruits
- Cannot access other station's surveys

✅ **Transparency:**
- Dashboard clearly shows station
- Role badges explain data scope
- No hidden data access

✅ **Security:**
- Backend enforcement (not just UI hiding)
- Authorization on every endpoint
- Proper 403 responses for violations
- Audit logging for accountability

## Files Modified

- `client/src/pages/dashboard.tsx` - Added station display and role badges
- `server/routes.ts` - Updated all data endpoints with station filtering:
  - `/api/recruiter/stats`
  - `/api/recruits`
  - `/api/recruits/:id`
  - `/api/recruits/:id/status`
  - `/api/surveys/my`
  - `/api/recruits/export/csv` (already had station filtering)

