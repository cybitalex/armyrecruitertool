# Nearby Location Search

Your Army Recruiting Tool now **automatically finds real locations** near you using OpenStreetMap!

## 🎯 What It Finds

The app searches for actual recruiting opportunities within 5km (3.1 miles) of your location:

### Schools & Education 🎓
- High schools
- Community colleges
- Universities
- Technical schools

### Fitness Centers 💪
- Gyms
- Fitness centers
- Sports facilities
- Recreation centers

### Community Spaces 🏢
- Community centers
- Public venues
- Meeting halls

### Shopping & Events 🛍️
- Shopping malls
- Event venues
- Convention centers

## 🚀 How to Use

1. **Go to Prospecting Map**
   - Click "Prospecting" in navigation
   - Allow location access when prompted

2. **Click "Find Nearby Locations"**
   - Green button in the header
   - Automatically searches your area
   - Takes 5-10 seconds

3. **Watch Locations Appear**
   - Markers appear on the map
   - Locations added to the sidebar list
   - Each has a prospecting score

4. **Review & Use**
   - Click markers for details
   - See addresses, types, scores
   - Add your own notes and updates

## 📊 Prospecting Scores

Automatically assigned based on location type:

- **Universities**: 95/100
- **Community Colleges**: 90/100
- **High Schools**: 85/100
- **Event Venues**: 80/100
- **Gyms & Fitness**: 75/100
- **Shopping Malls**: 68/100
- **Community Centers**: 70/100

You can manually update scores after visiting locations!

## 🗺️ Data Source

**OpenStreetMap (OSM)**
- 100% FREE forever
- No API key required
- Community-maintained
- Worldwide coverage
- Real, verified locations

The app uses OpenStreetMap's Overpass API to find locations. This is completely free and requires no setup!

## ⚙️ How It Works

### Backend (Automatic)

1. **You click "Find Nearby"**
2. **App sends your GPS coordinates** to the server
3. **Server queries OpenStreetMap** for locations within 5km
4. **Filters for recruiting-relevant** places
5. **Assigns prospecting scores** automatically
6. **Saves to your database**
7. **Returns results to map**

### The Query

The app searches for:
```
- Schools (amenity=school)
- Colleges (amenity=college, university)
- Gyms (leisure=fitness_centre, sports_centre)
- Community Centers (amenity=community_centre)
- Malls (shop=mall)
- Event Venues (amenity=events_venue)
```

## 🎨 Customization

### Change Search Radius

Edit the search radius in the code:

```typescript
// In client/src/pages/prospecting-map.tsx
radius: 5000, // Change to 10000 for 10km, etc.
```

### Adjust Prospecting Scores

Edit scoring logic in:

```typescript
// In server/places.ts
export function calculateProspectingScore(type: string) {
  const baseScores = {
    school: 85,    // Change these values
    gym: 75,       // to match your criteria
    // ...
  };
}
```

### Add More Location Types

Add to the Overpass query in `server/places.ts`:

```typescript
// Add bowling alleys, for example:
node["leisure"="bowling_alley"](around:${radiusMeters},...);
```

## 🆚 vs. Google Places API

| Feature | OpenStreetMap (Current) | Google Places |
|---------|------------------------|---------------|
| **Cost** | FREE forever | Free tier, then paid |
| **Setup** | No API key needed | Requires API key |
| **Coverage** | Worldwide | Worldwide |
| **Data Quality** | Good, community-maintained | Excellent, Google-verified |
| **Speed** | Fast | Very fast |
| **Details** | Basic info | Rich details, photos, ratings |

### Want to Use Google Places Instead?

See the optional upgrade guide below.

## 🔮 Optional: Google Places API

For richer data (ratings, photos, phone numbers), you can add Google Places:

### 1. Get API Key

1. Go to https://console.cloud.google.com
2. Create a project
3. Enable "Places API"
4. Get API key

### 2. Add to Environment

```bash
# In .env
GOOGLE_PLACES_API_KEY=your_key_here
```

### 3. Update Code

The app will automatically use Google Places if the API key is detected (implementation can be added as needed).

## 📈 Future Enhancements

Potential additions:

- **Event Discovery**: Find upcoming local events
- **Demographics**: Show neighborhood statistics
- **Hours of Operation**: Know when locations are open
- **Contact Info**: Get phone numbers automatically
- **Photos**: See what locations look like
- **Reviews**: Check Google ratings
- **Multiple Radius Options**: Quick buttons for 1km, 5km, 10km
- **Location Categories**: Filter by specific types
- **Export**: Download found locations as CSV

## 🐛 Troubleshooting

### "No locations found"

- **Sparse area**: Try increasing search radius
- **Rural location**: OSM might have fewer entries
- **Network issue**: Check internet connection
- **Try again**: Locations get added to OSM daily

### "Search failed"

- Check browser console for errors
- Verify location permissions granted
- Try refreshing the page
- Check Overpass API status: https://overpass-api.de/api/status

### Duplicate Locations

The app should prevent duplicates, but if you see them:
- Manually delete from the locations list
- Check if they're actually different branches
- Update notes to distinguish them

## 🎖️ Best Practices

1. **Search Once Per Area**
   - Locations are saved to database
   - No need to search repeatedly
   - Move to new area to find more

2. **Review Scores**
   - Auto-assigned scores are estimates
   - Update based on actual visits
   - Add demographic notes

3. **Add Your Intel**
   - Click locations to add notes
   - Record best times to visit
   - Document contact persons

4. **Regular Updates**
   - Search periodically (monthly)
   - New locations appear in OSM
   - Keeps database current

5. **Combine with AI Assistant**
   - Ask AI about found locations
   - Get strategy recommendations
   - Understand demographics

## 🚀 Example Workflow

1. **Arrive in new area**
2. **Open Prospecting Map**
3. **Click "Find Nearby Locations"**
4. **Review auto-populated map**
5. **Ask AI**: "Which of these locations should I visit first?"
6. **Visit high-score locations**
7. **Update with your notes**
8. **Plan events at top venues**

## 📚 Additional Resources

- **OpenStreetMap**: https://www.openstreetmap.org
- **Overpass API**: https://overpass-api.de
- **Add missing locations to OSM**: https://www.openstreetmap.org/edit

---

**Now you have real, nearby recruiting locations automatically!** 🎯

