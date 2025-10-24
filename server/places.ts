import type { InsertLocation } from "@shared/schema";
import { generateMockLocations, generateMockEvents } from "./mock-data";

interface OverpassElement {
  type: string;
  id: number;
  lat: number;
  lon: number;
  tags: {
    name?: string;
    amenity?: string;
    leisure?: string;
    shop?: string;
    "addr:street"?: string;
    "addr:housenumber"?: string;
    "addr:city"?: string;
    "addr:state"?: string;
    "addr:postcode"?: string;
    phone?: string;
    website?: string;
  };
}

interface OverpassResponse {
  elements: OverpassElement[];
}

/**
 * Search for nearby locations using Google Places API
 * Finds schools, gyms, community centers, shopping malls, etc.
 * Sign up at https://console.cloud.google.com/
 * Set GOOGLE_PLACES_API_KEY in environment variables to enable
 */
export async function searchNearbyLocations(
  latitude: number,
  longitude: number,
  radiusMeters: number = 5000 // 5km default
): Promise<InsertLocation[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey) {
    console.log("Google Places API key not found. Returning empty locations list.");
    console.log(
      "Get your API key at https://console.cloud.google.com/apis/credentials"
    );
    return [];
  }

  // Place types perfect for Army recruiting
  const placeTypes = [
    'school',           // High schools
    'university',       // Colleges and universities  
    'secondary_school', // High schools (alternative type)
    'gym',             // Fitness centers
    'shopping_mall',   // High foot traffic
    'stadium',         // Sports venues
    'park',            // Community gathering spots
  ];

  try {
    const allLocations: InsertLocation[] = [];

    // Google Places API allows one type per request, so we'll search for each type
    for (const placeType of placeTypes) {
      console.log(`🔍 Searching Google Places for ${placeType} near ${latitude}, ${longitude}`);

      const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
      url.searchParams.append('location', `${latitude},${longitude}`);
      url.searchParams.append('radius', radiusMeters.toString());
      url.searchParams.append('type', placeType);
      url.searchParams.append('key', apiKey);

      const response = await fetch(url.toString());

      if (!response.ok) {
        console.error(`Google Places API error (${response.status}): ${response.statusText}`);
        continue; // Skip this type and continue with others
      }

      const data = await response.json();

      if (data.status === 'INVALID_REQUEST' || data.status === 'REQUEST_DENIED') {
        console.error(`Google Places API error: ${data.status} - ${data.error_message || ''}`);
        if (data.status === 'REQUEST_DENIED') {
          console.log("💡 Make sure your API key has Places API enabled");
          console.log("   Visit: https://console.cloud.google.com/apis/library/places-backend.googleapis.com");
        }
        continue;
      }

      console.log(`✅ Found ${data.results?.length || 0} ${placeType} locations`);

      // Transform Google Places data to our location format
      const locations: InsertLocation[] = (data.results || []).map((place: any) => {
        // Determine our internal type from Google's type
        let type = "community_center";
        let prospectingScore = 50;

        if (place.types?.includes('school') || place.types?.includes('secondary_school')) {
          type = "school";
          prospectingScore = 85;
        } else if (place.types?.includes('university')) {
          type = "school";
          prospectingScore = 95; // Universities are prime recruiting locations
        } else if (place.types?.includes('gym')) {
          type = "gym";
          prospectingScore = 75;
        } else if (place.types?.includes('shopping_mall')) {
          type = "mall";
          prospectingScore = 70;
        } else if (place.types?.includes('stadium')) {
          type = "event_venue";
          prospectingScore = 85;
        } else if (place.types?.includes('park')) {
          type = "community_center";
          prospectingScore = 60;
        }

        // Adjust score based on rating and user ratings
        if (place.rating && place.user_ratings_total) {
          if (place.rating >= 4.0 && place.user_ratings_total > 100) {
            prospectingScore += 5; // Popular, well-reviewed locations
          }
        }

        // Parse address components
        let address = place.vicinity || "Address not available";
        let city = "Unknown";
        let state = "Unknown";
        let zipCode = "00000";

        // Try to get more detailed address info
        if (place.plus_code?.compound_code) {
          const parts = place.plus_code.compound_code.split(', ');
          if (parts.length >= 2) {
            city = parts[parts.length - 2] || city;
            const stateMatch = parts[parts.length - 1]?.match(/([A-Z]{2})/);
            if (stateMatch) {
              state = stateMatch[1];
            }
          }
        }

        const location: InsertLocation = {
          name: place.name || "Unnamed Location",
          type,
          address,
          city,
          state,
          zipCode,
          latitude: place.geometry.location.lat.toString(),
          longitude: place.geometry.location.lng.toString(),
          prospectingScore: Math.min(100, prospectingScore),
          footTraffic: prospectingScore >= 80 ? "high" : prospectingScore >= 60 ? "medium" : "low",
          description: place.editorial_summary?.overview || 
                      `${place.types?.[0]?.replace(/_/g, ' ') || 'Location'} found via Google Places. ${
                        place.rating ? `Rating: ${place.rating}/5 (${place.user_ratings_total} reviews)` : ''
                      }`,
          demographics: JSON.stringify({
            source: "Google Places",
            placeId: place.place_id,
            types: place.types,
            rating: place.rating,
            totalRatings: place.user_ratings_total,
            priceLevel: place.price_level,
            businessStatus: place.business_status,
          }),
          notes: place.opening_hours?.open_now !== undefined 
            ? (place.opening_hours.open_now ? "Currently open" : "Currently closed")
            : null,
          lastVisited: null,
        };

        return location;
      });

      allLocations.push(...locations);

      // Small delay between requests to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Remove duplicates based on place name and proximity
    const uniqueLocations = allLocations.filter((loc, index, self) => {
      return index === self.findIndex((l) => {
        // Consider locations with same name within 50 meters as duplicates
        const distance = calculateDistance(
          parseFloat(loc.latitude),
          parseFloat(loc.longitude),
          parseFloat(l.latitude),
          parseFloat(l.longitude)
        );
        return l.name === loc.name && distance < 0.05; // 50 meters
      });
    });

    console.log(`🎯 Total unique locations found: ${uniqueLocations.length}`);
    return uniqueLocations;

  } catch (error) {
    console.error("Error searching nearby locations:", error);
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to search nearby locations"
    );
  }
}

