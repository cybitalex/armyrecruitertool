# Mock Data for Development & Demo

## What's Included

Your Army Recruiting Tool now uses **realistic mock data** to demonstrate functionality while keeping your **real GPS location** active.

### 🎓 Mock Locations (~20 locations)

**Schools:**
- Lincoln High School
- Jefferson Middle School
- Washington Elementary
- Roosevelt High School
- Madison Academy
- ⭐ Prospecting Score: 80-90

**Gyms & Fitness:**
- 24 Hour Fitness
- Planet Fitness
- Gold's Gym
- LA Fitness
- Anytime Fitness
- ⭐ Prospecting Score: 70-80

**Shopping Malls:**
- Town Center Mall
- Plaza Shopping Center
- Westfield Mall
- ⭐ Prospecting Score: 65-75

**Community Centers:**
- Community Recreation Center
- YMCA
- Veterans Memorial Center
- ⭐ Prospecting Score: 75-85

### 📅 Mock Events (~6 events)

**Career Fairs:**
- Spring Career Fair (500 expected)
- High School Job & College Expo (300 expected)
- STEM Career Day (250 expected)

**Community Events:**
- Veterans Appreciation Day (400 expected)
- Community Health & Fitness Fair (800 expected)

**Sports Events:**
- College Football - Military Appreciation Night (5,000 expected)

## How It Works

### Smart Location Generation
- All locations are generated **around your actual GPS position**
- Realistic spread within 5km radius
- Random but consistent placement
- Includes realistic addresses, coordinates, and demographic data

### Dynamic Event Dates
- Events scheduled 1-90 days in the future
- Realistic times (morning, afternoon, evening)
- Sorted chronologically
- Include expected attendance and target audiences

## Features

### ✅ What Works (Using Your Real Location)
- 📍 Your actual GPS coordinates
- 🗺️ Real map centered on you
- 🔵 Blue "You are here" marker
- 🎯 Mock data positioned realistically around you
- 🎭 All map interactions (zoom, pan, click markers)

### 🎭 What's Mock
- School names and addresses
- Gym names and addresses
- Event names and dates
- Prospecting scores
- Demographic data
- Contact information

## Testing the App

### 1. Find Nearby Locations
Click the gold **"Find Nearby Locations"** button:
- ✅ Generates ~20 locations around you
- ✅ Adds them to your database
- ✅ Shows on map with custom icons
- ✅ Each has prospecting score and demographics

### 2. Find Nearby Events
Click the green **"Find Nearby Events"** button:
- ✅ Generates ~6 recruiting events
- ✅ Spread over next 3 months
- ✅ Shows on map with calendar icons
- ✅ Click for full event details

### 3. Interact with the Map
- **Click markers** - See location/event details
- **Filter by type** - Schools, Gyms, Malls, etc.
- **Search** - Find specific locations by name
- **Your location** - Blue pulsing circle
- **Zoom & Pan** - Explore your area

## Switching to Real Data

When you're ready to use real data, edit `server/places.ts`:

### For Real Locations (OpenStreetMap):
```typescript
// Line ~36
const USE_MOCK_DATA = false; // Change to false
```

### For Real Events (Eventbrite):
```typescript
// Line ~189
const USE_MOCK_DATA = false; // Change to false
// Note: Requires approved Eventbrite API access
```

## Why Use Mock Data?

### ✅ Advantages
1. **Immediate Results** - No API setup or approval needed
2. **Consistent Testing** - Same data every time
3. **Full Functionality** - Test all features without limits
4. **No API Costs** - Zero API calls
5. **Offline Development** - Works without internet
6. **Privacy** - No real data exposed during development

### 📊 Realistic Simulation
- Data looks and behaves like real data
- Proper lat/lng coordinates
- Realistic prospecting scores
- Demographic information
- Event scheduling
- All database operations work identically

## Data Structure

