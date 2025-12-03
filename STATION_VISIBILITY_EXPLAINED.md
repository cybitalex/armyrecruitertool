# Station Visibility & Data Isolation - How It Works

## Your Questions Answered

### Q1: "If users are randomly assigned to random locations, how am I able to see everyone under the station overview page?"

**A: You WON'T see everyone - only users at YOUR station!**

Here's how it works:

#### Example Scenario

**Database has 20 users total:**
```
User                    Station              Role
----------------------------------------------------------
moran.alex@icloud.com   Manhattan (1G1A)     admin
recruiter1@army.mil     Manhattan (1G1A)     recruiter
recruiter2@army.mil     Manhattan (1G1A)     recruiter
recruiter3@army.mil     Manhattan (1G1A)     station_commander
recruiter4@army.mil     Manhattan (1G1A)     recruiter

recruiter5@army.mil     Brooklyn (1G2B)      recruiter
recruiter6@army.mil     Brooklyn (1G2B)      recruiter
recruiter7@army.mil     Brooklyn (1G2B)      station_commander

recruiter8@army.mil     Los Angeles (CA-001) recruiter
recruiter9@army.mil     Los Angeles (CA-001) recruiter
... (11 more users at other stations)
```

#### What Each Role Sees

**As Admin (moran.alex@icloud.com)**:
- ✅ See ALL 20 users across all stations
- ✅ Can export data for all stations
- ✅ Can manage all requests
- 📍 Your station: Manhattan (1G1A)

**As Station Commander at Manhattan (recruiter3@army.mil)**:
- ✅ See only 5 users at Manhattan (1G1A)
- ❌ Cannot see Brooklyn users
- ❌ Cannot see LA users
- ✅ Can export only Manhattan data
- 📍 Your station: Manhattan (1G1A)

**As Station Commander at Brooklyn (recruiter7@army.mil)**:
- ✅ See only 3 users at Brooklyn (1G2B)
- ❌ Cannot see Manhattan users
- ❌ Cannot see LA users
- ✅ Can export only Brooklyn data
- 📍 Your station: Brooklyn (1G2B)

**As Regular Recruiter (recruiter1@army.mil)**:
- ✅ See ONLY your own data
- ❌ Cannot see other recruiters at your station
- ❌ Cannot see other stations
- ❌ Cannot export station data
- 📍 Your station: Manhattan (1G1A)

### Q2: "On my profile I do not see anything where I can change my station"

**A: The feature IS there - we've added better visibility!**

#### What Was Fixed

**Before**: 
- Station change card might appear broken
- No loading states
- No feedback if stations weren't loading

**After**:
- ✅ Shows "Loading stations..." while fetching
- ✅ Shows "Loading your current station..." 
- ✅ Clear error if no station assigned
- ✅ Console logs for debugging

#### How to Verify

1. **Open browser console** (F12)
2. **Go to Profile page**
3. **You should see**:
   ```
   ✅ Loaded 50 stations
   ✅ Loaded current station: {name: "Manhattan...", ...}
   ```
4. **Scroll down** - the "Change Recruiting Station" card should be visible

## Backend Security

### How Data Isolation Works

#### GET /api/recruits
```typescript
// Regular recruiter - only their own
const recruits = await db
  .select()
  .from(recruits)
  .where(eq(recruits.userId, currentUserId));

// Station Commander - only their station
const recruits = await db
  .select()
  .from(recruits)
  .innerJoin(users, eq(recruits.userId, users.id))
  .where(eq(users.stationId, currentUserStationId));

// Admin - all data
const recruits = await db
  .select()
  .from(recruits);
```

#### GET /api/station-commander/recruiters
```typescript
// Only users at the same station
const stationUsers = await db
  .select()
  .from(users)
  .where(eq(users.stationId, currentUserStationId));
```

### Random Assignment Impact

When users are randomly assigned:
- **Some will be at YOUR station** → You'll see them (if Station Commander)
- **Some will be at OTHER stations** → You WON'T see them

This is CORRECT behavior! It ensures:
- ✅ Data privacy
- ✅ Station-level management
- ✅ Realistic testing environment

## Current vs Future State

### Current (50 State-Level Stations)
```
AL-001  Alabama Recruiting Station
AK-001  Alaska Recruiting Station
AZ-001  Arizona Recruiting Station
...
1G1A    New York Recruiting Station (if admin)
```

### Future (215 City-Level Stations)
```
1G1A    Manhattan Recruiting Station
1G2B    Brooklyn Recruiting Station
1G3C    Bronx Recruiting Station
CA1D    Los Angeles Recruiting Station
CA2E    San Diego Recruiting Station
...
```

## Testing Guide

### Test 1: Regular Recruiter Can See Only Their Data

1. Create 2 recruiter accounts
2. Add leads/prospects to each
3. Log in as recruiter1
4. Verify you ONLY see your own leads
5. Log in as recruiter2
6. Verify you ONLY see your own leads

**Expected**: Each sees only their own data ✅

### Test 2: Station Commander Sees Their Station

1. Create 1 station commander (Station A)
2. Create 3 recruiters at Station A
3. Create 2 recruiters at Station B
4. Log in as station commander
5. Check dashboard

**Expected**: See 4 total users (SC + 3 recruiters at Station A) ✅

### Test 3: Admin Sees Everything

1. Log in as admin (moran.alex@icloud.com)
2. Check dashboard

**Expected**: See all users across all stations ✅

### Test 4: Station Change Visible to All

1. Log in as any user type
2. Go to Profile page
3. Scroll down

**Expected**: See "Change Recruiting Station" card ✅

## Troubleshooting

### "I don't see the station change card"
- ✅ Check browser console for errors
- ✅ Verify `/api/stations` returns data (Network tab)
- ✅ Make sure you've deployed the latest code
- ✅ Hard refresh (Cmd+Shift+R)

### "Station commander dashboard is empty"
- ✅ Check if other users share your station
- ✅ Run `verify-station-setup.sh` to see assignments
- ✅ You may be the only user at your station (expected if random)

### "Regular user sees other users' data"
- ❌ This is a BUG! Should never happen
- ✅ Check backend filtering logic
- ✅ Verify JWT token has correct user ID
- ✅ Check API responses in Network tab

## Summary

| Role                | Own Data | Station Data | All Stations | Change Station |
|---------------------|----------|--------------|--------------|----------------|
| Regular Recruiter   | ✅       | ❌           | ❌           | ✅ (request)   |
| Station Commander   | ✅       | ✅           | ❌           | ✅ (request)   |
| Admin               | ✅       | ✅           | ✅           | ✅ (direct)    |

**Random assignment is CORRECT** - it simulates real-world station distribution!

**Station change card IS visible** - we've just made it more obvious with loading states!

**Data isolation WORKS** - backend filters by stationId correctly!

