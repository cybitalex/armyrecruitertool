# Admin Direct Station Change - Feature Added

## Problem Identified

**Issue**: Admin users saw a message saying they could change their station directly, but there was no UI element (dropdown/form) to actually do it.

**User Feedback**: 
> "as admin account, is that why I do not have a dropdown of stations in profile? although I am assigned in manhattan and getting the message 'Admin Privilege - As an administrator, you can change your station directly without submitting a request.' but do not see anywhere to change it if i want"

## Root Cause

In `client/src/pages/profile.tsx`, the code had logic that:
- ✅ Showed admin privilege message
- ❌ Did NOT provide a form to select new station
- ❌ Backend didn't support direct stationId updates

### Old Code Logic (Broken)
```typescript
) : user?.role === 'admin' ? (
  <Alert className="bg-blue-50 border-blue-200">
    <AlertDescription className="text-blue-800">
      <strong>Admin Privilege</strong>
      <p className="mt-1">
        As an administrator, you can change your station directly without submitting a request.
      </p>
    </AlertDescription>
  </Alert>
) : (
  // Regular user/SC form here
)
```

**Problem**: Admin saw only a message, no form!

## Solution Implemented

### Frontend Changes (`client/src/pages/profile.tsx`)

#### 1. Added Admin-Specific State
```typescript
// Admin direct station change state
const [adminNewStationId, setAdminNewStationId] = useState("");
const [adminStationChangeLoading, setAdminStationChangeLoading] = useState(false);
const [adminStationChangeError, setAdminStationChangeError] = useState("");
const [adminStationChangeSuccess, setAdminStationChangeSuccess] = useState(false);
```

#### 2. Added Admin Station Change Handler
```typescript
const handleAdminStationChange = async (e: React.FormEvent) => {
  e.preventDefault();
  setAdminStationChangeError("");
  setAdminStationChangeSuccess(false);
  
  if (!adminNewStationId) {
    setAdminStationChangeError("Please select a station");
    return;
  }
  
  setAdminStationChangeLoading(true);
  
  try {
    const response = await fetch("/api/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ 
        stationId: adminNewStationId // Send new stationId
      }),
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to change station");
    }
    
    setAdminStationChangeSuccess(true);
    setAdminNewStationId("");
    await refreshUser(); // Refresh user data
    
    // Reload current station
    if (user?.stationId) {
      await loadCurrentStation(adminNewStationId);
    }
    
    // Clear success message after 3 seconds
    setTimeout(() => setAdminStationChangeSuccess(false), 3000);
  } catch (err) {
    setAdminStationChangeError(err instanceof Error ? err.message : "Failed to change station");
  } finally {
    setAdminStationChangeLoading(false);
  }
};
```

#### 3. Replaced Admin Alert with Form
```typescript
) : user?.role === 'admin' ? (
  <form onSubmit={handleAdminStationChange} className="space-y-4">
    <Alert className="bg-blue-50 border-blue-200">
      <Shield className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-800">
        <strong>Admin Privilege</strong>
        <p className="mt-1">
          As an administrator, you can change your station directly without submitting a request.
        </p>
      </AlertDescription>
    </Alert>

    {/* Error/Success alerts */}
    {adminStationChangeError && (/* ... */)}
    {adminStationChangeSuccess && (/* ... */)}

    {/* Searchable Station Dropdown */}
    <div className="space-y-2">
      <Label htmlFor="adminNewStation">Select New Station *</Label>
      <SearchableSelect
        options={stations
          .filter((station) => station.id !== user?.stationId)
          .map((station) => ({
            value: station.id,
            label: `${station.city || station.state}, ${station.state} (${station.stationCode})`,
            searchText: `${station.city} ${station.state} ${station.stationCode} ${station.name}`,
          }))}
        value={adminNewStationId}
        onValueChange={(value) => setAdminNewStationId(value)}
        placeholder="Search for new station..."
        searchPlaceholder="Type to search stations..."
        emptyText="No stations found"
      />
      <p className="text-xs text-gray-600">
        Your current station is excluded from the list
      </p>
    </div>

    {/* Submit Button */}
    <Button
      type="submit"
      className="w-full bg-blue-700 hover:bg-blue-800"
      disabled={adminStationChangeLoading || !adminNewStationId}
    >
      {adminStationChangeLoading ? "Changing Station..." : "Change Station (Admin)"}
    </Button>
  </form>
) : (
  // Regular user/SC form
)
```

### Backend Changes (`server/routes.ts`)

#### Updated `/api/profile` PUT Endpoint

**Added:**
1. **Role check** before allowing stationId updates
2. **Admin-only permission** for direct station changes
3. **Station info retrieval** to return updated station details

