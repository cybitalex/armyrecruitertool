# QR Code Scan Tracking Feature

## Overview

This feature adds comprehensive tracking for QR code scans, allowing recruiters to see:
- **How many times** their QR code was scanned (page visits)
- **How many scans** resulted in completed applications
- **Conversion rate** percentage
- Separate tracking for application vs survey QR codes

### Problem Solved

**Before**: Only tracked applications, not scans
- QR Code Scans counter = Applications from QR codes
- No way to know if QR placement is effective
- Can't measure drop-off rates

**After**: Track everything
- Separate counters for scans vs applications
- Conversion rate calculation
- Better insights for optimization

## What Gets Tracked

### Application QR Scans
When someone scans the application QR code (`/apply?r=<code>`):
- ✅ Page visit is logged immediately
- ✅ Timestamp recorded
- ✅ IP address captured (for geographic insights)
- ✅ Device/browser info saved (user agent)
- ✅ Referrer tracked (where they came from)
- ✅ Linked to application if they complete the form

### Survey QR Scans  
When someone scans the survey QR code (`/survey?r=<code>`):
- ✅ Same tracking as application scans
- ✅ Separate `scanType` field for analytics

## Database Schema

### New Table: `qr_scans`

```sql
CREATE TABLE qr_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruiter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  qr_code TEXT NOT NULL,
  scan_type TEXT NOT NULL DEFAULT 'application', -- 'application' or 'survey'
  ip_address TEXT,
  user_agent TEXT,
  referrer TEXT,
  converted_to_application BOOLEAN DEFAULT FALSE,
  converted_to_survey BOOLEAN DEFAULT FALSE,
  application_id UUID REFERENCES recruits(id) ON DELETE SET NULL,
  survey_response_id UUID REFERENCES qr_survey_responses(id) ON DELETE SET NULL,
  scanned_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### Indexes (for performance)
- `recruiter_id` - Fast lookups by recruiter
- `qr_code` - Fast lookups by QR code
- `scanned_at` - Time-based analytics
- `scan_type` - Filter by application/survey
- `converted_to_application` / `converted_to_survey` - Conversion analysis
- `application_id` / `survey_response_id` - Link back to submission records

## API Changes

### New Endpoint: `POST /api/qr-scan`

**Purpose**: Track a QR code scan (called when page loads)

**Request**:
```json
{
  "qrCode": "ABC123XYZ",
  "scanType": "application" // or "survey"
}
```

**Response**:
```json
{
  "success": true,
  "scanId": "uuid-here",
  "message": "Scan tracked successfully"
}
```

**Notes**:
- Returns 200 even on failure (non-critical tracking)
- Captures IP, user agent, referrer automatically
- Links to recruiter via QR code lookup

### Updated Endpoint: `GET /api/recruiter/stats`

**New Response Fields**:
```json
{
  "totalRecruits": 35,
  "qrCodeScans": 25, // Applications from QR (unchanged for compatibility)
  "directEntries": 10,
  "recentRecruits": [...],
  // NEW:
  "qrScanTracking": {
    "totalScans": 100,               // Total times QR was scanned (application + survey)
    "totalSurveyScans": 50,          // Survey QR scans
    "applicationsFromScans": 25,     // Application scans that converted
    "surveysFromScans": 10,          // Survey scans that converted
    "totalConverted": 35,            // Combined conversions
    "conversionRate": 35             // Combined conversion rate
  }
}
```

### Updated Endpoint: `GET /api/station-commander/recruiters`

Each recruiter now includes:
```json
{
  "id": "...",
  "fullName": "...",
  "stats": {
    "allTime": {
      "total": 50,
      "qrCodeScans": 30,
      "directEntries": 20,
      // NEW:
      "qrScanTracking": {
        "totalScans": 120,
        "totalSurveyScans": 60,
        "applicationsFromScans": 30,
        "surveysFromScans": 15,
        "totalConverted": 45,
        "conversionRate": 37
      }
    },
    "monthly": { ... }
  }
}
```

## Frontend Changes

### Apply Page (`client/src/pages/apply.tsx`)

**Added scan tracking on page load**:
```typescript
useEffect(() => {
  if (recruiterCode) {
    // Track the scan
    fetch("/api/qr-scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        qrCode: recruiterCode,
        scanType: "application" 
      }),
    }).then(() => {
      console.log("📱 QR scan tracked");
    }).catch((err) => {
      console.error("Failed to track QR scan (non-critical):", err);
    });

    // Fetch recruiter info...
  }
}, [recruiterCode]);
```

### Survey Page (`client/src/pages/survey.tsx`)

**Same tracking with `scanType: "survey"`**

### Dashboard (`client/src/pages/dashboard.tsx`)

**Updated QR Code Scans card**:

**Before**:
```
┌─────────────────────┐
│ QR Code Scans       │
│ 25                  │
│ Via QR code scanning│
└─────────────────────┘
```

**After**:
```
┌─────────────────────────┐
│ QR Code Scans           │
│ 100                     │
│ 25 converted (25%)      │
└─────────────────────────┘
```

**Shows**:
- **100** = Total times QR was scanned
- **25 converted** = Applications from those scans
- **(25%)** = Conversion rate in green

### Station Commander Dashboard

**Updated recruiter stats display**:

**Before**:
```
30 QR / 20 Direct
```

**After**:
```
120 scans → 30 apps (25%)
```

**Shows**:
- **120 scans** = Total QR scans
- **30 apps** = Applications from scans
- **(25%)** = Conversion rate

## Use Cases & Insights

### 1. QR Placement Effectiveness
**Scenario**: You place QR codes at 3 locations

| Location | Scans | Applications | Conversion |
|----------|-------|--------------|------------|
| Gym      | 50    | 20           | 40% ✅     |
| Mall     | 100   | 10           | 10% ⚠️     |
| School   | 30    | 15           | 50% ✅     |

**Insight**: 
- School has best conversion (50%) - good crowd
- Mall has lots of scans but low conversion - wrong audience or placement
- Gym is effective - continue using

### 2. Form Optimization
**Scenario**: Your conversion rate is 15%

**Questions to ask**:
- Is the form too long?
- Is mobile experience good?
- Are you asking for too much info upfront?
- Is loading time too slow?

**Action**: Simplify form, improve mobile UX

### 3. Time-Based Analytics
**Scenario**: Track scans by time of day/week

| Day       | Scans | Applications | Rate |
|-----------|-------|--------------|------|
| Weekday   | 80    | 12           | 15%  |
| Weekend   | 120   | 48           | 40%  |

**Insight**: People have more time on weekends to complete forms

### 4. Station Commander Oversight
**Scenario**: SC reviews recruiter performance

| Recruiter | Scans | Apps | Rate |
|-----------|-------|------|------|
| Smith     | 200   | 80   | 40%  |
| Johnson   | 50    | 5    | 10%  |
| Williams  | 150   | 60   | 40%  |

**Insight**: Johnson needs training on QR placement or follow-up

## Security & Privacy

### Data Captured
- ✅ **IP Address**: Geographic insights (not personally identifiable alone)
- ✅ **User Agent**: Device/browser info for UX optimization
- ✅ **Referrer**: Source tracking (where they came from)
- ❌ **No personal info** until application is submitted

### Compliance
- Data is tied to recruiter, not individual users
- Used for analytics only
- No tracking cookies or persistent identifiers
- User can opt-out by not submitting application

### GDPR/Privacy Considerations
- IP addresses are logged for legitimate business purpose (analytics)
- Data retention should be reviewed based on requirements
- Consider adding privacy notice on QR landing pages

## Deployment

### Automated Deployment

```bash
cd /Users/alexmoran/Documents/programming/cybit-k8s
./deploy-qr-scan-tracking.sh
```

**What it does**:
1. Runs database migration (creates `qr_scans` table)
2. Builds frontend and backend
3. Creates Docker image
4. Restarts Kubernetes pods
5. Verifies deployment success

### Manual Deployment

#### Step 1: Database Migration
```bash
POSTGRES_POD=$(kubectl get pods -l app=army-postgres -o jsonpath='{.items[0].metadata.name}')

