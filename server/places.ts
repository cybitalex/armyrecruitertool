import type { InsertLocation } from "@shared/schema";
import { generateMockLocations, generateMockEvents } from "./mock-data";

/**
 * Reverse geocode coordinates to get city and state name
 * Uses OpenStreetMap Nominatim API (free, no API key required)
 */
export async function reverseGeocode(latitude: number, longitude: number): Promise<{ city: string; state: string } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'ArmyRecruiterTool/1.0' // Required by Nominatim
      }
    });

    if (!response.ok) {
      console.error(`Reverse geocoding failed: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const address = data.address || {};
    
    const city = address.city || address.town || address.village || address.municipality || "Unknown";
    const state = address.state || address.region || "Unknown";
    
    return { city, state };
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return null;
  }
}

/**
 * Geocode a zip code to latitude and longitude coordinates
 * Uses OpenStreetMap Nominatim API (free, no API key required)
 */
export async function geocodeZipCode(zipCode: string): Promise<{ latitude: number; longitude: number } | null> {
  try {
    // Clean zip code (remove any non-numeric characters)
    const cleanZip = zipCode.replace(/\D/g, '');
    
    if (cleanZip.length !== 5) {
      console.error(`Invalid zip code format: ${zipCode}`);
      return null;
    }

    // Use Nominatim API to geocode zip code with retry logic for rate limiting
    const url = `https://nominatim.openstreetmap.org/search?postalcode=${cleanZip}&country=US&format=json&limit=1`;
    
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': 'ArmyRecruiterTool/1.0' // Required by Nominatim
          }
        });

        if (response.status === 429) {
          // Rate limited - get retry-after header or use exponential backoff
          const retryAfter = response.headers.get('Retry-After');
          const delay = retryAfter ? parseInt(retryAfter) * 1000 : Math.pow(2, attempt) * 1000;
          
          if (attempt < maxRetries - 1) {
            console.log(`⏳ Rate limited. Retrying in ${delay / 1000} seconds... (attempt ${attempt + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          } else {
            throw new Error(`Rate limited after ${maxRetries} attempts`);
          }
        }

        if (!response.ok) {
          console.error(`Geocoding failed: ${response.status} ${response.statusText}`);
          return null;
        }

        const data = await response.json();
        
        if (data && data.length > 0) {
          const result = data[0];
          return {
            latitude: parseFloat(result.lat),
            longitude: parseFloat(result.lon)
          };
        }

        console.warn(`No results found for zip code: ${zipCode}`);
        return null;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (attempt < maxRetries - 1) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          console.log(`⏳ Retrying geocoding in ${delay / 1000} seconds... (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    console.error('Error geocoding zip code after retries:', lastError);
    return null;
  } catch (error) {
    console.error('Error geocoding zip code:', error);
    return null;
  }
}

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
    console.log(
      "Google Places API key not found. Returning empty locations list."
    );
    console.log(
      "Get your API key at https://console.cloud.google.com/apis/credentials"
    );
    return [];
  }

    // Place types perfect for Army recruiting
    const placeTypes = [
      "university", // Colleges and universities
      "secondary_school", // High schools only
      "gym", // Fitness centers
      "shopping_mall", // High foot traffic
      "stadium", // Sports venues
      "park", // Community gathering spots
    ];

  try {
    const allLocations: InsertLocation[] = [];

    // Google Places API allows one type per request, so we'll search for each type
    for (const placeType of placeTypes) {
      console.log(
        `🔍 Searching Google Places for ${placeType} near ${latitude}, ${longitude}`
      );

      const url = new URL(
        "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
      );
      url.searchParams.append("location", `${latitude},${longitude}`);
      url.searchParams.append("radius", radiusMeters.toString());
      url.searchParams.append("type", placeType);
      url.searchParams.append("key", apiKey);

      const response = await fetch(url.toString());

      if (!response.ok) {
        console.error(
          `Google Places API error (${response.status}): ${response.statusText}`
        );
        continue; // Skip this type and continue with others
      }

      const data = await response.json();

      if (
        data.status === "INVALID_REQUEST" ||
        data.status === "REQUEST_DENIED"
      ) {
        console.error(
          `Google Places API error: ${data.status} - ${
            data.error_message || ""
          }`
        );
        if (data.status === "REQUEST_DENIED") {
          console.log("💡 Make sure your API key has Places API enabled");
          console.log(
            "   Visit: https://console.cloud.google.com/apis/library/places-backend.googleapis.com"
          );
        }
        continue;
      }

      console.log(
        `✅ Found ${data.results?.length || 0} ${placeType} locations`
      );

      // Transform Google Places data to our location format
      const locations: InsertLocation[] = (data.results || []).map(
        (place: any) => {
          // Determine our internal type from Google's type
          let type = "community_center";
          let prospectingScore = 50;

           // Check for secondary schools (high schools) and universities only
           // Explicitly exclude elementary schools
           const placeName = place.name?.toLowerCase() || "";
           const isElementary = placeName.includes("elementary") || 
                                placeName.includes("primary") ||
                                placeName.includes("preschool") ||
                                placeName.includes("kindergarten");
           
           if (place.types?.includes("secondary_school") && !isElementary) {
             type = "school";
             prospectingScore = 90; // High schools are prime recruiting
           } else if (place.types?.includes("university")) {
             type = "school";
             prospectingScore = 95; // Universities/colleges are top priority
           } else if (place.types?.includes("school") && !isElementary) {
             // Generic "school" - only include if it's clearly not elementary
             if (placeName.includes("high") || placeName.includes("senior")) {
               type = "school";
               prospectingScore = 90;
             } else {
               // Skip this location - likely elementary
               return null;
             }
           } else if (place.types?.includes("gym")) {
            type = "gym";
            prospectingScore = 75;
          } else if (place.types?.includes("shopping_mall")) {
            type = "mall";
            prospectingScore = 70;
          } else if (place.types?.includes("stadium")) {
            type = "event_venue";
            prospectingScore = 85;
          } else if (place.types?.includes("park")) {
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
            const parts = place.plus_code.compound_code.split(", ");
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
            footTraffic:
              prospectingScore >= 80
                ? "high"
                : prospectingScore >= 60
                ? "medium"
                : "low",
            description:
              place.editorial_summary?.overview ||
              `${
                place.types?.[0]?.replace(/_/g, " ") || "Location"
              } found via Google Places. ${
                place.rating
                  ? `Rating: ${place.rating}/5 (${place.user_ratings_total} reviews)`
                  : ""
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
            notes:
              place.opening_hours?.open_now !== undefined
                ? place.opening_hours.open_now
                  ? "Currently open"
                  : "Currently closed"
                : null,
            lastVisited: null,
          };

           return location;
         }
       );

       // Filter out null results (excluded elementary schools)
       const validLocations = locations.filter((loc): loc is InsertLocation => loc !== null);
       allLocations.push(...validLocations);

      // Small delay between requests to respect rate limits
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Remove duplicates based on place name and proximity
    const uniqueLocations = allLocations.filter((loc, index, self) => {
      return (
        index ===
        self.findIndex((l) => {
          // Consider locations with same name within 50 meters as duplicates
          const distance = calculateDistance(
            parseFloat(loc.latitude),
            parseFloat(loc.longitude),
            parseFloat(l.latitude),
            parseFloat(l.longitude)
          );
          return l.name === loc.name && distance < 0.05; // 50 meters
        })
      );
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
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Search for nearby events using Ticketmaster and SerpAPI
 * - Ticketmaster: Sports, concerts, theater (FREE: 5,000/day)
 * - SerpAPI: Google Events (100 free searches/month)
 * 
 * NOTE: Eventbrite public event search was shut down in December 2019
 * NOTE: PredictHQ trial expired
 */
export async function searchNearbyEvents(
  latitude: number,
  longitude: number,
  radiusMiles: number = 25
): Promise<any[]> {
  const allEvents: any[] = [];
  
  // PRIMARY: Try Ticketmaster (sports, concerts, theater)
  const ticketmasterKey = process.env.TICKETMASTER_API_KEY;
  if (ticketmasterKey) {
    try {
      const ticketmasterEvents = await searchTicketmasterEvents(latitude, longitude, radiusMiles, ticketmasterKey);
      allEvents.push(...ticketmasterEvents);
      console.log(`✅ Added ${ticketmasterEvents.length} events from Ticketmaster`);
    } catch (error) {
      console.error("Ticketmaster API error:", error);
    }
  } else {
    console.log("⚠️ No Ticketmaster API key found. Add TICKETMASTER_API_KEY to .env");
    console.log("  - Get your key at: https://developer.ticketmaster.com/");
  }
  
  // SECONDARY: Try SerpAPI Google Events (broader coverage)
  const serpapiKey = process.env.SERPAPI_KEY;
  if (serpapiKey) {
    try {
      const serpapiEvents = await searchSerpAPIEvents(latitude, longitude, radiusMiles, serpapiKey);
      allEvents.push(...serpapiEvents);
      console.log(`✅ Added ${serpapiEvents.length} events from SerpAPI`);
    } catch (error) {
      console.error("SerpAPI error:", error);
    }
  } else {
    console.log("⚠️ No SerpAPI key found. Add SERPAPI_KEY to .env for additional event coverage");
    console.log("  - Get your key at: https://serpapi.com/");
  }
  
  // Remove duplicates based on event name and date
  const uniqueEvents = allEvents.filter((event, index, self) => {
    return index === self.findIndex((e) => {
      // Consider events with same name and date as duplicates
      return e.name === event.name && e.eventDate === event.eventDate;
    });
  });
  
  if (uniqueEvents.length > 0) {
    console.log(`🎉 Total unique events found: ${uniqueEvents.length} (Ticketmaster + SerpAPI)`);
    return uniqueEvents;
  }
  
  // No events found
  console.log("No events found from any source");
  return [];
  
  /* NOTE: Eventbrite public event search was SHUT DOWN on December 12, 2019
   * The /v3/events/search/ endpoint no longer exists.
   * Eventbrite API can only list events you own, not search public events.
   * See: https://www.eventbrite.com/platform/api - "Event Search - deprecated"
   */
}

/**
 * Search Ticketmaster Discovery API for events
 */
async function searchTicketmasterEvents(
  latitude: number,
  longitude: number,
  radiusMiles: number,
  apiKey: string
): Promise<any[]> {
  try {
    console.log(
      `🔍 Searching Ticketmaster events near ${latitude}, ${longitude} within ${radiusMiles} miles`
    );

    // Build Ticketmaster API URL
    const url = new URL("https://app.ticketmaster.com/discovery/v2/events.json");
    url.searchParams.append("latlong", `${latitude},${longitude}`);
    url.searchParams.append("radius", radiusMiles.toString());
    url.searchParams.append("unit", "miles");
    url.searchParams.append("size", "50");
    url.searchParams.append("sort", "date,asc");
    
    // Categories good for recruiting
    url.searchParams.append("classificationName", "Sports,Music,Arts & Theatre,Family,Miscellaneous");
    
    url.searchParams.append("apikey", apiKey);

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Ticketmaster API error (${response.status}):`, errorText);
      throw new Error(`Ticketmaster API error: ${response.status}`);
    }

    const data = await response.json();
    const events = data._embedded?.events || [];
    
    console.log(`✅ Found ${events.length} events from Ticketmaster`);

    // Transform Ticketmaster data to our event format
    return events.map((evt: any) => {
      // Determine event type from classification
      let type = "community_event";
      let targetAudience = "general";

      const classification = evt.classifications?.[0];
      if (classification) {
        const segment = classification.segment?.name?.toLowerCase() || "";
        const genre = classification.genre?.name?.toLowerCase() || "";
        
        if (segment.includes("sports")) {
          type = "sports_event";
          targetAudience = "young_adults";
        } else if (segment.includes("music") || genre.includes("concert")) {
          type = "concert";
          targetAudience = "young_adults";
        } else if (segment.includes("family")) {
          type = "festival";
          targetAudience = "general";
        } else if (segment.includes("arts")) {
          type = "community_event";
          targetAudience = "general";
        }
      }

      // Get venue info
      const venue = evt._embedded?.venues?.[0];
      const address = venue?.address?.line1 || "Address TBD";
      const city = venue?.city?.name || "Unknown";
      const state = venue?.state?.stateCode || "Unknown";
      const zipCode = venue?.postalCode || "00000";
      const venueLat = venue?.location?.latitude || latitude;
      const venueLon = venue?.location?.longitude || longitude;

      // Get date/time
      const startDate = evt.dates?.start?.localDate || new Date().toISOString().split("T")[0];
      const startTime = evt.dates?.start?.localTime || null;

      // Estimate attendance from venue capacity or price range
      let expectedAttendance = null;
      if (venue?.capacity) {
        expectedAttendance = venue.capacity;
      }

      // Get URLs
      const eventUrl = evt.url || null;
      const locationUrl = venue?.url || 
        `https://www.google.com/maps/search/?api=1&query=${venueLat},${venueLon}`;

      return {
        name: evt.name || "Unnamed Event",
        type,
        address,
        city,
        state,
        zipCode,
        latitude: venueLat.toString(),
        longitude: venueLon.toString(),
        eventDate: startDate,
        eventTime: startTime,
        endDate: evt.dates?.end?.localDate || null,
        description: evt.info || evt.pleaseNote || `${type.replace(/_/g, " ")} in ${city}`,
        expectedAttendance,
        targetAudience,
        contactName: null,
        contactEmail: null,
        contactPhone: null,
        registrationRequired: evt.dates?.status?.code === "rescheduled" ? "yes" : "unknown",
        cost: evt.priceRanges?.[0] 
          ? `$${evt.priceRanges[0].min}-$${evt.priceRanges[0].max}` 
          : "Check website",
        status: "upcoming",
        notes: `Found via Ticketmaster. ${classification?.segment?.name || ""} ${classification?.genre?.name || ""}. ${venue?.name || ""}`,
        eventUrl,
        locationUrl,
      };
    });
  } catch (error) {
    console.error("Error searching Ticketmaster events:", error);
    throw error;
  }
}

/**
 * Search SerpAPI Google Events for nearby events
 * Uses Google Events search results via SerpAPI
 */
async function searchSerpAPIEvents(
  latitude: number,
  longitude: number,
  radiusMiles: number,
  apiKey: string
): Promise<any[]> {
  try {
    console.log(
      `🔍 Searching SerpAPI Google Events near ${latitude}, ${longitude} within ${radiusMiles} miles`
    );

    // Reverse geocode to get city/state for SerpAPI location parameter
    const location = await reverseGeocode(latitude, longitude);
    if (!location) {
      console.warn("⚠️ Could not reverse geocode coordinates, skipping SerpAPI search");
      return [];
    }

    // Clean up city name (remove "City of", "Town of", etc.)
    let cleanCity = location.city
      .replace(/^City of /i, "")
      .replace(/^Town of /i, "")
      .replace(/^Village of /i, "")
      .trim();
    
    // Skip if city is unknown or invalid
    if (cleanCity === "Unknown" || cleanCity.length < 2) {
      console.warn(`⚠️ Invalid city name "${cleanCity}", skipping SerpAPI search`);
      return [];
    }

    // Build SerpAPI Google Events URL
    // Use simpler location format: "City, State" without "United States"
    const locationString = `${cleanCity}, ${location.state}`;
    const url = new URL("https://serpapi.com/search");
    url.searchParams.append("engine", "google_events");
    url.searchParams.append("q", `events in ${locationString}`);
    url.searchParams.append("location", locationString);
    url.searchParams.append("hl", "en");
    url.searchParams.append("gl", "us");
    url.searchParams.append("api_key", apiKey);
    
    console.log(`📍 SerpAPI search location: ${locationString}`);

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`SerpAPI error (${response.status}):`, errorText);
      
      if (response.status === 401) {
        console.error("💡 Invalid SerpAPI key. Check your SERPAPI_KEY in secrets.");
      }
      
      return [];
    }

    const data = await response.json();
    const events = data.events_results || [];
    
    console.log(`✅ Found ${events.length} events from SerpAPI Google Events`);

    // Transform SerpAPI data to our event format
    return events.map((evt: any) => {
      // Determine event type from title/description
      let type = "community_event";
      let targetAudience = "general";

      const title = (evt.title || "").toLowerCase();
      const description = (evt.description || "").toLowerCase();
      
      if (title.includes("sport") || title.includes("game") || title.includes("match")) {
        type = "sports_event";
        targetAudience = "young_adults";
      } else if (title.includes("concert") || title.includes("music") || title.includes("festival")) {
        type = "concert";
        targetAudience = "young_adults";
      } else if (title.includes("career") || title.includes("job fair") || title.includes("expo")) {
        type = "career_fair";
        targetAudience = "high_school";
      } else if (title.includes("festival") || title.includes("fair")) {
        type = "festival";
        targetAudience = "general";
      }

      // Get venue info
      const venue = evt.venue || {};
      // Handle address - SerpAPI may return it as an array, convert to string
      let address = "Address TBD";
      if (venue.address) {
        address = Array.isArray(venue.address) ? venue.address.join(", ") : String(venue.address);
      } else if (evt.address) {
        address = Array.isArray(evt.address) ? evt.address.join(", ") : String(evt.address);
      }
      // Use cleaned city name (from outer scope)
      const city = cleanCity || location.city || "Unknown";
      const state = location.state || "Unknown";
      const zipCode = "00000"; // SerpAPI doesn't always provide zip
      
      // Try to extract coordinates from venue or use provided location
      let venueLat = latitude;
      let venueLon = longitude;
      
      if (venue.gps_coordinates) {
        venueLat = venue.gps_coordinates.latitude || latitude;
        venueLon = venue.gps_coordinates.longitude || longitude;
      }

      // Get date/time
      const startDate = evt.date?.start_date || evt.date?.when || new Date().toISOString().split("T")[0];
      const startTime = evt.date?.start_time || null;
      const endDate = evt.date?.end_date || null;

      // Estimate attendance (SerpAPI doesn't always provide this)
      let expectedAttendance = null;
      if (evt.attendance) {
        expectedAttendance = parseInt(evt.attendance) || null;
      }

      // Get URLs
      const eventUrl = evt.link || evt.event_location?.gps_coordinates ? 
        `https://www.google.com/search?q=${encodeURIComponent(evt.title || "event")}` : null;
      const locationUrl = venue.gps_coordinates ? 
        `https://www.google.com/maps/search/?api=1&query=${venueLat},${venueLon}` :
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;

      // Check if free or paid
      const cost = evt.ticket_info?.extensions?.[0] || "Check website for pricing";

      return {
        name: evt.title || "Unnamed Event",
        type,
        address,
        city,
        state,
        zipCode,
        latitude: venueLat.toString(),
        longitude: venueLon.toString(),
        eventDate: startDate,
        eventTime: startTime,
        endDate,
        description: evt.description || `${type.replace(/_/g, " ")} in ${city}`,
        expectedAttendance,
        targetAudience,
        contactName: null,
        contactEmail: null,
        contactPhone: null,
        registrationRequired: "unknown",
        cost,
        status: "upcoming",
        notes: `Found via SerpAPI Google Events. ${venue.name ? `Venue: ${venue.name}. ` : ""}${evt.date?.when || ""}`,
        eventUrl,
        locationUrl,
      };
    });
  } catch (error) {
    console.error("Error searching SerpAPI events:", error);
    return [];
  }
}