### Location Mock Data Includes:
```typescript
{
  name: "Lincoln High School",
  type: "school",
  address: "1234 Main St",
  city: "Local City",
  state: "State",
  zipCode: "12345",
  latitude: "your_lat + random_offset",
  longitude: "your_lng + random_offset",
  prospectingScore: 85,
  footTraffic: "high",
  description: "🎓 Mock location for demonstration",
  demographics: { ageRange: "14-18", estimatedDaily: 450 }
}
```

### Event Mock Data Includes:
```typescript
{
  name: "Spring Career Fair",
  type: "career_fair",
  eventDate: "2025-05-15",
  eventTime: "10:00",
  expectedAttendance: 500,
  targetAudience: "college",
  description: "Annual spring career fair...",
  registrationRequired: "yes",
  cost: "Free"
}
```

## Customizing Mock Data

Want to change the mock data? Edit `server/mock-data.ts`:

### Add More Schools:
```typescript
{ type: "school", names: [
  "Lincoln High School",
  "Your Custom School", // Add here
], score: 85 }
```

### Add More Events:
```typescript
{
  name: "Your Custom Event",
  type: "career_fair",
  targetAudience: "college",
  attendance: 300,
  description: "Your description",
}
```

### Change Quantity:
- Schools: Currently 5 per search
- Gyms: Currently 5 per search
- Malls: Currently 3 per search
- Community Centers: Currently 3 per search
- Events: Currently 6 per search

Adjust the `names` arrays to generate more or fewer.

## Development Workflow

### Phase 1: Mock Data (Current) ✅
```
User Location (Real GPS)
    ↓
Mock Data Generator
    ↓
Database
    ↓
Map Display
```

### Phase 2: Real Data (Future)
```
User Location (Real GPS)
    ↓
OpenStreetMap API + Eventbrite API
    ↓
Database
    ↓
Map Display
```

## Performance

### Mock Data Generation:
- ⚡ **Instant** - No network calls
- 💾 **Lightweight** - Generated in-memory
- 🔄 **Consistent** - Same data structure as real APIs
- 🎯 **Smart** - Positioned around your actual location

### Real Data (for comparison):
- ⏱️ OpenStreetMap: 1-2 seconds
- ⏱️ Eventbrite: 0.5-1 second (if approved)
- 🌐 Requires internet connection
- 📊 May have rate limits

## What Users See

Users testing your app will see:
1. Map loads with their GPS location
2. Click "Find Nearby Locations"
3. 20 realistic locations appear instantly
4. Each has proper address, score, demographics
5. Click "Find Nearby Events"
6. 6 upcoming events appear
7. All features work identically to production

**Nobody can tell it's mock data** unless they check the actual addresses!

## When to Switch to Real Data

Switch when:
- ✅ You have OpenStreetMap working reliably
- ✅ You have Eventbrite API approved
- ✅ You're deploying to production
- ✅ You need real business data
- ✅ You're presenting to stakeholders with real locations

Keep using mock data when:
- 🎭 Demonstrating to colleagues
- 🧪 Testing new features
- 📚 Training new users
- 🎓 Teaching the system
- 🚀 Rapid development

## Tips

### Best Practices:
1. **Keep location service ON** - Mock data uses your real position
2. **Test all features** - Everything works with mock data
3. **Use for demos** - Perfect for showing stakeholders
4. **Switch easily** - One line of code to toggle

### Common Questions:

**Q: Will mock data persist?**
A: Yes! It's saved to the database like real data.

**Q: Can I delete mock data?**
A: Yes, delete locations/events like any other data.

**Q: Does this affect production?**
A: Only if you deploy with `USE_MOCK_DATA = true`. Set to `false` for production.

**Q: How do I reset mock data?**
A: Restart the server - the in-memory database clears.

---

## Summary

✅ **Working Now:**
- Your actual GPS location
- ~20 realistic mock locations around you
- ~6 upcoming mock events
- Full map functionality
- All database operations
- Army-themed UI

🎯 **Ready to Demo!**

The app is fully functional and looks professional with mock data. Switch to real data when your APIs are approved!

