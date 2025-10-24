# 🎯 Event Discovery API Guide

## Best Event APIs for Recruiting (Location-Based)

### 🥇 **Recommended: PredictHQ** 
**Best for comprehensive event discovery**

#### Why PredictHQ?
- ✅ **Free tier**: 5,000 events/month
- ✅ Aggregates from 19+ sources (Eventbrite, Ticketmaster, Facebook, etc.)
- ✅ Advanced location-based search with radius
- ✅ Perfect categories for recruiting:
  - Sports events (military appreciation nights)
  - Community gatherings
  - Conferences & expos
  - School events
  - Concerts & festivals
- ✅ Event rank/impact scoring (attendance estimates)
- ✅ Real-time updates
- ✅ Excellent API documentation

#### Setup
```bash
# 1. Sign up at https://www.predicthq.com/
# 2. Get your API key from dashboard
# 3. Add to .env
PREDICTHQ_API_KEY=your_api_key_here
```

#### Example API Call
```javascript
// Search for events near a location
const response = await fetch(
  `https://api.predicthq.com/v1/events/?limit=50&within=25mi@${lat},${lng}&category=sports,community,conferences,expos,school-holidays,performing-arts`,
  {
    headers: {
      'Authorization': `Bearer ${process.env.PREDICTHQ_API_KEY}`,
      'Accept': 'application/json'
    }
  }
);
```

#### Pricing
- **Free**: 5,000 events/month
- **Pro**: $99/month - 50,000 events/month
- **Enterprise**: Custom pricing

🔗 https://www.predicthq.com/

---

### 🥈 **Alternative: SerpAPI Google Events**
**Best for simple setup**

#### Why SerpAPI?
- ✅ Scrapes Google Events (most comprehensive public listing)
- ✅ Location-based with radius
- ✅ 100 free searches/month
- ✅ No OAuth complexity
- ✅ Returns all event types
- ✅ Very simple integration

#### Setup
```bash
# 1. Sign up at https://serpapi.com/
# 2. Get API key from dashboard
# 3. Add to .env
SERPAPI_KEY=your_api_key_here
```

#### Example API Call
```javascript
const params = {
  engine: "google_events",
  q: "events near me",
  location: `${city}, ${state}`,
  hl: "en",
  gl: "us",
  api_key: process.env.SERPAPI_KEY
};