/**
 * Search Eventbrite API for community events
 */
async function searchEventbriteEvents(
  latitude: number,
  longitude: number,
  radiusMiles: number,
  apiKey: string
): Promise<any[]> {
  try {
    console.log(
      `🔍 Searching Eventbrite events near ${latitude}, ${longitude} within ${radiusMiles} miles`
    );

    // Eventbrite API requires location.address (city, state) format
    // Reverse geocode coordinates to get city name
    const location = await reverseGeocode(latitude, longitude);
    if (!location) {
      console.warn("⚠️ Could not reverse geocode coordinates, skipping Eventbrite search");
      return [];
    }

    // Eventbrite API v3 - Use /v3/events/search/ endpoint with location.address
    const url = new URL("https://www.eventbriteapi.com/v3/events/search/");
    
    // Use location.address format: "City, State" or just "City"
    const locationAddress = `${location.city}, ${location.state}`;
    url.searchParams.append("location.address", locationAddress);
    
    // Additional search parameters
    url.searchParams.append("expand", "venue,category,organizer");
    url.searchParams.append("sort_by", "date");
    url.searchParams.append("page_size", "50");
    url.searchParams.append("status", "live"); // Only get live/active events

    console.log(`📍 Eventbrite URL: ${url.toString()}`);
    
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Eventbrite API error (${response.status}):`, errorText);
      
      // Provide helpful error message
      if (response.status === 404) {
        console.error("💡 Eventbrite API endpoint not found. Possible issues:");
        console.error("   - API endpoint structure may have changed");
        console.error("   - Check Eventbrite API documentation: https://www.eventbrite.com/platform/api");
        console.error("   - Verify API key has correct permissions");
      } else if (response.status === 401) {
        console.error("💡 Invalid Eventbrite API key. Check your EVENTBRITE_API_KEY in secrets.");
      }
      
      throw new Error(`Eventbrite API error: ${response.status}`);
    }

    const data = await response.json();
    const events = data.events || [];

    console.log(`✅ Found ${events.length} events from Eventbrite`);

    // Transform Eventbrite data to our event format
    return events.map((evt: any) => {
      // Determine event type from category
      let type = "community_event";
      let targetAudience = "general";

      const categoryName = evt.category?.name?.toLowerCase() || "";
      if (categoryName.includes("business") || categoryName.includes("career")) {
        type = "career_fair";
        targetAudience = "high_school";
      } else if (categoryName.includes("music") || categoryName.includes("performing")) {
        type = "concert";
        targetAudience = "young_adults";
      } else if (categoryName.includes("sports") || categoryName.includes("fitness")) {
        type = "sports_event";
        targetAudience = "young_adults";
      } else if (categoryName.includes("community") || categoryName.includes("festival")) {
        type = "festival";
        targetAudience = "general";
      }

      // Get venue info
      const venue = evt.venue;
      const address = venue?.address?.localized_address_display || venue?.address?.address_1 || "Address TBD";
      const city = venue?.address?.city || "Unknown";
      const state = venue?.address?.region || "Unknown";
      const zipCode = venue?.address?.postal_code || "00000";
      const venueLat = venue?.latitude || latitude;
      const venueLon = venue?.longitude || longitude;

      // Get date/time
      const startDate = evt.start?.local?.split("T")[0] || new Date().toISOString().split("T")[0];
      const startTime = evt.start?.local?.split("T")[1]?.substring(0, 5) || null;
      const endDate = evt.end?.local?.split("T")[0] || null;

      // Get attendance info
      const expectedAttendance = evt.capacity || null;

      // Get URLs
      const eventUrl = evt.url || null;
      const locationUrl = venue?.resource_uri || 
        `https://www.google.com/maps/search/?api=1&query=${venueLat},${venueLon}`;

      // Check if free or paid
      const isFree = evt.is_free || false;
      const cost = isFree ? "Free" : "Check website for pricing";

      return {
        name: evt.name?.text || "Unnamed Event",
        type,
        address,
        city,
        state,
        zipCode,
        latitude: venueLat.toString(),
        longitude: venueLon.toString(),
        eventDate: startDate,
        eventTime: startTime,
        endDate,
        description: evt.description?.text?.substring(0, 500) || evt.summary || `${type.replace(/_/g, " ")} in ${city}`,
        expectedAttendance,
        targetAudience,
        contactName: evt.organizer?.name || null,
        contactEmail: null,
        contactPhone: null,
        registrationRequired: evt.invite_only ? "yes" : "no",
        cost,
        status: "upcoming",
        notes: `Found via Eventbrite. Category: ${evt.category?.name || "N/A"}. ${isFree ? "FREE event" : "Paid event"}. ${venue?.name || ""}`,
        eventUrl,
        locationUrl,
      };
    });
  } catch (error) {
    console.error("Error searching Eventbrite events:", error);
    throw error;
  }
}