kubectl exec -it $POSTGRES_POD -- \
  psql -U armyrecruiter -d army_recruiter \
  -f /path/to/migrations/006_add_qr_scan_tracking.sql
```

#### Step 2: Build & Deploy
```bash
cd /Users/alexmoran/Documents/programming/ArmyRecruitTool
npm run build
docker build -t army-recruit-tool:latest .
kubectl rollout restart deployment/army-app
```

## Testing

### Test 1: Scan Tracking Works
1. Generate your QR code from dashboard
2. Scan it with your phone
3. **Expected**: Page loads, scan is tracked
4. **Verify**: Check dashboard - "QR Code Scans" should increase by 1

### Test 2: Application Conversion
1. Scan QR code
2. Complete and submit application
3. **Expected**: Both scans and applications increase
4. **Verify**: Conversion rate updates

### Test 3: Dashboard Display
1. Log into dashboard
2. Check "QR Code Scans" card
3. **Expected**: Shows format "X converted (Y%)"
4. **Verify**: Math is correct (converted / scans * 100)

### Test 4: Station Commander View
1. Log in as station commander
2. View recruiter stats
3. **Expected**: See scan stats for each recruiter
4. **Verify**: Format is "X scans → Y apps (Z%)"

### Test 5: Survey QR Tracking
1. Scan survey QR code
2. Submit survey
3. **Expected**: Survey scans tracked separately
4. **Verify**: Check database or logs

## Troubleshooting

### Scans Not Being Tracked

**Check 1**: Is the QR code correct?
```bash
# In browser console after scanning:
# Should see: "📱 QR scan tracked"
```

**Check 2**: Is the endpoint working?
```bash
curl -X POST http://your-domain/api/qr-scan \
  -H "Content-Type: application/json" \
  -d '{"qrCode":"TEST123","scanType":"application"}'
