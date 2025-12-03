# Station Commander Request Flow

## Overview

Station commander requests are now **explicitly tied to the user's assigned station**. When someone requests station commander access, they are requesting to become a commander **for their current station only**.

## How It Works

### 1. During Registration

**Scenario:** User registers as a Station Commander

**Flow:**
1. User selects "Station Commander" as account type
2. User selects their recruiting station (e.g., "New York - 1G1A")
3. User provides justification for why they need commander access
4. User submits registration

**What Happens:**
```typescript
// User is created with:
- role: 'pending_station_commander'
- stationId: '1G1A' (NYC)

// Station Commander Request is created with:
- userId: user.id
- requestedStationId: '1G1A' (same as user's station)
- justification: "I am the station commander at NYC..."
- status: 'pending'
```

**Result:**
- User can log in but has recruiter permissions until approved
- Request is sent to admin email for approval
- Request is explicitly for commanding their assigned station

### 2. From Profile Page

**Scenario:** Existing user requests Station Commander access

**Flow:**
1. User navigates to Profile page
2. Scrolls to "Request Station Commander Access" card
3. Provides justification
4. Submits request

**What Happens:**
```typescript
// Station Commander Request is created with:
- userId: user.id
- requestedStationId: user.stationId (their current station)
- justification: "I have been promoted to station commander..."
- status: 'pending'
```

**Result:**
- Request is explicitly for commanding their current station
- Admin can see which station they want to command
- User's role remains 'recruiter' until approved

### 3. Admin Review

**What Admin Sees:**

```
┌────────────────────────────────────────────────────────────┐
│ John Smith (SSG)                                           │
│ Email: john.smith@army.mil                                 │
│ Unit: 1st Battalion, 75th Rangers                          │
│ Requested: Nov 24, 2025 at 3:45 PM                        │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 🗺️ Requesting Command of:                          │   │
│ │ New York City Recruiting Station                    │   │
│ │ Code: 1G1A • New York                               │   │
│ └─────────────────────────────────────────────────────┘   │
│                                                             │
│ Justification:                                             │
│ I have been serving as the acting station commander...     │
│                                                             │
│ [✅ Approve]  [❌ Deny]                                    │
└────────────────────────────────────────────────────────────┘
```

**Admin Actions:**
- **Approve**: User becomes station commander for their assigned station
- **Deny**: User remains regular recruiter, can request again later

### 4. Approval Process

**When Approved:**
```typescript
// User updated:
- role: 'station_commander'
// (stationId remains the same)

// Request updated:
- status: 'approved'
- reviewedBy: admin.id
- reviewedAt: timestamp
```

**Result:**
- User can now view all recruits at their station
- User can view all survey responses at their station
- User can update status of any recruit at their station
- Dashboard shows "Station Commander" badge

## Important Rules

### ✅ Station Commander Access is Station-Specific

**You can only be a station commander for ONE station at a time:**
- The station you're currently assigned to
- Cannot request to command a different station
- If you want to command a different station, you must:
  1. First request a station transfer
  2. Wait for transfer approval
  3. Then request station commander access for new station

### ✅ One Request at a Time

**Users cannot spam requests:**
- Only one pending station commander request allowed
- If denied, can submit a new request with different justification
- If approved, cannot request again (already a commander)

### ✅ Automatic Station Assignment

**No manual station selection for commander requests:**
- System automatically uses `user.stationId`
- Prevents requesting command of wrong station
- Ensures data integrity and proper access control

## Example Scenarios

### Scenario 1: New Recruiter Promoted to Station Commander

```
Step 1: User registered as recruiter at NYC (1G1A)
Step 2: Three months later, promoted to station commander
Step 3: User goes to Profile → Request Station Commander Access
Step 4: Provides justification: "Promoted to station commander on 11/20/2025"
Step 5: Request created with requestedStationId = '1G1A'
Step 6: Admin reviews, sees they want to command NYC
Step 7: Admin approves
Step 8: User now has station commander access for NYC station
```

### Scenario 2: Transfer Then Request Commander

```
Step 1: User is station commander at NYC (1G1A)
Step 2: User receives PCS orders to California
Step 3: User goes to Profile → Request Station Change
Step 4: Requests transfer to California (6A5A), provides PCS orders as reason
Step 5: Admin approves station transfer
Step 6: User's stationId updated to '6A5A'
Step 7: User's role reverts to 'recruiter' (no longer commander)
Step 8: User goes to Profile → Request Station Commander Access
Step 9: Request created with requestedStationId = '6A5A' (new station)
Step 10: Admin reviews, sees they want to command California
Step 11: Admin approves
Step 12: User now has station commander access for California station
```

