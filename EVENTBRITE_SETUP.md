# 🎟️ Eventbrite API Setup (Community Events)

## Why Add Eventbrite?

Ticketmaster is great for **sports, concerts, and theater**, but Eventbrite covers the **local community events** that Ticketmaster doesn't have:

### Eventbrite Events (Perfect for Recruiting):
- ✅ **Career fairs** and job fairs
- ✅ **Community festivals** and gatherings  
- ✅ **Workshops** and training sessions
- ✅ **Networking events** and meetups
- ✅ **College events** and campus activities
- ✅ **FREE events** (many community events are free!)
- ✅ **Local business events**

### Combined Coverage:
- **Ticketmaster**: Big venues, sports, concerts, theater
- **Eventbrite**: Local community, career fairs, workshops, meetups

## Quick Setup (5 minutes)

### 1. Create Eventbrite Account (2 minutes)

1. Go to: **https://www.eventbrite.com/platform/api**
2. Click **"Get Started"** or **"Sign Up"**
3. Create a free account

### 2. Get Your API Key (2 minutes)

1. Log in to: **https://www.eventbrite.com/account-settings/apps**
2. Click **"Create New Key"** or **"Show Key"**
3. Fill in:
   - **Application Name**: Army Recruiter Tool
   - **Application URL**: https://armyrecruitertool.duckdns.org
   - **Description**: Tool for Army recruiters to find events
4. Copy your **Private Token** (this is your API key)

### 3. Add to Local Environment (1 minute)

Add to your `.env` file:

```bash
EVENTBRITE_API_KEY=your_private_token_here
```

### 4. Add to Kubernetes (1 minute)

Update the Kubernetes secret:

```bash
kubectl create secret generic army-secrets \
  --from-literal=EVENTBRITE_API_KEY="your_private_token_here" \
  --dry-run=client -o yaml | kubectl apply -f -
```

Then rebuild and deploy:

```bash
cd /Users/alexmoran/Documents/programming/cybit-k8s
./deploy-army-app.sh
```

## What You'll Get

### Event Types:
- 🎯 **Career Fairs** - Perfect for recruiting
- 🎓 **College Events** - Campus activities, student org events
- 🤝 **Networking Events** - Business and community meetups
- 🎨 **Community Festivals** - Local gatherings
- 💼 **Workshops** - Training and skill-building events
- 🏃 **Sports & Fitness** - Local races, fitness events
- 🎵 **Local Music** - Small venue concerts

### Event Data:
- Event name and full description
- Date, time, and duration
- Venue name and address
- Organizer information
- **Free vs Paid** indicator
- Registration links
- Capacity/attendance estimates

## API Limits

- **Free Tier**: 1,000 requests per day
- **Rate Limit**: Reasonable (not strictly enforced for low volume)
- **Cost**: $0 forever for non-commercial use

## How It Works with Ticketmaster

The app now searches **both** Ticketmaster and Eventbrite simultaneously:

1. **Ticketmaster** finds: Sports games, concerts, theater shows
2. **Eventbrite** finds: Career fairs, community events, workshops
3. **Combined results** give you complete event coverage!

## Comparison

| Feature | Ticketmaster | Eventbrite | Combined |
|---------|-------------|------------|----------|
| **Sports Events** | ✅ Excellent | ❌ Rare | ✅ |
| **Concerts** | ✅ Major venues | ✅ Small venues | ✅ |
| **Career Fairs** | ❌ No | ✅ Excellent | ✅ |
| **Community Events** | ❌ No | ✅ Excellent | ✅ |
| **Free Events** | ❌ Rare | ✅ Common | ✅ |
| **College Events** | ❌ No | ✅ Yes | ✅ |
| **Daily Limit** | 5,000 | 1,000 | 6,000 total |

## Testing

After setup:

1. Go to **https://armyrecruitertool.duckdns.org**
2. Navigate to **Prospecting** page
3. Click **"Find Nearby Events"**
4. You should see events from **both** sources!
5. Check the event notes to see which source each event came from

## Troubleshooting

### "Invalid API Key" Error
- Make sure you copied the **Private Token** (not Public Token)
- Check for extra spaces in the key
- Verify the key is active in your Eventbrite dashboard

### "No Events Found"
- Eventbrite focuses on organized/registered events
- Try searching in urban areas (more events)
- Events might be seasonal
- Some areas have more Eventbrite activity than others

### Rate Limit Exceeded
- You're limited to 1,000 calls per day
- Each search counts as 1 call
- Limit resets at midnight UTC

## Support

- **Eventbrite API Docs**: https://www.eventbrite.com/platform/api
- **API Status**: Check your dashboard for rate limits
- **Support**: https://www.eventbrite.com/support/

## Benefits for Recruiting

### Why Eventbrite Events Are Great:

1. **Career Fairs** - Direct recruiting opportunities
2. **College Events** - Access to student demographics
3. **Community Events** - Build local presence
4. **Free Events** - More accessible, higher attendance
5. **Workshops** - Professional development seekers
6. **Networking Events** - Career-minded individuals

Perfect complement to Ticketmaster's entertainment focus! 🎉

