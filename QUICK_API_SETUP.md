# 🚀 Quick API Setup (2 Minutes)

## What You Need

You have both API keys already! Just add them to your `.env` file:

```bash
# Google Places API - finds real schools, gyms, malls, parks
GOOGLE_PLACES_API_KEY=your_google_api_key_here

# PredictHQ API - discovers events like sports, concerts, career fairs
PREDICTHQ_API_KEY=your_predicthq_api_key_here
```

## Setup Steps

### 1. Open your `.env` file

Located in: `/Users/alexmoran/Documents/programming/ArmyRecruitTool/.env`

### 2. Add your API keys

```bash
GOOGLE_PLACES_API_KEY=AIza...your_actual_key...
PREDICTHQ_API_KEY=your_actual_key...
```

⚠️ **Important:** No quotes, no spaces around `=`

### 3. Restart your server

```bash
# Press Ctrl+C to stop
npm run dev
```

### 4. Test it!

1. Open app: `http://localhost:5001`
2. Go to **Prospecting Map**
3. Click **"Find Locations Near Me"** → Real schools/gyms appear! 🎓💪
4. Click **"Find Events Near Me"** → Real events appear! 🎉

---

## What You'll Find

### Google Places API finds:

- 🎓 **Schools** (high schools, universities)
- 💪 **Gyms** (fitness centers)
- 🛍️ **Malls** (high foot traffic)
- 🏟️ **Stadiums** (sports venues)
- 🌳 **Parks** (community spots)

### PredictHQ API finds:

- 🏈 **Sports events** (games, tournaments)
- 🎪 **Community events** (festivals, parades)
- 📊 **Career fairs** (job expos)
- 🎵 **Concerts** (large crowds)
- 🎉 **Festivals** (community gatherings)

---

## Costs

- **Google Places**: $200/month FREE credit = ~6,250 searches
- **PredictHQ**: 5,000 events/month FREE

Both more than enough for recruiting use! 🎉

---

## Done!

That's it! Add your keys, restart, and start finding real recruiting opportunities!

See `API_SETUP_GUIDE.md` for detailed documentation.