```

**Check 3**: Database connection
```bash
kubectl exec -it $POSTGRES_POD -- \
  psql -U armyrecruiter -d army_recruiter \
  -c "SELECT COUNT(*) FROM qr_scans;"
```

### Conversion Rate Shows 0%

**Cause**: No scans have converted to applications yet

**Solution**: 
- Normal if you just deployed
- Wait for someone to complete an application
- Or test by submitting an application yourself

### Dashboard Shows Old Data

**Cause**: React Query cache

**Solution**:
- Wait 10 seconds (auto-refresh interval)
- Or hard refresh (Cmd+Shift+R)
- Or close and reopen the page

## Future Enhancements

### Phase 2 (Optional)
- [ ] Geographic heat map of scans
- [ ] Time-of-day scan analytics chart
- [ ] Export scan data to Excel
- [ ] Email alerts for low conversion rates
- [ ] A/B testing for different QR placements

### Phase 3 (Optional)
- [ ] Integration with Google Analytics
- [ ] Scan funnel visualization
- [ ] Demographic insights (if applicable)
- [ ] Mobile app for QR analytics

## Files Changed

### Database
- ✅ `migrations/006_add_qr_scan_tracking.sql` - New migration
- ✅ `shared/schema.ts` - Added `qrScans` table schema

### Backend
- ✅ `server/routes.ts` - Added `POST /api/qr-scan` endpoint
- ✅ `server/routes.ts` - Updated `GET /api/recruiter/stats`
- ✅ `server/routes.ts` - Updated `GET /api/station-commander/recruiters`

### Frontend
- ✅ `client/src/pages/apply.tsx` - Added scan tracking on load
- ✅ `client/src/pages/survey.tsx` - Added scan tracking on load
- ✅ `client/src/pages/dashboard.tsx` - Updated QR scans card display
- ✅ `client/src/pages/station-commander-dashboard.tsx` - Updated recruiter stats display

### Deployment
- ✅ `deploy-qr-scan-tracking.sh` - Automated deployment script
- ✅ `QR_SCAN_TRACKING_FEATURE.md` - This documentation

## Summary

✅ **Tracks QR scans** separately from applications  
✅ **Calculates conversion rates** automatically  
✅ **Enhanced dashboards** with better insights  
✅ **Station commander visibility** into recruiter performance  
✅ **Non-intrusive tracking** (no impact on user experience)  
✅ **Backward compatible** (existing features unchanged)  

**Result**: Recruiters can now optimize QR placement and understand which tactics work best!

