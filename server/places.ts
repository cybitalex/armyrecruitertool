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
 * Search for nearby locations using OpenStreetMap Overpass API (FREE!)
 * Finds schools, gyms, community centers, shopping malls, etc.
 */
export async function searchNearbyLocations(
  latitude: number,
  longitude: number,
  radiusMeters: number = 5000 // 5km default
): Promise<InsertLocation[]> {
  // 🎭 USING MOCK DATA for demonstration
  // Toggle this to use real OpenStreetMap data when ready
  const USE_MOCK_DATA = true;
  
  if (USE_MOCK_DATA) {
    console.log(`🎭 Generating mock locations near ${latitude}, ${longitude}`);
    const mockLocations = generateMockLocations(latitude, longitude, radiusMeters);
    console.log(`✅ Generated ${mockLocations.length} mock locations`);
    return mockLocations;
  }
  
  // Build Overpass QL query to find recruiting-relevant locations
  const query = `
    [out:json][timeout:25];
    (
      // Schools
      node["amenity"="school"](around:${radiusMeters},${latitude},${longitude});
      way["amenity"="school"](around:${radiusMeters},${latitude},${longitude});
      node["amenity"="college"](around:${radiusMeters},${latitude},${longitude});
      way["amenity"="college"](around:${radiusMeters},${latitude},${longitude});
      node["amenity"="university"](around:${radiusMeters},${latitude},${longitude});
      way["amenity"="university"](around:${radiusMeters},${latitude},${longitude});
      
      // Gyms and Fitness Centers
      node["leisure"="fitness_centre"](around:${radiusMeters},${latitude},${longitude});
      way["leisure"="fitness_centre"](around:${radiusMeters},${latitude},${longitude});
      node["leisure"="sports_centre"](around:${radiusMeters},${latitude},${longitude});
      way["leisure"="sports_centre"](around:${radiusMeters},${latitude},${longitude});
      
      // Community Centers
      node["amenity"="community_centre"](around:${radiusMeters},${latitude},${longitude});
      way["amenity"="community_centre"](around:${radiusMeters},${latitude},${longitude});
      
      // Shopping Malls
      node["shop"="mall"](around:${radiusMeters},${latitude},${longitude});
      way["shop"="mall"](around:${radiusMeters},${latitude},${longitude});
      
      // Event Venues
      node["amenity"="events_venue"](around:${radiusMeters},${latitude},${longitude});
      way["amenity"="events_venue"](around:${radiusMeters},${latitude},${longitude});
    );
    out center;
  `;

  try {
    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query,
      headers: {
        "Content-Type": "text/plain",
      },
    });

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.statusText}`);
    }

    const data: OverpassResponse = await response.json();

    // Transform Overpass data to our location format
    const locations: InsertLocation[] = data.elements
      .filter((element) => element.tags?.name) // Only include named places
      .map((element) => {
        const lat = element.lat || (element as any).center?.lat;
        const lon = element.lon || (element as any).center?.lon;

        if (!lat || !lon) return null;

        // Determine location type
        let type = "community_center";
        let prospectingScore = 50;

        if (element.tags.amenity === "school") {
          type = "school";
          prospectingScore = 85;
        } else if (
          element.tags.amenity === "college" ||
          element.tags.amenity === "university"
        ) {
          type = "school";
          prospectingScore = 90;
        } else if (
          element.tags.leisure === "fitness_centre" ||
          element.tags.leisure === "sports_centre"
        ) {
          type = "gym";
          prospectingScore = 75;
        } else if (element.tags.shop === "mall") {
          type = "mall";
          prospectingScore = 70;
        } else if (element.tags.amenity === "events_venue") {
          type = "event_venue";
          prospectingScore = 80;
        }

        // Build address
        const address =
          element.tags["addr:housenumber"] && element.tags["addr:street"]
            ? `${element.tags["addr:housenumber"]} ${element.tags["addr:street"]}`
            : element.tags["addr:street"] || "Address not available";

        const location: InsertLocation = {
          name: element.tags.name || "Unnamed Location",
          type,
          address,
          city: element.tags["addr:city"] || "Unknown",
          state: element.tags["addr:state"] || "Unknown",
          zipCode: element.tags["addr:postcode"] || "00000",
          latitude: lat.toString(),
          longitude: lon.toString(),
          prospectingScore,
          footTraffic: prospectingScore >= 80 ? "high" : "medium",
          description: `Found via OpenStreetMap. Type: ${
            element.tags.amenity ||
            element.tags.leisure ||
            element.tags.shop ||
            "location"
          }`,
          demographics: JSON.stringify({
            source: "OpenStreetMap",
            type: element.tags.amenity || element.tags.leisure,
          }),
          notes: null,
          lastVisited: null,
        };

        return location;
      })
      .filter((loc): loc is InsertLocation => loc !== null);

    return locations;
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
 * Search for nearby events using Eventbrite API (FREE!)
 * Sign up at https://www.eventbrite.com/platform/api
 * Set EVENTBRITE_API_KEY in environment variables to enable
 */
export async function searchNearbyEvents(
  latitude: number,
  longitude: number,
  radiusMiles: number = 25
): Promise<any[]> {
  // 🎭 USING MOCK DATA for demonstration
  // Toggle this to use real Eventbrite data when API is approved
  const USE_MOCK_DATA = true;
  
  if (USE_MOCK_DATA) {
    console.log(`🎭 Generating mock events near ${latitude}, ${longitude}`);
    const mockEvents = generateMockEvents(latitude, longitude, radiusMiles);
    console.log(`✅ Generated ${mockEvents.length} mock recruiting events`);
    return mockEvents;
  }
  
  const apiKey = process.env.EVENTBRITE_API_KEY;

  if (!apiKey) {
    console.log("Eventbrite API key not found. Returning empty events list.");
    console.log(
      "Sign up at https://www.eventbrite.com/platform/api for free access"
    );
    return [];
  }

  try {
    const url = `https://www.eventbriteapi.com/v3/events/search/?location.latitude=${latitude}&location.longitude=${longitude}&location.within=${radiusMiles}mi&expand=venue&sort_by=date`;

    console.log(
      `🔍 Searching Eventbrite events near ${latitude}, ${longitude}`
    );

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Eventbrite API error (${response.status}):`, errorText);

      // Eventbrite API may require specific account permissions
      if (response.status === 404 || response.status === 401) {
        console.log("💡 Note: Eventbrite API access may be limited.");
        console.log(
          "   - Ensure your API key is from an approved Eventbrite app"
        );
        console.log("   - Free tier may have restricted endpoint access");
        console.log("   - Consider using manual event entry instead");
      }

      return [];
    }

    const data = await response.json();
    console.log(`✅ Found ${data.events?.length || 0} events from Eventbrite`);

    // Transform to our event format
    const events = (data.events || []).map((evt: any) => ({
      name: evt.name?.text || "Unnamed Event",
      type: evt.category?.name?.toLowerCase().includes("career")
        ? "career_fair"
        : evt.category?.name?.toLowerCase().includes("sport")
        ? "sports_event"
        : evt.category?.name?.toLowerCase().includes("festival")
        ? "festival"
        : "community_event",
      address: evt.venue?.address?.localized_address_display || "Address TBD",
      city: evt.venue?.address?.city || "Unknown",
      state: evt.venue?.address?.region || "Unknown",
      zipCode: evt.venue?.address?.postal_code || "00000",
      latitude: (evt.venue?.latitude || latitude).toString(),
      longitude: (evt.venue?.longitude || longitude).toString(),
      eventDate:
        evt.start?.local?.split("T")[0] ||
        new Date().toISOString().split("T")[0],
      eventTime: evt.start?.local?.split("T")[1]?.substring(0, 5) || null,
      endDate: evt.end?.local?.split("T")[0] || null,
      description:
        evt.description?.text?.substring(0, 500) || "No description available",
      expectedAttendance: evt.capacity || null,
      targetAudience: "general",
      contactName: evt.organizer?.name || null,
      contactEmail: null,
      contactPhone: null,
      registrationRequired: evt.is_free ? "no" : "yes",
      cost: evt.is_free ? "Free" : "Paid",
      status: "upcoming",
      notes: `Found via Eventbrite. URL: ${evt.url || "N/A"}`,
    }));

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
