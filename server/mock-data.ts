import type { InsertLocation, InsertEvent } from "@shared/schema";

/**
 * Generate mock schools, gyms, and locations near a given coordinate
 * This simulates what OpenStreetMap would return
 */
export function generateMockLocations(
  latitude: number,
  longitude: number,
  radius: number = 5000 // meters
): InsertLocation[] {
  const locations: InsertLocation[] = [];
  
  // Convert radius to approximate lat/lng offset (rough approximation)
  const latOffset = (radius / 111000); // 1 degree lat ≈ 111km
  const lngOffset = (radius / (111000 * Math.cos(latitude * Math.PI / 180)));
  
  // Generate 15-20 locations around the area
  const locationTypes = [
    { type: "school", names: ["Lincoln High School", "Jefferson Middle School", "Washington Elementary", "Roosevelt High School", "Madison Academy"], score: 85, emoji: "🎓" },
    { type: "gym", names: ["24 Hour Fitness", "Planet Fitness", "Gold's Gym", "LA Fitness", "Anytime Fitness"], score: 75, emoji: "💪" },
    { type: "mall", names: ["Town Center Mall", "Plaza Shopping Center", "Westfield Mall"], score: 70, emoji: "🛍️" },
    { type: "community_center", names: ["Community Recreation Center", "YMCA", "Veterans Memorial Center"], score: 80, emoji: "🏢" },
  ];
  
  locationTypes.forEach(({ type, names, score, emoji }) => {
    names.forEach((name, index) => {
      // Generate random offset within radius
      const randomLatOffset = (Math.random() - 0.5) * latOffset * 2;
      const randomLngOffset = (Math.random() - 0.5) * lngOffset * 2;
      
      const newLat = latitude + randomLatOffset;
      const newLng = longitude + randomLngOffset;
      
      // Generate realistic address
      const streetNumber = Math.floor(Math.random() * 9000) + 1000;
      const streets = ["Main St", "Oak Ave", "Maple Dr", "Cedar Ln", "Pine Rd", "Elm St", "Park Blvd"];
      const street = streets[Math.floor(Math.random() * streets.length)];
      
      locations.push({
        name: `${name}`,
        type,
        address: `${streetNumber} ${street}`,
        city: "Local City", // You could use reverse geocoding for real city names
        state: "State",
        zipCode: `${Math.floor(Math.random() * 90000) + 10000}`,
        latitude: newLat.toFixed(6),
        longitude: newLng.toFixed(6),
        prospectingScore: score + Math.floor(Math.random() * 15) - 5, // Vary score ±5
        footTraffic: score > 80 ? "high" : score > 70 ? "medium" : "low",
        description: `${emoji} Mock location for demonstration. Type: ${type}`,
        demographics: JSON.stringify({
          source: "Mock Data",
          type,
          ageRange: type === "school" ? "14-18" : "18-35",
          estimatedDaily: Math.floor(Math.random() * 500) + 100,
        }),
        notes: "Generated for demonstration purposes",
        lastVisited: null,
      });
    });
  });
  
  return locations;
}

/**
 * Generate mock events near a given coordinate
 * This simulates recruiting opportunities
 */
export function generateMockEvents(
  latitude: number,
  longitude: number,
  radius: number = 25 // miles, converted to meters
): InsertEvent[] {
  const events: InsertEvent[] = [];
  
  const radiusMeters = radius * 1609.34; // Convert miles to meters
  const latOffset = (radiusMeters / 111000);
  const lngOffset = (radiusMeters / (111000 * Math.cos(latitude * Math.PI / 180)));
  
  // Generate events over next 3 months
  const today = new Date();
  
  const eventTemplates = [
    {
      name: "Spring Career Fair",
      type: "career_fair" as const,
      targetAudience: "college",
      attendance: 500,
      description: "Annual spring career fair featuring government, military, and private sector employers.",
    },
    {
      name: "High School Job & College Expo",
      type: "career_fair" as const,
      targetAudience: "high_school",
      attendance: 300,
      description: "Connecting high school seniors with college programs and career opportunities.",
    },
    {
      name: "Veterans Appreciation Day",
      type: "community_event" as const,
      targetAudience: "veterans",
      attendance: 400,
      description: "Community celebration honoring veterans and active military personnel.",
    },
    {
      name: "College Football Game - Military Appreciation Night",
      type: "sports_event" as const,
      targetAudience: "general",
      attendance: 5000,
      description: "Special military appreciation night with Army recruitment booth.",
    },
    {
      name: "Community Health & Fitness Fair",
      type: "festival" as const,
      targetAudience: "general",
      attendance: 800,
      description: "Health, wellness, and fitness expo featuring military fitness demonstrations.",
    },
    {
      name: "STEM Career Day",
      type: "career_fair" as const,
      targetAudience: "college",
      attendance: 250,
      description: "Focus on Science, Technology, Engineering, and Math career pathways.",
    },
  ];
  
  eventTemplates.forEach((template, index) => {
    // Generate event 1-90 days in the future
    const daysAhead = Math.floor(Math.random() * 90) + 1;
    const eventDate = new Date(today);
    eventDate.setDate(eventDate.getDate() + daysAhead);
    
    // Random offset within radius
    const randomLatOffset = (Math.random() - 0.5) * latOffset * 2;
    const randomLngOffset = (Math.random() - 0.5) * lngOffset * 2;
    
    const newLat = latitude + randomLatOffset;
    const newLng = longitude + randomLngOffset;
    
    // Generate address
    const streetNumber = Math.floor(Math.random() * 9000) + 1000;
    const streets = ["Convention Center Dr", "Stadium Way", "Event Plaza", "College Ave", "Main St"];
    const street = streets[Math.floor(Math.random() * streets.length)];
    
    events.push({
      name: template.name,
      type: template.type,
      address: `${streetNumber} ${street}`,
      city: "Local City",
      state: "State",
      zipCode: `${Math.floor(Math.random() * 90000) + 10000}`,
      latitude: newLat.toFixed(6),
      longitude: newLng.toFixed(6),
      eventDate: eventDate.toISOString().split('T')[0],
      eventTime: ["09:00", "10:00", "14:00", "18:00"][Math.floor(Math.random() * 4)],
      endDate: eventDate.toISOString().split('T')[0],
      description: `📅 ${template.description} (Mock event for demonstration)`,
      expectedAttendance: template.attendance,
      targetAudience: template.targetAudience,
      contactName: "Event Coordinator",
      contactPhone: "(555) 123-4567",
      contactEmail: "events@example.com",
      registrationRequired: Math.random() > 0.5 ? "yes" : "no",
      cost: Math.random() > 0.7 ? "Free" : "$10 registration",
      status: "upcoming",
      notes: "Generated for demonstration purposes. Great recruiting opportunity!",
    });
  });
  
  // Sort by date
  events.sort((a, b) => a.eventDate.localeCompare(b.eventDate));
  
  return events;
}

