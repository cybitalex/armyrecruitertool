# 🎟️ Ticketmaster API Setup (FREE Alternative to PredictHQ)

## Why Ticketmaster?

- ✅ **Completely FREE**: 5,000 API calls per day (vs PredictHQ's 5,000/month)
- ✅ **No credit card required**
- ✅ **Perfect for recruiting events**:
  - Sports events (military appreciation nights, college games)
  - Concerts & festivals (young demographics)
  - Family events (community engagement)
  - Arts & theater events
- ✅ **Excellent data quality**: venue info, pricing, capacity, direct ticket links
- ✅ **Simple setup**: 5 minutes to get started

## Quick Setup

### 1. Sign Up (2 minutes)

1. Go to: **https://developer.ticketmaster.com/products-and-docs/apis/getting-started/**
2. Click **"Get Your API Key"**
3. Create a free account
4. Fill in the app details:
   - **App Name**: Army Recruiter Tool
   - **App Description**: Tool for Army recruiters to find events and locations
   - **Company**: U.S. Army / Your Unit

### 2. Get Your API Key (1 minute)

1. After signup, go to: **https://developer-acct.ticketmaster.com/user/login**
2. Log in to your account
3. Go to **"My Apps"**
4. Copy your **Consumer Key** (this is your API key)

### 3. Add to Local Environment (1 minute)

Add to your `.env` file in the ArmyRecruitTool directory:

```bash
TICKETMASTER_API_KEY=your_consumer_key_here
```

### 4. Add to Kubernetes (1 minute)

Update the Kubernetes secret:

```bash
kubectl create secret generic army-secrets \
  --from-literal=TICKETMASTER_API_KEY="your_consumer_key_here" \
  --dry-run=client -o yaml | kubectl apply -f -
```

Then restart the deployment:

```bash
kubectl rollout restart deployment/army-recruiter
```

## Testing

1. Log in to your Army Recruiter Tool
2. Go to **Prospecting** page
3. Click **"Find Nearby Events"**
4. You should see real events from Ticketmaster!

## What You'll Get

### Event Data:
- 🎯 Event name and description
- 📅 Date and time
- 📍 Venue name and full address
- 💰 Ticket price ranges
- 🎫 Direct link to buy tickets
- 👥 Venue capacity (attendance estimates)
- 🏟️ Venue details and location

### Event Types Perfect for Recruiting:
- **Sports**: College games, military appreciation nights, local sports
- **Music**: Concerts, festivals (young adult demographics)
- **Family**: Community events, fairs
- **Arts**: Theater, cultural events

## API Limits

- **Free Tier**: 5,000 API calls per day
- **Rate Limit**: 5 requests per second
- **Cost**: $0 forever (for non-commercial use)

## Comparison: Ticketmaster vs PredictHQ

| Feature | Ticketmaster (FREE) | PredictHQ (Trial Expired) |
|---------|---------------------|---------------------------|
| **Daily Limit** | 5,000 requests/day | 5,000 events/month (trial) |
| **Cost** | Free forever | Trial expired |
| **Setup** | 5 minutes | Already expired |
| **Event Quality** | Excellent (ticketed events) | Excellent (aggregated) |
| **Recruiting Events** | ✅ Sports, concerts, family | ✅ All types |
| **Ticket Links** | ✅ Yes | ❌ No |
| **Venue Capacity** | ✅ Yes | Sometimes |

## Troubleshooting

### "Invalid API Key" Error
- Make sure you copied the **Consumer Key** (not Consumer Secret)
- Check for extra spaces in the key
- Verify the key is active in your Ticketmaster dashboard

### "No Events Found"
- Ticketmaster focuses on ticketed events (sports, concerts, shows)
- Try searching in areas with more entertainment venues
- Events might be seasonal (more in summer/fall)

### Rate Limit Exceeded
- You're limited to 5,000 calls per day
- Each search counts as 1 call
- Limit resets at midnight UTC

## Support

- **Ticketmaster Docs**: https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/
- **API Status**: https://developer.ticketmaster.com/status/
- **Support**: https://developer.ticketmaster.com/support/contact-us/

## Next Steps

After setup, the app will automatically:
1. Try Ticketmaster first (if key is set)
2. Fall back to PredictHQ (if Ticketmaster fails)
3. Show helpful error messages if neither works

You're all set! 🎉