### Scenario 3: Registration as Station Commander

```
Step 1: New user registers, selects account type "Station Commander"
Step 2: Selects station: Texas (5A4A)
Step 3: Provides justification: "I am the station commander at Texas recruiting station"
Step 4: Submits registration
Step 5: User created with:
   - role: 'pending_station_commander'
   - stationId: '5A4A'
Step 6: Request created with:
   - requestedStationId: '5A4A' (same as user's station)
Step 7: Email sent to admin with approve/deny links
Step 8: Admin clicks approve link
Step 9: User's role updated to 'station_commander'
Step 10: User can now command Texas station
```

## Database Schema

### station_commander_requests Table

```sql
CREATE TABLE station_commander_requests (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  requested_station_id UUID REFERENCES stations(id), -- ← NOW POPULATED!
  justification TEXT,
  status TEXT DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  approval_token TEXT UNIQUE,
  token_expires TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Key Change:**
- `requested_station_id` is now **always populated** with the user's current station
- Previously it was `NULL` (not specified)
- This makes the request explicit and trackable

## API Changes

### POST `/api/station-commander/request`

**Before:**
```json
{
  "userId": "abc-123",
  "requestedStationId": null,  // ← Not specified
  "justification": "..."
}
```

**After:**
```json
{
  "userId": "abc-123",
  "requestedStationId": "1G1A",  // ← User's current station
  "justification": "..."
}
```

### GET `/api/admin/station-commander-requests`

**Before:**
```json
{
  "requests": [
    {
      "id": "...",
      "userName": "John Smith",
      "justification": "..."
      // No station info
    }
  ]
}
```

**After:**
```json
{
  "requests": [
    {
      "id": "...",
      "userName": "John Smith",
      "requestedStationId": "1G1A",
      "requestedStation": {
        "name": "New York City Recruiting Station",
        "stationCode": "1G1A",
        "state": "New York"
      },
      "justification": "..."
    }
  ]
}
```

## Benefits

### ✅ Clarity
- Admin can see exactly which station the user wants to command
- No ambiguity about which station they're requesting

### ✅ Accountability
- Clear audit trail of who requested what station
- Can track if someone tries to request wrong station

### ✅ Data Integrity
- Cannot request to command a station you're not assigned to
- Forces proper workflow: transfer first, then request commander access

### ✅ Security
- Prevents privilege escalation to wrong station
- Ensures station commanders can only command their assigned station

### ✅ User Experience
- Admin sees relevant context (which station)
- No confusion about what they're approving
- Green badge makes station prominent in UI

## Migration Notes

**Existing Requests:**
- Old requests with `requestedStationId = NULL` will still work
- System will infer station from user's current assignment
- New requests will all have explicit station assignment

**No Data Migration Needed:**
- Schema already has `requested_station_id` column
- Just updating application logic to populate it
- Backwards compatible with existing requests

## Testing

### Test 1: Registration Request
```bash
1. Register as station commander
2. Select station NYC (1G1A)
3. Submit
4. Check database:
   SELECT requested_station_id FROM station_commander_requests 
   WHERE user_id = '...';
Expected: '1G1A' ✅
```

### Test 2: Profile Request
```bash
1. Login as recruiter at California (6A5A)
2. Go to Profile
3. Request station commander access
4. Check database:
   SELECT requested_station_id FROM station_commander_requests 
   WHERE user_id = '...';
Expected: '6A5A' ✅
```

### Test 3: Admin View
```bash
1. Login as admin
2. Go to Admin Dashboard
3. Click "Station Commander Requests" tab
4. Should see green badge with station info
Expected: "Requesting Command of: [Station Name] Code: [Code] • [State]" ✅
```

## Summary

🎯 **Station commander requests are now explicitly tied to the user's assigned station**

✅ **Populated automatically** - No user input needed for which station
✅ **Displayed to admin** - Clear which station they want to command
✅ **Enforced by system** - Cannot request wrong station
✅ **Audit friendly** - Clear record of what was requested

This ensures proper access control and prevents confusion about which station a user is requesting to command.