const response = await fetch(
  `https://serpapi.com/search?${new URLSearchParams(params)}`
);
```

#### Pricing
- **Free**: 100 searches/month
- **Basic**: $50/month - 5,000 searches
- **Pro**: $250/month - 30,000 searches

🔗 https://serpapi.com/google-events-api

---

### 🥉 **Alternative: Ticketmaster Discovery API**
**Best for sports & entertainment**

#### Why Ticketmaster?
- ✅ **Free tier**: 5,000 requests/day (generous!)
- ✅ Perfect for:
  - Sports events (military appreciation nights)
  - Concerts & festivals
  - Family entertainment
- ✅ Location-based with radius
- ✅ Well-documented
- ✅ Venue information included

#### Setup
```bash
# 1. Sign up at https://developer.ticketmaster.com/
# 2. Create an app
# 3. Get Consumer Key
# 4. Add to .env
TICKETMASTER_API_KEY=your_consumer_key_here
```

#### Example API Call
```javascript
const response = await fetch(
  `https://app.ticketmaster.com/discovery/v2/events.json?` +
  `latlong=${lat},${lng}&radius=25&unit=miles&` +
  `classificationName=Sports,Music,Family&` +
  `apikey=${process.env.TICKETMASTER_API_KEY}`
);
```

#### Pricing
- **Free**: 5,000 API calls/day
- Completely free for non-commercial use

🔗 https://developer.ticketmaster.com/

---

### 🏅 **Alternative: Yelp Events API**
**Best for local community events**

#### Why Yelp?
- ✅ Free with Yelp Fusion API
- ✅ Local events and business gatherings
- ✅ Community-focused
- ✅ Location-based search
- ✅ 5,000 requests/day free

#### Setup
```bash
# 1. Sign up at https://www.yelp.com/developers
# 2. Create an app
# 3. Get API key
# 4. Add to .env
YELP_API_KEY=your_api_key_here
```

#### Example API Call
```javascript
const response = await fetch(
  `https://api.yelp.com/v3/events?latitude=${lat}&longitude=${lng}&radius=40233`,
  {
    headers: {
      'Authorization': `Bearer ${process.env.YELP_API_KEY}`
    }
  }
);
```

#### Pricing
- **Free**: 5,000 requests/day
- Completely free

🔗 https://www.yelp.com/developers/documentation/v3/event_search

---

## 📊 API Comparison Chart

| API | Free Tier | Data Sources | Best For | Complexity | Recommended |
|-----|-----------|--------------|----------|------------|-------------|
| **PredictHQ** | 5K events/mo | 19+ sources | All-in-one | Medium | ⭐⭐⭐⭐⭐ |
| **SerpAPI** | 100 searches/mo | Google Events | Simple setup | Easy | ⭐⭐⭐⭐ |
| **Ticketmaster** | 5K/day | Ticketmaster | Sports/concerts | Easy | ⭐⭐⭐⭐ |
| **Yelp** | 5K/day | Yelp | Local community | Easy | ⭐⭐⭐ |
| **Eventbrite** | Limited | Eventbrite | ❌ Requires OAuth | Hard | ⚠️ Not recommended |

---

## 🚀 Implementation Recommendation

### **Best Approach: Multi-API Strategy**

Use multiple APIs to get comprehensive coverage:

1. **Primary**: PredictHQ (for major events)
2. **Secondary**: Ticketmaster (for sports/concerts)
3. **Tertiary**: Yelp (for local community events)

### Implementation Steps

#### 1. Add Environment Variables
```bash
# .env file
PREDICTHQ_API_KEY=your_key_here
TICKETMASTER_API_KEY=your_key_here
YELP_API_KEY=your_key_here
```

#### 2. Create Backend Endpoint
```typescript
// server/routes.ts - Add new endpoint
app.post("/api/places/search-events-multi", async (req, res) => {
  const { latitude, longitude, radius = 25 } = req.body;
  
  const allEvents = [];
  
  // Fetch from PredictHQ
  if (process.env.PREDICTHQ_API_KEY) {
    const predictHQEvents = await fetchPredictHQEvents(latitude, longitude, radius);
    allEvents.push(...predictHQEvents);
  }
  
  // Fetch from Ticketmaster
  if (process.env.TICKETMASTER_API_KEY) {
    const ticketmasterEvents = await fetchTicketmasterEvents(latitude, longitude, radius);
    allEvents.push(...ticketmasterEvents);
  }
  
  // Fetch from Yelp
  if (process.env.YELP_API_KEY) {
    const yelpEvents = await fetchYelpEvents(latitude, longitude, radius);
    allEvents.push(...yelpEvents);
  }
  
  // Remove duplicates and sort by date
  const uniqueEvents = deduplicateEvents(allEvents);
  
  res.json({ events: uniqueEvents });
});
```

#### 3. Frontend Integration
The existing "Find Events Near Me" button already works!
Just update the backend endpoint to use the new multi-API search.

---

## 🎯 Event Categories Perfect for Recruiting

### High-Value Events
- 🏈 **Sports** - Military appreciation nights, college games
- 🎓 **Education** - Career fairs, college orientations
- 🏢 **Business** - Job expos, networking events
- 🎪 **Community** - Festivals, parades, town gatherings

### Medium-Value Events
- 🎵 **Concerts** - Large crowds, young demographics
- 🎭 **Performing Arts** - Community theater, cultural events
- 🏃 **Fitness** - Marathons, charity runs
- 🎉 **Festivals** - Food, music, cultural celebrations

### Filter Recommendations
```javascript
// Recommended filters for recruiting
const filters = {
  categories: [
    'sports',
    'community',
    'conferences',
    'expos', 
    'school-holidays',
    'performing-arts'
  ],
  minAttendance: 100, // Focus on events with good turnout
  radius: 25, // 25 miles from recruiting station
  dateRange: 'next-90-days' // Plan ahead
};
```

---

## 💡 Pro Tips

### 1. **Combine with Your Location Data**
Cross-reference events with your prospecting locations:
- Events near high schools = great recruiting opportunity
- Events at gyms/fitness centers = physically fit audience
- Events at malls = high foot traffic

### 2. **Event Scoring**
Score events based on:
- Expected attendance (higher = better)
- Target audience age (17-24 = prime)
- Event type (career fair = highest score)
- Distance from recruiting station

### 3. **Automated Alerts**
Set up daily/weekly automated searches:
- Email digest of new events in your area
- Push notifications for high-value events
- Calendar integration for event planning

### 4. **Event Notes & Follow-up**
Track in the system:
- Events you attended
- Recruits contacted
- Materials distributed
- Follow-up actions needed

---

## 📱 Mobile Experience

The prospecting map is now fully optimized for mobile:

### Mobile Layout (< 768px)
- ✅ Map shows at top (50vh height)
- ✅ Results list shows below map
- ✅ **Entire page scrolls** - no fixed heights
- ✅ Results list is independently scrollable
- ✅ Tab bar sticks at top of results section

### Desktop Layout (≥ 768px)
- ✅ Map and list side-by-side
- ✅ Fixed height container (100vh)
- ✅ Map fills available space
- ✅ List is fixed 384px width sidebar
- ✅ List scrolls independently

### Key Features
- 📱 Touch-friendly buttons (minimum 32px)
- 🎯 Sticky tab selector
- 📜 Smooth scrolling
- 🗺️ Map gestures (pinch-to-zoom, pan)
- ✨ No horizontal overflow

---

## 🔧 Next Steps

1. **Choose Your API** - Start with PredictHQ or Ticketmaster (both have generous free tiers)
2. **Get API Key** - Sign up and get your credentials
3. **Add to .env** - Store your API key
4. **Test the Integration** - Click "Find Events Near Me"
5. **Review Results** - Check event quality and relevance
6. **Add More APIs** - Layer in additional sources for comprehensive coverage

---

## 📚 Resources

- [PredictHQ Documentation](https://docs.predicthq.com/)
- [Ticketmaster API Docs](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/)
- [SerpAPI Events Docs](https://serpapi.com/google-events-api)
- [Yelp Events API](https://www.yelp.com/developers/documentation/v3/event_search)

---

**Ready to discover recruiting events?** Start with any of the APIs above! 🎉

