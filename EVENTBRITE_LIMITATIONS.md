# Eventbrite API Limitations

## Why Event Search Doesn't Work

Your application is encountering a **404 NOT FOUND** error when trying to search for events via the Eventbrite API. This is expected behavior based on Eventbrite's current API restrictions.

## The Issue

According to [Eventbrite's API documentation](https://www.eventbrite.com/platform/api#/introduction/errors):

### Private Token Limitations

Your API key (`OY5LRR7FIDCDAP7KC6`) is a **Private Token** which has these restrictions:

- ❌ **Cannot search public events** - Only your own events
- ❌ **No access to `/events/search/`** endpoint for public events
- ✅ Can only access events you've created on your Eventbrite account

### What's Required for Public Event Search

To search public events, you need:

1. **OAuth 2.0 authentication** (not just a private token)
2. **Approved Eventbrite application** with special permissions
3. **Public event search scope** - requires manual approval from Eventbrite
4. **Business or higher plan** - Free tier is very limited

## Solutions

### ✅ Recommended: Manual Event Entry

The best approach for Army recruiting is to **manually add events** you know about:

1. **Local Career Fairs** - Add when you hear about them
2. **School Events** - Contact schools directly
3. **Community Events** - Local chambers of commerce
4. **Sports Events** - Military appreciation nights
5. **College Events** - ROTC recruiting opportunities

**Advantages:**

- ✅ More accurate - You verify events personally
- ✅ Better control - Add only relevant events
- ✅ No API restrictions - Works immediately
- ✅ Custom notes - Add recruiting-specific details

### ⚠️ Alternative: Get OAuth Approval (Complex)

If you really need automatic event discovery:

#### Step 1: Create Eventbrite App

1. Go to https://www.eventbrite.com/platform/
2. Create a new application
3. Fill out detailed application form
4. Explain your use case (Army recruiting tool)

#### Step 2: Request Permissions

- Request "public event search" permission
- Provide justification for access
- Submit for review

#### Step 3: Wait for Approval

- ⏱️ Can take **2-6 weeks**
- ❌ No guarantee of approval
- 📋 May require additional documentation

#### Step 4: Implement OAuth

- Replace private token with OAuth flow
- Handle token refresh
- Implement user consent screens

**This is NOT recommended** - Too complex for the value provided.

### 🔧 Current App Behavior

The app will now:

- ✅ Show helpful message about Eventbrite limitations
- ✅ Allow manual event entry instead
- ✅ Not repeatedly fail trying to search events
- ✅ Focus on location search (which works great!)

## How to Add Events Manually

### Via API (if you're a developer)

```bash
curl -X POST http://localhost:5001/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "name": "County Career Fair",
    "type": "career_fair",
    "address": "123 Main St",
    "city": "Bristol",
    "state": "CT",
    "zipCode": "06010",
    "latitude": "41.6774",
    "longitude": "-72.9495",
    "eventDate": "2025-03-15",
    "eventTime": "09:00",
    "endDate": "2025-03-15",
    "description": "Annual career fair with 50+ employers",
    "expectedAttendance": 500,
    "targetAudience": "high_school",
    "contactName": "Jane Smith",
    "contactPhone": "860-555-1234",
    "contactEmail": "jane@school.edu",
    "registrationRequired": "yes",
    "cost": "Free",
    "status": "upcoming",
    "notes": "Great opportunity for recruiting"
  }'
```

### Via UI (Coming Soon)

I can add an "Add Event" button with a form where you can enter event details manually.

## Comparison: API vs Manual

| Feature           | Eventbrite API     | Manual Entry               |
| ----------------- | ------------------ | -------------------------- |
| **Setup Time**    | 2-6 weeks approval | Immediate                  |
| **Cost**          | Free (if approved) | $0                         |
| **Accuracy**      | Hit or miss        | 100% - you verify          |
| **Control**       | Limited filters    | Complete control           |
| **Army-specific** | No                 | Yes - add recruiting notes |
| **Works now?**    | ❌ No              | ✅ Yes                     |

## Bottom Line

**Skip Eventbrite and use manual entry.** You'll have:

- ✅ Better quality events (Army-specific)
- ✅ More control over data
- ✅ No waiting for API approval
- ✅ Faster to set up
- ✅ Focus on locations (which works great!)

The location search with OpenStreetMap is working perfectly and finding real schools, gyms, and community centers. That's the valuable part! Events can be added manually as you discover them through normal recruiting channels.

## Need Help?

If you still want to pursue Eventbrite API approval:

1. Visit: https://www.eventbrite.com/platform/
2. Review: https://www.eventbrite.com/platform/api#/introduction/authentication
3. Contact: Eventbrite API Support

But I strongly recommend just adding events manually! 🎖️