/**
 * Search PredictHQ API for events (fallback)
 */
async function searchPredictHQEvents(
  latitude: number,
  longitude: number,
  radiusMiles: number,
  apiKey: string
): Promise<any[]> {

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
      "sports",
      "community",
      "conferences",
      "expos",
      "concerts",
      "festivals",
      "performing-arts",
      "school-holidays",
    ].join(",");

    // Build the URL with query parameters
    const url = new URL("https://api.predicthq.com/v1/events/");
    url.searchParams.append("limit", "50");
    url.searchParams.append(
      "within",
      `${radiusMeters}m@${latitude},${longitude}`
    );
    url.searchParams.append("category", categories);
    url.searchParams.append("sort", "start");
    url.searchParams.append("state", "active"); // Only active events

    // Filter for upcoming events only
    const today = new Date().toISOString().split("T")[0];
    url.searchParams.append("start.gte", today);

    console.log(
      `🔍 Searching PredictHQ events near ${latitude}, ${longitude} within ${radiusMiles} miles`
    );

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`PredictHQ API error (${response.status}):`, errorText);

      if (response.status === 401) {
        console.log("💡 Note: Invalid PredictHQ API key.");
        console.log(
          "   - Check your API key at https://control.predicthq.com/"
        );
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
      } else if (
        evt.category === "concerts" ||
        evt.category === "performing-arts"
      ) {
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

      // Get the official event URL and location URL
      let eventUrl = null;
      let locationUrl = null;

      // Try to get official event page URL from PredictHQ
      // Note: Free tier may not always include event URLs
      if (evt.entities && evt.entities.length > 0) {
        // Check for event entity with URL
        const eventEntity = evt.entities.find(
          (e: any) => e.type === "event" && (e.url || e.website)
        );
        if (eventEntity) {
          eventUrl = eventEntity.url || eventEntity.website;
        }

        // Check venue for website (might be useful)
        const venue = evt.entities.find((e: any) => e.type === "venue");
        if (venue && !eventUrl && venue.url) {
          // Only use venue URL if it looks like an event page
          const venueUrl = venue.url || venue.website;
          if (venueUrl && !venueUrl.includes("google.com")) {
            eventUrl = venueUrl;
          }
        }

        // Create Google Maps URL for the venue location
        if (venue && venue.formatted_address) {
          const encodedAddress = encodeURIComponent(venue.formatted_address);
          locationUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
        }
      }

      // Check if PredictHQ provides a direct event URL in the main data
      if (!eventUrl && evt.url && !evt.url.includes("google.com")) {
        eventUrl = evt.url;
      }

      // Check for website in event data
      if (!eventUrl && evt.website && !evt.website.includes("google.com")) {
        eventUrl = evt.website;
      }

      // Fallback: Create Google Maps URL from coordinates if no location URL
      if (!locationUrl) {
        locationUrl = `https://www.google.com/maps/search/?api=1&query=${eventLat},${eventLon}`;
      }

      // Don't set eventUrl to Google search - leave it null if no official page found
      // The UI will handle showing a search option instead

      return {
        name: evt.title || "Unnamed Event",
        type,
        address,
        city,
        state,
        zipCode,
        latitude: eventLat.toString(),
        longitude: eventLon.toString(),
        eventDate:
          evt.start?.split("T")[0] || new Date().toISOString().split("T")[0],
        eventTime: evt.start
          ? new Date(evt.start).toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            })
          : null,
        endDate: evt.end?.split("T")[0] || null,
        description:
          evt.description?.substring(0, 500) ||
          `${evt.category} event in ${city}`,
        expectedAttendance,
        targetAudience,
        contactName: null,
        contactEmail: null,
        contactPhone: null,
        registrationRequired: "unknown",
        cost: "Unknown",
        status: "upcoming",
        notes: `Found via PredictHQ. Category: ${evt.category}. Rank: ${
          evt.rank || "N/A"
        }. ${evt.labels?.length ? `Labels: ${evt.labels.join(", ")}` : ""}`,
        eventUrl,
        locationUrl,
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

