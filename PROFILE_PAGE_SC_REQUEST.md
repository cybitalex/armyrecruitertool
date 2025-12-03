# Station Commander Request from Profile Page

## 🎯 New Feature Added

Existing users can now request Station Commander access directly from their profile page!

## ✨ What's New

### Before:
- Only new users during registration could request station commander access
- Existing users had no way to upgrade their account

### After:
- ✅ Existing users can request station commander access from their profile page
- ✅ Same approval system with email notification
- ✅ Visual status indicators (pending, approved, denied)
- ✅ Prevents duplicate requests

## 📍 How It Works

### 1. User Goes to Profile Page
- Navigate to `/profile`
- See their normal profile edit form
- Below that, see "Request Station Commander Access" card

### 2. Card Shows Different States

**If user is already Station Commander:**
- Card doesn't appear (they already have access)

**If user has NO request:**
- Shows form with justification textarea
- "Submit Station Commander Request" button

**If user has PENDING request:**
- Shows yellow alert: "Request Pending"
- No form (prevents duplicate requests)
- Message: "You will receive an email notification once it has been processed"

**If previous request was DENIED:**
- Shows red alert explaining denial
- Form appears again (can submit new request with better justification)

### 3. User Submits Request
- Fills out justification (required)
- Clicks "Submit Station Commander Request"
- Success message appears
- Email sent to alex.cybitdevs@gmail.com with approve/deny buttons

### 4. Email Approval
- Same token-based system as registration
- Admin clicks approve or deny in email
- User receives notification email
- User's role updates automatically

## 🔐 Backend Endpoints

### POST `/api/station-commander/request`
Submit a station commander request from profile page

**Request Body:**
```json
{
  "justification": "I am the station commander at..."
}
```

**Response:**
```json
{
  "message": "Station commander request submitted successfully",
  "requestId": "uuid"
}
```

**Validations:**
- ✅ User must be authenticated
- ✅ Justification required
- ✅ Checks if user already has station commander access
- ✅ Checks for existing pending requests
- ✅ Prevents duplicate submissions

### GET `/api/station-commander/my-request`
Get user's most recent station commander request status

**Response:**
```json
{
  "request": {
    "id": "uuid",
    "status": "pending|approved|denied",
    "justification": "...",
    "createdAt": "2025-11-23T..."
  }
}
```

## 🎨 UI Features

### Status Indicators

**Pending Request:**
```
⏱️ Request Pending
Your station commander access request is currently under review.
You will receive an email notification once it has been processed.
```

**Previous Denial:**
```
⚠️ Your previous station commander request was denied.
You can submit a new request with additional justification.
```

**Success Message:**
```
✅ Request submitted successfully!
An admin will review your request shortly.
```

### Information Card
Shows users what Station Commanders can do:
- View statistics for all recruiters at their station
- See monthly and all-time performance metrics
- Export comprehensive Excel reports
- Track leads, prospects, and applicants

## 📧 Email Flow

```
User submits from profile → Email to alex.cybitdevs@gmail.com
                             ↓
                     Admin clicks approve/deny
                             ↓
                     System updates user role
                             ↓
                     User receives notification email
```

## 🛡️ Security Features

1. **Authentication Required**: Must be logged in
2. **Prevents Duplicates**: Can't submit if pending request exists
3. **Token-Based Approval**: Same secure system as registration
4. **7-Day Expiration**: Approval links expire for security
5. **Role Verification**: Checks user doesn't already have access

## 📊 User Experience

### For Regular Recruiters:
1. Go to profile page
2. See "Request Station Commander Access" card
3. Read about what station commanders can do
4. Fill out justification
5. Submit request
6. See pending status
7. Wait for email notification

### For Pending Users:
1. Go to profile page
2. See yellow "Request Pending" alert
3. Know their request is being reviewed
4. Can't submit duplicate request

### For Denied Users:
1. Go to profile page
2. See red alert about denial
3. Can submit new request with better justification
4. Form appears again

### For Station Commanders/Admins:
1. Go to profile page
2. Don't see the request card
3. Already have access to station commander features

## 🚀 Deployment

All changes are included in the main deployment:

```bash
cd /Users/alexmoran/Documents/programming/cybit-k8s
./deploy-station-commander-feature.sh
```

## 🧪 Testing Checklist

1. **Test as Regular Recruiter:**
   - [ ] Login as regular recruiter
   - [ ] Go to `/profile`
   - [ ] See "Request Station Commander Access" card
   - [ ] Fill out justification
   - [ ] Submit request
   - [ ] See success message
   - [ ] Check alex.cybitdevs@gmail.com for email
   - [ ] Refresh page, should see "Request Pending"

2. **Test Email Approval:**
   - [ ] Click "Approve" in email
   - [ ] Should redirect to success page
   - [ ] User receives approval email
   - [ ] User can now access station commander features

3. **Test Duplicate Prevention:**
   - [ ] Submit request
   - [ ] Refresh page
   - [ ] Should see "Request Pending"
   - [ ] Form should NOT appear
   - [ ] Can't submit duplicate

4. **Test After Denial:**
   - [ ] Get request denied via email
   - [ ] Go to profile page
   - [ ] Should see denial alert
   - [ ] Form should appear again
   - [ ] Can submit new request

## 📁 Files Modified

1. **Frontend:**
   - `client/src/pages/profile.tsx` - Added station commander request section

2. **Backend:**
   - `server/routes.ts` - Added endpoints for requesting and checking status

3. **No Database Changes:**
   - Uses existing `station_commander_requests` table
   - Uses existing approval token system

## 💡 Benefits

1. ✅ **Flexibility**: Existing users don't need to re-register
2. ✅ **Convenience**: Can request from their existing account
3. ✅ **Visibility**: Clear status indicators
4. ✅ **Security**: Same secure approval system
5. ✅ **User-Friendly**: No need to contact admin directly

---

**Ready to deploy!** This feature integrates seamlessly with the existing station commander system. 🎉

