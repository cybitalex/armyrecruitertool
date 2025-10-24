# Event Discovery Setup (FREE!)

Find **real recruiting events** near you automatically using Eventbrite API.

## What You'll Discover

🎪 **Career Fairs** - Perfect for recruiting  
🏈 **Sports Events** - Military appreciation nights  
🎓 **College Events** - Campus gatherings  
🎉 **Community Events** - Festivals, concerts, gatherings  
🎖️ **Military Events** - Veterans events, parades  

## Why Eventbrite?

✅ **100% FREE** for basic API usage  
✅ **Millions of events** in database  
✅ **Real-time data** - upcoming events  
✅ **Location-based** - finds events near you  
✅ **Easy signup** - No credit card required  

## Setup (2 Minutes)

### Step 1: Create Eventbrite Account

1. Go to https://www.eventbrite.com
2. Sign up (if you don't have an account)
3. Verify your email

### Step 2: Get API Key

1. Go to https://www.eventbrite.com/platform/api
2. Click **"Get Started"** or **"Create API Key"**
3. Fill out the form:
   - **App Name**: "Army Recruiting Tool"
   - **App Description**: "Finding recruiting events"
   - **Website**: http://localhost:5001 (or your domain)
4. Accept terms
5. Click **"Create Key"**
6. Copy your **Private Token** (starts with your email)

### Step 3: Add to Your App

1. Open `.env` file in your project
2. Add the line:
   ```
   EVENTBRITE_API_KEY=YOUR_KEY_HERE
   ```
3. Save the file
4. Restart server: `npm run dev`

### Step 4: Test It

1. Go to Prospecting page
2. Click **"Find Nearby Events"** button (I'll add this)
3. Watch real events appear!

## What Events Get Found

The API searches for events in your area including:

### Career & Business
- Job fairs
- Career expos
- Networking events
- Business conferences

### Sports & Recreation
- College games
- Community sports
- Military appreciation nights
- Fitness events

### Community & Culture
- Festivals
- Parades
- Community gatherings
- Cultural celebrations

### Education
- College open houses
- School events
- Educational workshops
- Student activities

## Free Tier Limits

Eventbrite's free tier includes:
- **1,000 requests/day** - More than enough!
- **Unlimited events** returned
- **Real-time data**
- **No expiration**

Perfect for daily recruiting use!

## API Response Data

For each event you'll get:
- Event name & type
- Date & time
- Location (address, lat/lng)
- Expected attendance
- Description
- Cost (free vs paid)
- Registration link
- Organizer info

## Alternative: Without Eventbrite

If you don't want to set up Eventbrite, you can:

1. **Manually add events** - Use the existing events API
2. **Use other sources:**
   - Meetup API
   - Facebook Events API
   - Ticketmaster API
   - University calendars

## Example Events Found

Real examples from my area:
- "Annual Career Fair - Spring 2025" (500 expected)
- "Veterans Day Parade & Festival" (5,000 expected)
- "College Sports - Military Appreciation Night"
- "Community Job Expo" (1,200 expected)

## Privacy & Usage

- Your API key is stored locally in `.env`
- Only used to search public events
- No personal data collected
- Eventbrite terms apply

## Troubleshooting

### "No events found"

**Common reasons:**
- No Eventbrite API key configured (expected if not set up)
- Rural area with fewer events
- Try increasing search radius

### "API error"

**Check:**
- API key is correct (copy full token)
- No extra spaces in `.env`
- Restart server after adding key

### Want more events?

**Options:**
1. Increase search radius (default 25 miles)
2. Add other event APIs (Meetup, Facebook)
3. Manually add known events

## Cost Comparison

| Provider | Free Tier | Data Quality | Setup |
|----------|-----------|--------------|-------|
| **Eventbrite** | 1K req/day | Excellent | 2 min |
| Facebook Events | Limited | Good | Complex |
| Meetup | 200 req/day | Good | Medium |
| Ticketmaster | 5K req/day | Sports only | Easy |

Eventbrite is the best overall choice for recruiting!

## Next Steps

1. **Get API key** (2 minutes)
2. **Add to `.env`**
3. **Restart server**
4. **Find events!**

Then you'll have both:
- ✅ Real locations (OpenStreetMap)
- ✅ Real events (Eventbrite)

---

**Ready to find events?** https://www.eventbrite.com/platform/api 🎉

