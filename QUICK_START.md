# Quick Start Guide

## ✅ What's New

Your Army Recruiting Tool now includes:

1. **🗺️ Your Current Location** - Map automatically centers on where you are
2. **🗑️ No Fake Data** - Clean slate, add your own real locations and events
3. **🤖 Free AI Assistant** - Get help with recruiting strategies (optional)

## 🚀 Getting Started (3 Steps)

### Step 1: Open the App

The server is running at: **http://localhost:5001**

### Step 2: Navigate to Prospecting

Click **"Prospecting"** in the navigation header to access the map.

### Step 3: Allow Location Access

When prompted, click **"Allow"** to share your location.  
The map will center on your current GPS coordinates!

## 🤖 Enable AI Assistant (Optional - 2 Minutes)

The AI assistant can help you find recruiting locations, suggest strategies, and answer questions.

### Quick Setup:

1. **Get Free API Key:**

   - Visit: https://console.groq.com
   - Sign up (free, no credit card)
   - Create an API key

2. **Add to Your App:**

   ```bash
   # Create .env file
   cp .env.example .env

   # Edit .env and add:
   GROQ_API_KEY=your_actual_api_key_here
   ```

3. **Restart Server:**

   ```bash
   # Stop current server (Ctrl+C)
   npm run dev
   ```

4. **Test It:**
   - Go to Prospecting page
   - Click the 🤖 bot icon (bottom-right)
   - Ask: "What types of locations should I target?"

See [AI_SETUP.md](./AI_SETUP.md) for detailed instructions.

## 📍 Adding Your First Location

1. Go to the Prospecting page
2. Your map should be centered on your location
3. Add locations manually via API or create an admin UI

### Example API Request:

```bash
curl -X POST http://localhost:5001/api/locations \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Local High School",
    "type": "school",
    "address": "123 Main St",
    "city": "YourCity",
    "state": "ST",
    "zipCode": "12345",
    "latitude": "40.7128",
    "longitude": "-74.0060",
    "prospectingScore": 85,
    "footTraffic": "high",
    "description": "Active JROTC program"
  }'
```

## 🎯 Using the Map

### Features:

- **Search** - Find locations by name or city
- **Filter** - Show only specific types (schools, gyms, etc.)
- **Toggle** - Hide/show locations or events independently
- **Click Markers** - See details in popup
- **Side List** - View all locations/events with full details

### Without Data:

The map starts empty (no fake data). As you add locations and events, they'll appear automatically!

## 🤖 AI Assistant Questions to Try

Once configured, ask things like:

- "What are the best locations to recruit in my area?"
- "When is the best time to visit schools?"
- "What events should I attend for recruiting?"
- "How do I approach community colleges?"
- "What demographics should I target?"

## 📱 Features Overview

### Locations

- Track schools, gyms, malls, community centers
- Add prospecting scores (0-100)
- Record demographics and foot traffic
- Add notes about best times to visit

### Events

- Career fairs, sports events, festivals
- Track dates, times, and expected attendance
- Contact information for organizers
- Status tracking (upcoming, confirmed, completed)

### AI Assistant

- 24/7 recruiting advisor
- Location-aware suggestions
- Personalized strategies
- Instant answers

## 🔧 Troubleshooting

### Map Not Centering on My Location?

- Check browser permissions for location access
- Try refreshing the page
- Look for location permission icon in address bar

### AI Bot Not Responding?

- Make sure you've added `GROQ_API_KEY` to `.env`
- Restart the server after adding the key
- Check console for error messages

### Can't See Any Locations?

- This is normal! You start with no data
- Add locations via API or build an admin interface
- Previous fake data has been removed

## 📚 More Documentation

- [README.md](./README.md) - Full project documentation
- [AI_SETUP.md](./AI_SETUP.md) - Detailed AI assistant setup
- [PROSPECTING_GUIDE.md](./PROSPECTING_GUIDE.md) - Prospecting features guide

## 🆘 Need Help?

Check the documentation files above or:

- Review API endpoints in `server/routes.ts`
- Check database schema in `shared/schema.ts`
- Look at component code in `client/src/`

---

**Ready to start recruiting!** 🎖️
