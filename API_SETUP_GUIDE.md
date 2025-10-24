# 🚀 API Setup Guide

Your Army Recruiting Tool now uses **Google Places** and **PredictHQ** for the best location and event discovery!

## ✅ What You Need

### 1. **Google Places API Key** (for locations)
- ✅ You already have this!
- Finds real schools, gyms, malls, parks, stadiums nearby
- Free tier: $200 credit/month (enough for ~20,000 location searches)

### 2. **PredictHQ API Key** (for events)
- ✅ You already have this!
- Discovers sports events, concerts, festivals, career fairs
- Free tier: 5,000 events/month

---

## 📝 Step 1: Add API Keys to .env File

Open your `.env` file in the project root and add these lines:

```bash
# Google Places API (for finding locations)
GOOGLE_PLACES_API_KEY=your_google_api_key_here

# PredictHQ API (for finding events)
PREDICTHQ_API_KEY=your_predicthq_api_key_here
```

### Important Notes:
- ⚠️ **No quotes** needed around the values
- ⚠️ **No spaces** around the `=` sign
- ⚠️ Make sure there's **no `.env` in .gitignore** to keep keys private

---

## 🔑 How to Get Your API Keys

### Google Places API Key

Your key should already work, but if you need to verify or create a new one:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable **Places API**:
   - Go to: APIs & Services → Library
   - Search for "Places API"
   - Click "Enable"
4. Create credentials:
   - Go to: APIs & Services → Credentials
   - Click "Create Credentials" → "API Key"
   - Copy your API key
5. (Optional) Restrict your key:
   - Click on your key to edit it
   - Under "API restrictions", select "Places API"
   - Under "Application restrictions", you can restrict by IP or domain

**Cost:** 
- Free tier: $200/month credit
- Places Nearby Search: $0.032 per request
- You can make ~6,250 requests/month for free

### PredictHQ API Key

You mentioned you have this, but if you need to find it:

1. Go to [PredictHQ](https://www.predicthq.com/)
2. Sign in to your account
3. Go to [Control Center](https://control.predicthq.com/)
4. Navigate to: Account → API Access
5. Copy your API Access Token

**Cost:**
- Free tier: 5,000 events/month
- Perfect for recruiting use!

---

## 🧪 Step 2: Test Your Setup

After adding the API keys to `.env`:

### 1. Restart Your Server

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

### 2. Test in the App

1. Open your app: `http://localhost:5001` (or your server URL)
2. Go to **Prospecting Map** page
3. Click **"Find Locations Near Me"** button
   - Should find real schools, gyms, malls, etc.
   - Check console for: `✅ Found X locations`
4. Click **"Find Events Near Me"** button
   - Should find real events in your area
   - Check console for: `✅ Found X events from PredictHQ`

### 3. Check Server Logs

Watch your terminal for these messages:

**Google Places (Success):**
```
🔍 Searching Google Places for school near 41.67, -72.94
✅ Found 15 school locations
🔍 Searching Google Places for university near 41.67, -72.94
✅ Found 3 university locations
...
🎯 Total unique locations found: 47
```

**PredictHQ (Success):**
```
🔍 Searching PredictHQ events near 41.67, -72.94 within 25 miles
✅ Found 23 events from PredictHQ
```

**If API Key Missing:**
```
Google Places API key not found. Returning empty locations list.
Get your API key at https://console.cloud.google.com/apis/credentials
```

---

## 🎯 What You'll Get

### **Locations (Google Places)**

The app will search for:
- 🎓 **Schools** (high schools, secondary schools)
- 🏫 **Universities** (colleges and universities)
- 💪 **Gyms** (fitness centers, sports centers)
- 🛍️ **Shopping Malls** (high foot traffic areas)
- 🏟️ **Stadiums** (sports venues)
- 🌳 **Parks** (community gathering spots)

**Each location includes:**
- Name and exact address
- GPS coordinates
- Prospecting score (50-100)
- Foot traffic estimate
- Google ratings and reviews
- Open/closed status
- Business details

### **Events (PredictHQ)**

The app will search for:
- 🏈 **Sports Events** (college games, military appreciation nights)
- 🎪 **Community Events** (festivals, parades)
- 📊 **Conferences & Expos** (career fairs)
- 🎵 **Concerts** (large crowds, young demographics)
- 🎉 **Festivals** (community gatherings)
- 🎭 **Performing Arts** (cultural events)

**Each event includes:**
- Event name and description
- Date and time
- Location and address
- Expected attendance (estimated)
- Event category and type
- PredictHQ rank (impact score)
- Target audience

---

## 💡 Pro Tips

### Maximize Your Free Tier

**Google Places:**
- Each "Find Locations" search makes 7 API calls (one per place type)
- Free tier covers ~890 searches per month
- For unlimited searches, consider:
  - Caching results in your database
  - Search once per area, then reuse data

**PredictHQ:**
- Each "Find Events" search makes 1 API call
- Free tier: 5,000 searches/month
- More than enough for daily recruiting use!

### Best Practices

1. **Search in new areas** - Move around the map and search different recruiting territories
2. **Cache results** - Locations don't change often, so save them
3. **Set up weekly searches** - Run automated searches for new events
4. **Score high-value targets** - Focus on schools and events with high prospecting scores

### Troubleshooting

**"REQUEST_DENIED" error (Google Places):**
```
💡 Make sure your API key has Places API enabled
Visit: https://console.cloud.google.com/apis/library/places-backend.googleapis.com
```
**Solution:** Enable the Places API in your Google Cloud Console

**"401 Unauthorized" error (PredictHQ):**
```
💡 Note: Invalid PredictHQ API key.
- Check your API key at https://control.predicthq.com/
- Make sure it's added to .env as PREDICTHQ_API_KEY
```
**Solution:** Verify your API key is correct and properly added to `.env`

**No results found:**
- Try a different location
- Increase search radius (edit in the code if needed)
- Check that APIs are enabled and have quota remaining

---

## 📊 Comparison: Old vs New

| Feature | Before | After (Now!) |
|---------|--------|--------------|
| **Location Source** | Mock data | ✅ Real Google Places data |
| **Location Quality** | Fake | ✅ Accurate, verified businesses |
| **Event Source** | Mock data / Broken Eventbrite | ✅ Real PredictHQ data |
| **Event Coverage** | Limited | ✅ 19+ sources aggregated |
| **Address Accuracy** | Random | ✅ Exact addresses |
| **Business Info** | None | ✅ Ratings, hours, reviews |
| **Event Attendance** | Random | ✅ Estimated by AI |
| **API Cost** | Free | ✅ Free tier (generous limits) |

---

## 🎖️ Your New Recruiting Superpowers

With Google Places + PredictHQ, you can:

1. ✅ **Find REAL schools** near any recruiting station
2. ✅ **Discover gyms** with physically fit prospects
3. ✅ **Map shopping malls** with high foot traffic
4. ✅ **Locate sports venues** for event recruiting
5. ✅ **Track upcoming sports events** (military appreciation nights!)
6. ✅ **Find career fairs** in your area
7. ✅ **Discover festivals** with large crowds
8. ✅ **Plan ahead** with event dates and times
9. ✅ **Score locations** by recruiting potential
10. ✅ **Save to database** for future reference

---

## 🚀 Next Steps

1. ✅ Add both API keys to `.env` file
2. ✅ Restart your server (`npm run dev`)
3. ✅ Open Prospecting Map
4. ✅ Click "Find Locations Near Me"
5. ✅ Click "Find Events Near Me"
6. ✅ Watch real results appear on your map!

---

## 📞 Support Resources

- **Google Places API Docs**: https://developers.google.com/maps/documentation/places/web-service/overview
- **PredictHQ Docs**: https://docs.predicthq.com/
- **Google Cloud Console**: https://console.cloud.google.com/
- **PredictHQ Control Center**: https://control.predicthq.com/

---

**Your recruiting tool is now powered by real, professional-grade data! 🎉**

Ready to find your next recruit? Add those API keys and start exploring!

