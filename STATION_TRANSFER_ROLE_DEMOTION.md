# Station Transfer Role Demotion - Security Feature

## Overview

When a **Station Commander** transfers to a new station, they are **automatically demoted to regular recruiter**. This is a critical security feature that ensures:
- Station commanders only have authority at their assigned station
- No automatic privilege escalation at new stations
- Proper authorization workflow for commander access

## How It Works

### Scenario: Station Commander Transfers

**Before Transfer:**
```
User: John Smith
Role: station_commander
Station: NYC (1G1A)
Access: Can view/manage all recruits at NYC station
```

**User Actions:**
1. Goes to Profile page
2. Requests transfer to California (6A5A)
3. Provides reason: "PCS orders to California"
4. Submits request

**Admin Actions:**
1. Reviews request in Admin Dashboard
2. Sees: NYC → California transfer
3. Approves transfer

**After Transfer (AUTOMATIC):**
```
User: John Smith
Role: recruiter (DEMOTED)
Station: California (6A5A)
Access: Can only view/manage own recruits
```

### If User Wants Commander Access at New Station

**Step 1:** Wait for transfer to complete
```
✅ Transfer approved
✅ Now at California station
✅ Role changed to recruiter
```

**Step 2:** Request Station Commander access at new station
```
Go to Profile → Request Station Commander Access
Provide justification: "I am the new station commander at California..."
Submit request
```

**Step 3:** Admin approves new commander request
```
✅ Request approved
✅ Role changed to station_commander
✅ Can now manage California station
```

## Backend Implementation

### Station Change Approval Endpoint

```typescript
app.post("/api/admin/station-change-requests/:requestId/approve", async (req, res) => {
  // Get the user
  const [user] = await db.select().from(users).where(eq(users.id, request.userId));

  // Prepare update data
  const updateData: any = { stationId: request.requestedStationId };
  
  // Demote station commanders to regular recruiters
  if (user.role === 'station_commander') {
    updateData.role = 'recruiter';
    console.log(`🔽 Demoting station commander ${user.email} to recruiter due to station transfer`);
  }

  // Update user
  await db.update(users).set(updateData).where(eq(users.id, request.userId));
});
```

**What Gets Updated:**
- ✅ `stationId` → New station
- ✅ `role` → `recruiter` (if currently `station_commander`)

**What Stays the Same:**
- Email, name, rank, unit (personal info)
- QR code
- Historical data (recruits they created at old station)

## Frontend Warnings

### Orange Alert Box (Station Commanders Only)

When a station commander views the station change form, they see:

```
⚠️ Important: As a Station Commander, if you transfer to a new station, 
you will be demoted to regular recruiter. You will need to request 
Station Commander access again at your new station after the transfer 
is approved.
```

### Info Box Enhancement

The blue info box shows:

```
Important Information:
• Station change requests require administrator approval
• You will receive an email notification once reviewed
• Station Commanders will be demoted to recruiter upon transfer
```

## Admin Notifications

### Approval Message

When admin approves a station commander's transfer:

```json
{
  "message": "Station change approved. User has been transferred and demoted to recruiter (must request station commander access at new station)."
}
```

When admin approves a regular recruiter's transfer:

```json
{
  "message": "Station change request approved successfully"
}
```

## Security Benefits

### ✅ Prevents Privilege Escalation
- Can't automatically become commander at new station
- Forces re-authorization at destination station
- Admin explicitly approves commander access

### ✅ Proper Authorization Workflow
- Transfer = change of station only
- Commander access = separate authorization
- Two-step process ensures proper review

### ✅ Data Isolation
- Station commanders only manage their assigned station
- No cross-station authority
- Clear organizational boundaries

### ✅ Audit Trail
- Transfer logged separately from role changes
- Clear record of when/why someone lost commander access
- Admin can see demotion happened during transfer

## Example Scenarios

### Scenario 1: PCS Orders Transfer

**Timeline:**
```
Day 1:  Station Commander at NYC receives PCS orders to Texas
Day 2:  Submits station change request (NYC → Texas)
Day 3:  Admin approves transfer
        ↓ Automatic demotion: station_commander → recruiter
Day 3:  User logs in, sees they're now at Texas as recruiter
Day 4:  User requests Station Commander access at Texas
Day 5:  Admin approves commander request for Texas
        ↓ Promotion: recruiter → station_commander
Day 5:  User is now Station Commander at Texas
```

**Result:** Proper authorization at each step ✅

### Scenario 2: Temporary Duty Assignment