```typescript
app.put("/api/profile", async (req, res) => {
  try {
    const userId = (req as any).session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Get current user to check role
    const [currentUser] = await db.select().from(users).where(eq(users.id, userId));
    if (!currentUser) {
      return res.status(404).json({ error: "User not found" });
    }

    const { fullName, rank, unit, phoneNumber, profilePicture, stationId } = req.body;

    // Build update object
    const updateData: any = {
      fullName: fullName || undefined,
      rank: rank || null,
      unit: unit || null,
      phoneNumber: phoneNumber || null,
      profilePicture: profilePicture || null,
      updatedAt: new Date(),
    };

    // Only admins can directly change their station
    if (stationId !== undefined) {
      if (currentUser.role === 'admin') {
        updateData.stationId = stationId;
        console.log(`👑 Admin ${currentUser.email} changing station to ${stationId}`);
      } else {
        return res.status(403).json({ 
          error: "Only administrators can directly change their station. Please submit a station change request." 
        });
      }
    }

    // Update user profile
    const [updatedUser] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();

    console.log(`✅ Updated profile for user ${userId}`);

    // Get station info if stationId exists
    let stationInfo = null;
    if (updatedUser.stationId) {
      const [station] = await db.select().from(stations).where(eq(stations.id, updatedUser.stationId));
      if (station) {
        stationInfo = {
          stationId: station.id,
          stationCode: station.stationCode,
          stationName: station.name,
          stationCity: station.city,
          stationState: station.state,
        };
      }
    }

    // Return user data without sensitive fields
    const { passwordHash, verificationToken, resetPasswordToken, ...userData } = updatedUser;
    res.json({ user: { ...userData, ...stationInfo } });
  } catch (error) {
    console.error('❌ Failed to update profile:', error);
    res.status(500).json({ error: "Failed to update profile" });
  }
});
```

**Security Features:**
- ✅ Only admins can directly update `stationId`
- ✅ Regular users get 403 error if they try
- ✅ Station Commanders must go through request system
- ✅ Returns updated station info in response

## Feature Comparison

### Admin Users
**Before**: ❌ Saw message, couldn't change station
**After**: ✅ See searchable dropdown, can instantly change station

### Station Commander Users
**Before**: ✅ Submit request → admin approval → station change
**After**: ✅ Same (unchanged, correct behavior)

### Regular Recruiter Users
**Before**: ✅ Submit request → admin approval → station change
**After**: ✅ Same (unchanged, correct behavior)

## How It Works Now

### Admin Flow:
1. **Go to Profile page**
2. **Scroll to "Change Recruiting Station" section**
3. **See "Admin Privilege" badge**
4. **Use searchable dropdown** to find new station
5. **Click "Change Station (Admin)"**
6. **Station changes immediately** (no approval needed)
7. **Dashboard updates** to show new station
8. **Station Commander view** (if used) shows users at new station

### Regular User/Station Commander Flow:
1. **Go to Profile page**
2. **Scroll to "Change Recruiting Station" section**
3. **Use searchable dropdown** to find new station
4. **Enter reason** for transfer
5. **Click "Submit Station Change Request"**
6. **Wait for admin approval**
7. **Receive email** when approved/denied
8. **Station updates** after approval

## Testing

### Test 1: Admin Can Change Station
1. Log in as admin (moran.alex@icloud.com)
2. Go to Profile
3. Current station: Manhattan (1G1A)
4. Change to: Brooklyn (1G2B)
5. **Expected**: Station changes immediately, no request needed ✅

### Test 2: Non-Admin Cannot Bypass Request
1. Try to send `PUT /api/profile` with `stationId` from non-admin account
2. **Expected**: 403 Forbidden error ✅

### Test 3: Station Commander Must Request
1. Log in as station commander
2. Go to Profile
3. See warning about demotion
4. Must fill out request form
5. **Expected**: Request submitted for admin approval ✅

## Security Notes

### Admin Privileges (Role-Based)
- ✅ Admins bypass station change requests
- ✅ Admins see all data across all stations
- ✅ Admins can approve/deny all requests
- ✅ Admins maintain admin role when changing stations

### Station Commander Constraints
- ✅ Must request station changes
- ✅ Automatically demoted to recruiter on transfer
- ✅ See only users at their station
- ⚠️ Cannot change station without approval

### Regular Recruiter Constraints
- ✅ Must request station changes
- ✅ See only their own data
- ⚠️ Cannot change station without approval

## Files Modified

1. **`client/src/pages/profile.tsx`**
   - Added admin-specific state variables
   - Added `handleAdminStationChange` function
   - Replaced admin alert with full form

2. **`server/routes.ts`**
   - Updated `/api/profile` PUT endpoint
   - Added role-based stationId update logic
   - Added station info retrieval in response

## Deployment

To deploy this fix:

```bash
cd /Users/alexmoran/Documents/programming/ArmyRecruitTool
npm run build
docker build -t army-recruit-tool:latest .
kubectl rollout restart deployment/army-app
```

Or use the automated script:
```bash
./deploy-profile-fixes.sh
```

## Summary

✅ **Admin users can now directly change their station via dropdown**  
✅ **Backend enforces admin-only permission for direct changes**  
✅ **Regular users and station commanders still go through request system**  
✅ **No database migration needed**  
✅ **All security constraints maintained**  

The feature is now complete and ready to deploy!

