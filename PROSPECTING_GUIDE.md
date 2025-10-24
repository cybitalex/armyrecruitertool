# Army Recruiting Tool - Prospecting Guide

## Overview

The Army Recruiting Tool now includes a comprehensive **Prospecting Map** feature that helps recruiters identify and track:

- **Prime recruiting locations** (schools, gyms, malls, community centers, etc.)
- **Upcoming recruiting events** (career fairs, sports events, festivals, etc.)

## Features

### 🗺️ Interactive Map

- **Visual representation** of all prospecting locations and events
- **Custom markers** for different location types (🎓 schools, 💪 gyms, 🛍️ malls, etc.)
- **Event markers** (📅) for upcoming recruiting opportunities
- **Click markers** to see detailed information in popups
- **Auto-fit bounds** to show all visible markers

### 📍 Location Tracking

Each location includes:

- **Name and type** (school, gym, mall, event venue, community center)
- **Full address** with coordinates
- **Prospecting score** (0-100) indicating recruitment potential
- **Foot traffic level** (low, medium, high)
- **Demographics data** (age range, income level, population)
- **Notes** for best times to visit and contact information
- **Last visited date** for tracking follow-ups

### 📅 Event Management

Each event includes:

- **Event name and type** (career fair, sports event, festival, community event)
- **Date, time, and location**
- **Expected attendance** numbers
- **Target audience** (high school, college, veterans, general)
- **Contact information** (name, phone, email)
- **Registration requirements**
- **Cost information**
- **Status tracking** (upcoming, confirmed, completed, cancelled)

### 🔍 Search & Filter

- **Search bar** to find locations or events by name, city, or address
- **Type filter** to show specific location types
- **Toggle visibility** of locations and events independently
- **Real-time filtering** of the list and map markers

### 📋 List View

- **Tabbed interface** switching between Locations and Events
- **Sorted lists** (locations by score, events by date)
- **Color-coded badges** for scores, traffic, status, and audiences
- **Click items** to highlight on map
- **Detailed cards** with all relevant information

## How to Use

### Accessing the Prospecting Map

1. Click **"Prospecting"** in the navigation header
2. The map will load centered on your area with all locations and events

### Finding Prime Locations

1. Look for locations with **high prospecting scores** (80+)
2. Check the **foot traffic** indicators
3. Review **demographics** to match your target audience
4. Read **notes** for insider tips on best times to visit

### Planning for Events

1. Switch to the **"Events"** tab in the sidebar
2. Sort by date to see upcoming opportunities
3. Check **expected attendance** and **target audience**
4. Note **registration requirements** and deadlines
5. Contact organizers using provided contact info

### Using Search & Filters

- **Search** by name, city, or address to find specific places
- **Filter by type** to focus on schools, gyms, malls, etc.
- **Toggle** location/event buttons to show/hide on map
- **Click markers or list items** to see details

## Sample Data

The system comes pre-loaded with sample locations and events in the Portland, OR area:

### Sample Locations

- **Portland Community College** (Score: 90) - Community college with 8,000 students
- **Lincoln High School** (Score: 85) - Large high school with active JROTC program
- **24 Hour Fitness Downtown** (Score: 72) - Popular gym with young adult demographic
- **Clackamas Town Center** (Score: 68) - Shopping mall with movie theater
- **Pioneer Courthouse Square** (Score: 65) - Downtown public square

### Sample Events

- **Portland Career Expo 2025** - Annual career fair, 2,000+ expected attendees
- **Trail Blazers Home Game** - NBA game with military appreciation night
- **Veterans Day Community Festival** - Community celebration, 5,000+ expected
- **Mt. Hood Community College Job Fair** - Fall semester career fair
- **Rose Festival CityFair** - Annual Portland Rose Festival, 50,000+ attendees

## API Endpoints

### Locations

- `GET /api/locations` - Get all locations
- `GET /api/locations/:id` - Get single location
- `POST /api/locations` - Create new location
- `PATCH /api/locations/:id` - Update location
- `DELETE /api/locations/:id` - Delete location