/**
 * Calculate distance between two coordinates in kilometers
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Search for nearby events using PredictHQ API (FREE TIER: 5,000 events/month)
 * Sign up at https://www.predicthq.com/
 * Set PREDICTHQ_API_KEY in environment variables to enable
 */
export async function searchNearbyEvents(
  latitude: number,
  longitude: number,
  radiusMiles: number = 25
): Promise<any[]> {
  const apiKey = process.env.PREDICTHQ_API_KEY;

  if (!apiKey) {
    console.log("PredictHQ API key not found. Returning empty events list.");
    console.log(
      "Sign up at https://www.predicthq.com/ for free 5,000 events/month"
    );
    return [];
  }

  try {
    // Convert miles to meters for PredictHQ (they use metric)
    const radiusMeters = Math.round(radiusMiles * 1609.34);
    
    // Categories perfect for Army recruiting:
    // - sports: Military appreciation nights, college games
    // - community: Local gatherings, parades
    // - conferences: Career fairs, expos
    // - concerts: Large crowds, young demographics
    // - festivals: Community events
    // - school-holidays: Education-related events
    const categories = [
      'sports',
      'community',
      'conferences',
      'expos',
      'concerts',
      'festivals',
      'performing-arts',
      'school-holidays'
    ].join(',');

    // Build the URL with query parameters
    const url = new URL('https://api.predicthq.com/v1/events/');
    url.searchParams.append('limit', '50');
    url.searchParams.append('within', `${radiusMeters}m@${latitude},${longitude}`);
    url.searchParams.append('category', categories);
    url.searchParams.append('sort', 'start');
    url.searchParams.append('state', 'active'); // Only active events
    
    // Filter for upcoming events only
    const today = new Date().toISOString().split('T')[0];
    url.searchParams.append('start.gte', today);

    console.log(
      `🔍 Searching PredictHQ events near ${latitude}, ${longitude} within ${radiusMiles} miles`
    );

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`PredictHQ API error (${response.status}):`, errorText);

      if (response.status === 401) {
        console.log("💡 Note: Invalid PredictHQ API key.");
        console.log("   - Check your API key at https://control.predicthq.com/");
        console.log("   - Make sure it's added to .env as PREDICTHQ_API_KEY");
      }

      return [];
    }

    const data = await response.json();
    console.log(`✅ Found ${data.results?.length || 0} events from PredictHQ`);

    // Transform PredictHQ data to our event format
    const events = (data.results || []).map((evt: any) => {
      // Determine event type from category
      let type = "community_event";
      let targetAudience = "general";
      
      if (evt.category === "sports") {
        type = "sports_event";
        targetAudience = "young_adults";
      } else if (evt.category === "conferences" || evt.category === "expos") {
        type = "career_fair";
        targetAudience = "high_school";
      } else if (evt.category === "concerts" || evt.category === "performing-arts") {
        type = "concert";
        targetAudience = "young_adults";
      } else if (evt.category === "festivals" || evt.category === "community") {
        type = "festival";
        targetAudience = "general";
      }

      // Get location info
      const location = evt.location || [longitude, latitude];
      const eventLat = location[1] || latitude;
      const eventLon = location[0] || longitude;

      // Parse address from entities
      let address = "Address TBD";
      let city = "Unknown";
      let state = "Unknown";
      let zipCode = "00000";

      if (evt.entities && evt.entities.length > 0) {
        const venue = evt.entities.find((e: any) => e.type === "venue");
        if (venue) {
          address = venue.formatted_address || address;
          // Try to extract city and state from formatted address
          const addressParts = address.split(", ");
          if (addressParts.length >= 2) {
            city = addressParts[addressParts.length - 2] || city;
            const lastPart = addressParts[addressParts.length - 1];
            const stateZipMatch = lastPart.match(/([A-Z]{2})\s*(\d{5})?/);
            if (stateZipMatch) {
              state = stateZipMatch[1];
              zipCode = stateZipMatch[2] || zipCode;
            }
          }
        }
      }

      // Estimate attendance based on rank (PredictHQ's impact score)
      let expectedAttendance = null;
      if (evt.rank) {
        // Rank ranges from 0-100, estimate attendance
        if (evt.rank >= 80) expectedAttendance = 5000;
        else if (evt.rank >= 60) expectedAttendance = 1000;
        else if (evt.rank >= 40) expectedAttendance = 500;
        else expectedAttendance = 100;
      }

      // Generate useful URLs for the event
      let eventUrl = null;
      
      // Try to get official event URL from entities
      if (evt.entities && evt.entities.length > 0) {
        const venue = evt.entities.find((e: any) => e.type === "venue");
        if (venue && venue.formatted_address) {
          // Create Google Maps URL for the venue
          const encodedAddress = encodeURIComponent(venue.formatted_address);
          eventUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
        }
      }
      
      // Fallback to coordinates if no venue address
      if (!eventUrl) {
        eventUrl = `https://www.google.com/maps/search/?api=1&query=${eventLat},${eventLon}`;
      }

      return {
        name: evt.title || "Unnamed Event",
        type,
        address,
        city,
        state,
        zipCode,
        latitude: eventLat.toString(),
        longitude: eventLon.toString(),
        eventDate: evt.start?.split("T")[0] || new Date().toISOString().split("T")[0],
        eventTime: evt.start ? new Date(evt.start).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }) : null,
        endDate: evt.end?.split("T")[0] || null,
        description: evt.description?.substring(0, 500) || `${evt.category} event in ${city}`,
        expectedAttendance,
        targetAudience,
        contactName: null,
        contactEmail: null,
        contactPhone: null,
        registrationRequired: "unknown",
        cost: "Unknown",
        status: "upcoming",
        notes: `Found via PredictHQ. Category: ${evt.category}. Rank: ${evt.rank || 'N/A'}. ${evt.labels?.length ? `Labels: ${evt.labels.join(', ')}` : ''}`,
        eventUrl,
      };
    });

    return events;
  } catch (error) {
    console.error("Error searching events:", error);
    return [];
  }
}

/**
 * Calculate prospecting score based on location characteristics
 */
export function calculateProspectingScore(
  type: string,
  demographics?: any
): number {
  const baseScores: Record<string, number> = {
    school: 85,
    college: 90,
    university: 95,
    gym: 75,
    mall: 68,
    community_center: 70,
    event_venue: 80,
  };

  let score = baseScores[type] || 60;

  // Adjust based on demographics (if available)
  if (demographics?.population && demographics.population > 1000) {
    score += 5;
  }

  return Math.min(100, Math.max(0, score));
}