**Timeline:**
```
Day 1:  Station Commander at California temporarily assigned to Nevada
Day 2:  Submits station change request (California → Nevada)
Day 3:  Admin approves transfer
        ↓ Automatic demotion: station_commander → recruiter
Day 3:  Works as recruiter at Nevada (temporary duty)
Week 12: TDY ends, submits station change back to California
Week 12: Admin approves transfer back to California
        ↓ Remains as recruiter
Week 12: Requests Station Commander access at California again
Week 12: Admin approves
        ↓ Promotion: recruiter → station_commander
```

**Result:** No automatic re-elevation of privileges ✅

### Scenario 3: Regular Recruiter Transfer

**Timeline:**
```
Day 1:  Regular recruiter at Florida transfers to Georgia
Day 2:  Submits station change request
Day 3:  Admin approves transfer
        ↓ No role change (already recruiter)
Day 3:  User is recruiter at Georgia
```

**Result:** No impact on regular recruiters ✅

## Database State Changes

### Before Transfer Approval
```sql
SELECT id, email, role, station_id FROM users WHERE email = 'john.smith@army.mil';
```
```
id: abc-123
email: john.smith@army.mil
role: station_commander
station_id: 1G1A (NYC)
```

### After Transfer Approval
```sql
SELECT id, email, role, station_id FROM users WHERE email = 'john.smith@army.mil';
```
```
id: abc-123
email: john.smith@army.mil
role: recruiter           ← CHANGED
station_id: 6A5A          ← CHANGED (California)
```

## Admin Dashboard Impact

### What Admin Sees When Approving

**Transfer Request:**
```
┌─────────────────────────────────────────────────┐
│ John Smith                                      │
│ Email: john.smith@army.mil                      │
│ Role: Station Commander                         │
│                                                  │
│ Current:   NYC (1G1A)                           │
│ Requested: California (6A5A)                    │
│                                                  │
│ Reason: "PCS orders to California base"         │
│                                                  │
│ [Approve] [Deny]                                │
└─────────────────────────────────────────────────┘
```

**After Clicking Approve:**
```
✅ Station change approved. User has been transferred and 
demoted to recruiter (must request station commander 
access at new station).
```

## Testing

### Test 1: Station Commander Transfer
```bash
# Setup
1. User is station_commander at NYC
2. Verify: SELECT role FROM users WHERE id = 'abc-123'
   Expected: 'station_commander'

# Action
3. Submit station change request to California
4. Admin approves request

# Verify
5. SELECT role, station_id FROM users WHERE id = 'abc-123'
   Expected: role = 'recruiter', station_id = '6A5A'
6. Login as user, verify cannot see NYC station data
7. Verify can only see own recruits at California
```

### Test 2: Regular Recruiter Transfer
```bash
# Setup
1. User is recruiter at Texas
2. Verify: SELECT role FROM users WHERE id = 'def-456'
   Expected: 'recruiter'

# Action
3. Submit station change request to Florida
4. Admin approves request

# Verify
5. SELECT role, station_id FROM users WHERE id = 'def-456'
   Expected: role = 'recruiter', station_id = '3A2A'
   (Role unchanged)
```

### Test 3: Re-request Commander Access
```bash
# Setup (following Test 1)
1. User is now recruiter at California (after transfer)

# Action
2. Go to Profile → Request Station Commander Access
3. Submit request for California station
4. Admin approves

# Verify
5. SELECT role FROM users WHERE id = 'abc-123'
   Expected: 'station_commander'
6. Verify can now see all California station data
```

## Logging

All role changes are logged:

```bash
🔽 Demoting station commander john.smith@army.mil to recruiter due to station transfer
```

This appears in application logs for audit purposes.

## Edge Cases Handled

### ✅ Admin Transfer
- Admins can change their own station directly (no request)
- Admin role never gets demoted (highest privilege level)
- Admins retain admin role at any station

### ✅ Pending Station Commander
- User with `pending_station_commander` role transfers
- Remains as pending or recruiter (depending on previous state)
- Pending request stays tied to old station (likely needs re-request)

### ✅ Multiple Transfers
- User can transfer multiple times
- Each transfer maintains demotion logic
- Must request commander access at each new station

### ✅ Transfer Back to Original Station
- If commander at NYC, transfers to Texas, then back to NYC
- Must request commander access again at NYC
- No automatic restoration of previous commander status

## Summary

🎯 **Station transfers automatically demote station commanders to recruiters**

✅ **Security:** Prevents automatic privilege escalation
✅ **Clarity:** Users warned before submitting transfer
✅ **Process:** Must request commander access at new station
✅ **Audit:** All role changes logged
✅ **Proper:** Two-step authorization (transfer + commander request)

This ensures organizational security and proper chain of command at each recruiting station.

## Files Modified

- `server/routes.ts` - Added automatic demotion logic in transfer approval
- `client/src/pages/profile.tsx` - Added warning alerts for station commanders
- `STATION_TRANSFER_ROLE_DEMOTION.md` - This documentation