### Events

- `GET /api/events` - Get all events
- `GET /api/events/:id` - Get single event
- `POST /api/events` - Create new event
- `PATCH /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

## Adding New Locations

To add a new prospecting location, send a POST request to `/api/locations`:

```json
{
  "name": "Example High School",
  "type": "school",
  "address": "123 Main St",
  "city": "Portland",
  "state": "OR",
  "zipCode": "97201",
  "latitude": "45.5152",
  "longitude": "-122.6784",
  "description": "Large public high school",
  "prospectingScore": 85,
  "footTraffic": "high",
  "demographics": "{\"ageRange\": \"14-18\", \"population\": 1500}",
  "notes": "Contact Principal Smith"
}
```

## Adding New Events

To add a new recruiting event, send a POST request to `/api/events`:

```json
{
  "name": "College Career Fair",
  "type": "career_fair",
  "address": "456 Campus Dr",
  "city": "Portland",
  "state": "OR",
  "zipCode": "97202",
  "latitude": "45.5152",
  "longitude": "-122.6784",
  "eventDate": "2025-11-15",
  "eventTime": "10:00 AM",
  "description": "Annual career fair",
  "expectedAttendance": 1000,
  "targetAudience": "college",
  "contactName": "Jane Doe",
  "contactPhone": "(503) 555-0100",
  "contactEmail": "jane@college.edu",
  "registrationRequired": "yes",
  "cost": "Free",
  "status": "upcoming"
}
```

## Best Practices

### Location Prospecting

1. **Focus on high-score locations** for maximum efficiency
2. **Visit during peak hours** as noted in location notes
3. **Track visits** by updating the "lastVisited" field
4. **Update notes** with your observations after each visit
5. **Share successful locations** with your team

### Event Planning

1. **Plan ahead** - register early for popular events
2. **Prepare materials** based on target audience
3. **Coordinate** with event organizers well in advance
4. **Update status** as events progress (confirmed → completed)
5. **Track results** by adding notes after each event

### Data Management

1. **Keep scores updated** based on actual results
2. **Add new locations** as you discover them
3. **Remove outdated** locations and events
4. **Share insights** through the notes field
5. **Regular cleanup** of completed/cancelled events

## Technical Details

### Technology Stack

- **Leaflet** - Interactive mapping library
- **React-Leaflet** - React components for Leaflet
- **OpenStreetMap** - Map tile provider
- **React Query** - Data fetching and caching
- **TypeScript** - Type-safe development

### Map Features

- **Dynamic bounds** - Automatically fits all visible markers
- **Custom icons** - Different emojis for location types
- **Popups** - Click markers for quick info
- **Responsive** - Works on desktop and tablet

### Performance

- **Client-side filtering** for instant search results
- **Memoized filters** to prevent unnecessary re-renders
- **Optimized markers** with efficient icon generation
- **Cached API calls** via React Query

## Troubleshooting

### Map not loading?

- Check browser console for errors
- Ensure Leaflet CSS is loaded
- Verify API endpoints are responding

### Markers not appearing?

- Check that locations/events have valid coordinates
- Ensure latitude/longitude are in correct format (strings)
- Verify the toggle buttons are enabled

### Search not working?

- Clear the search field and try again
- Check that data is loaded (look at tab counts)
- Try different search terms

## Future Enhancements

Potential features for future development:

- **Geocoding** - Convert addresses to coordinates automatically
- **Routing** - Get directions to locations
- **Clustering** - Group nearby markers for better performance
- **Heat maps** - Visualize high-density recruiting areas
- **Calendar integration** - Sync events with calendar apps
- **Mobile app** - Native iOS/Android versions
- **Analytics** - Track recruiting success by location
- **Team collaboration** - Share locations and notes with team

## Support

For questions or issues with the Prospecting feature, please refer to:

- Main README.md for general setup
- API documentation in server/routes.ts
- Schema definitions in shared/schema.ts
