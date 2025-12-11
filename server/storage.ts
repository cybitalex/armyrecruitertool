import {
  type Recruit,
  type InsertRecruit,
  type Location,
  type InsertLocation,
  type Event,
  type InsertEvent,
  recruits as recruitsTable,
  qrSurveyResponses,
  qrScans,
} from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./database";
import { eq, sql, and } from "drizzle-orm";

export interface IStorage {
  getAllRecruits(): Promise<Recruit[]>;
  getRecruitsByRecruiter(recruiterId: string): Promise<Recruit[]>;
  getRecruit(id: string): Promise<Recruit | undefined>;
  createRecruit(recruit: InsertRecruit): Promise<Recruit>;
  updateRecruitStatus(id: string, status: string): Promise<Recruit | undefined>;
  deleteRecruit(id: string): Promise<boolean>;

  // Location methods
  getAllLocations(): Promise<Location[]>;
  getLocation(id: string): Promise<Location | undefined>;
  createLocation(location: InsertLocation): Promise<Location>;
  updateLocation(
    id: string,
    location: Partial<InsertLocation>
  ): Promise<Location | undefined>;
  deleteLocation(id: string): Promise<boolean>;
  clearAllLocations(): Promise<void>;

  // Event methods
  getAllEvents(): Promise<Event[]>;
  getEvent(id: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(
    id: string,
    event: Partial<InsertEvent>
  ): Promise<Event | undefined>;
  deleteEvent(id: string): Promise<boolean>;
  clearAllEvents(): Promise<void>;
}

export class MemStorage implements IStorage {
  private locations: Map<string, Location>;
  private events: Map<string, Event>;
  // Recruits are now stored in PostgreSQL database, not in memory

  constructor() {
    this.locations = new Map();
    this.events = new Map();
    // No seed data - users will add their own locations and events
  }

  private seedData() {
    // Removed seed data - keeping method for potential future use
    /*
    // Previous seed data removed - users will add their own data
    const sampleLocations: InsertLocation[] = [
      {
        name: "Lincoln High School",
        type: "school",
        address: "1600 SW Salmon St",
        city: "Portland",
        state: "OR",
        zipCode: "97205",
        latitude: "45.5202",
        longitude: "-122.6742",
        description: "Large public high school with active JROTC program",
        prospectingScore: 85,
        footTraffic: "high",
        demographics: JSON.stringify({
          ageRange: "14-18",
          income: "medium",
          population: 1200,
        }),
        notes: "Contact: Principal Johnson, best time: mornings",
      },
      {
        name: "24 Hour Fitness Downtown",
        type: "gym",
        address: "333 SW Park Ave",
        city: "Portland",
        state: "OR",
        zipCode: "97204",
        latitude: "45.5155",
        longitude: "-122.6789",
        description: "Popular fitness center with young adult demographic",
        prospectingScore: 72,
        footTraffic: "high",
        demographics: JSON.stringify({
          ageRange: "18-35",
          income: "medium-high",
          activeLifestyle: true,
        }),
        notes: "Peak hours: 5-8pm weekdays",
      },
      {
        name: "Portland Community College",
        type: "school",
        address: "12000 SW 49th Ave",
        city: "Portland",
        state: "OR",
        zipCode: "97219",
        latitude: "45.4515",
        longitude: "-122.7817",
        description: "Community college with diverse student body",
        prospectingScore: 90,
        footTraffic: "high",
        demographics: JSON.stringify({
          ageRange: "18-25",
          income: "low-medium",
          population: 8000,
        }),
        notes: "Career fair in spring and fall semesters",
      },
      {
        name: "Pioneer Courthouse Square",
        type: "community_center",
        address: "701 SW 6th Ave",
        city: "Portland",
        state: "OR",
        zipCode: "97204",
        latitude: "45.5190",
        longitude: "-122.6794",
        description: "Downtown public square with high foot traffic",
        prospectingScore: 65,
        footTraffic: "high",
        demographics: JSON.stringify({ ageRange: "all", diverse: true }),
        notes: "Best for general outreach and information booths",
      },
      {
        name: "Clackamas Town Center",
        type: "mall",
        address: "12000 SE 82nd Ave",
        city: "Happy Valley",
        state: "OR",
        zipCode: "97086",
        latitude: "45.4380",
        longitude: "-122.5750",
        description: "Large shopping mall with movie theater",
        prospectingScore: 68,
        footTraffic: "high",
        demographics: JSON.stringify({
          ageRange: "16-30",
          income: "medium",
          population: "suburban",
        }),
        notes: "Weekend afternoons are busiest",
      },
    ];

    sampleLocations.forEach((loc) => {
      const id = randomUUID();
      const createdAt = new Date().toISOString();
      this.locations.set(id, { ...loc, id, createdAt });
    });

    // Seed some sample events
    const sampleEvents: InsertEvent[] = [
      {
        name: "Portland Career Expo 2025",
        type: "career_fair",
        address: "777 NE Martin Luther King Jr Blvd",
        city: "Portland",
        state: "OR",
        zipCode: "97232",
        latitude: "45.5316",
        longitude: "-122.6614",
        eventDate: "2025-11-15",
        eventTime: "10:00 AM",
        endDate: "2025-11-15",
        description: "Annual career fair featuring 100+ employers",
        expectedAttendance: 2000,
        targetAudience: "college",
        contactName: "Sarah Martinez",
        contactPhone: "(503) 555-0123",
        contactEmail: "sarah@portlandexpo.com",
        registrationRequired: "yes",
        cost: "Free",
        status: "upcoming",
        notes: "Reserve booth by Oct 15",
      },
      {
        name: "Trail Blazers Home Game",
        type: "sports_event",
        address: "1 N Center Court St",
        city: "Portland",
        state: "OR",
        zipCode: "97227",
        latitude: "45.5316",
        longitude: "-122.6668",
        eventDate: "2025-11-20",
        eventTime: "7:00 PM",
        description: "NBA game with military appreciation night",
        expectedAttendance: 19000,
        targetAudience: "general",
        contactName: "Events Team",
        contactPhone: "(503) 555-0199",
        registrationRequired: "no",
        status: "confirmed",
        notes: "Setup booth in main concourse",
      },
      {
        name: "Veterans Day Community Festival",
        type: "community_event",
        address: "1120 SW 5th Ave",
        city: "Portland",
        state: "OR",
        zipCode: "97204",
        latitude: "45.5155",
        longitude: "-122.6789",
        eventDate: "2025-11-11",
        eventTime: "9:00 AM",
        endDate: "2025-11-11",
        description: "Community celebration honoring veterans",
        expectedAttendance: 5000,
        targetAudience: "general",
        contactName: "Veterans Affairs Office",
        contactPhone: "(503) 555-0145",
        registrationRequired: "no",
        cost: "Free",
        status: "confirmed",
        notes: "Excellent opportunity for community outreach",
      },
      {
        name: "Mt. Hood Community College Job Fair",
        type: "career_fair",
        address: "26000 SE Stark St",
        city: "Gresham",
        state: "OR",
        zipCode: "97030",
        latitude: "45.5280",
        longitude: "-122.4070",
        eventDate: "2025-10-28",
        eventTime: "1:00 PM",
        endDate: "2025-10-28",
        description: "Fall semester career fair",
        expectedAttendance: 800,
        targetAudience: "college",
        contactName: "Career Services",
        contactPhone: "(503) 555-0167",
        contactEmail: "careers@mhcc.edu",
        registrationRequired: "yes",
        cost: "Free",
        status: "upcoming",
        notes: "Focus on technical and trade careers",
      },
      {
        name: "Rose Festival CityFair",
        type: "festival",
        address: "1040 SE Water Ave",
        city: "Portland",
        state: "OR",
        zipCode: "97214",
        latitude: "45.5150",
        longitude: "-122.6620",
        eventDate: "2025-06-01",
        eventTime: "11:00 AM",
        endDate: "2025-06-15",
        description: "Annual Portland Rose Festival",
        expectedAttendance: 50000,
        targetAudience: "general",
        contactName: "Festival Coordinator",
        contactPhone: "(503) 555-0188",
        registrationRequired: "yes",
        cost: "$500 booth fee",
        status: "upcoming",
        notes: "Premier recruiting opportunity - apply early",
      },
    ];

    sampleEvents.forEach((evt) => {
      const id = randomUUID();
      const createdAt = new Date().toISOString();
      this.events.set(id, { ...evt, id, createdAt });
    });
    */
  }

  // Recruit methods - now using PostgreSQL database
  async getAllRecruits(): Promise<Recruit[]> {
    try {
      // Use database-side sorting for better performance
      const allRecruits = await db
        .select()
        .from(recruitsTable)
        .orderBy(sql`${recruitsTable.submittedAt} DESC`);
      return allRecruits;
    } catch (error) {
      console.error('❌ Failed to get all recruits from database:', error);
      return [];
    }
  }

  // Optimized method to get recruits by recruiter ID with database filtering
  async getRecruitsByRecruiter(recruiterId: string): Promise<Recruit[]> {
    try {
      const recruits = await db
        .select()
        .from(recruitsTable)
        .where(eq(recruitsTable.recruiterId, recruiterId))
        .orderBy(sql`${recruitsTable.submittedAt} DESC`);
      return recruits;
    } catch (error) {
      console.error(`❌ Failed to get recruits for recruiter ${recruiterId}:`, error);
      return [];
    }
  }

  async getRecruit(id: string): Promise<Recruit | undefined> {
    try {
      const [recruit] = await db
        .select()
        .from(recruitsTable)
        .where(eq(recruitsTable.id, id))
        .limit(1);
      return recruit;
    } catch (error) {
      console.error(`❌ Failed to get recruit ${id} from database:`, error);
      return undefined;
    }
  }

  async createRecruit(insertRecruit: InsertRecruit): Promise<Recruit> {
    try {
      const [newRecruit] = await db
        .insert(recruitsTable)
        .values({
          ...insertRecruit,
          status: insertRecruit.status || "pending",
          // Ensure deprecated fields are explicitly set to null if not provided
          // These fields are no longer collected but may still have NOT NULL constraints
          heightFeet: insertRecruit.heightFeet ?? null,
          heightInches: insertRecruit.heightInches ?? null,
          weight: insertRecruit.weight ?? null,
        })
        .returning();
      
      console.log(`✅ Created recruit in database: ${newRecruit.id}`);
      return newRecruit;
    } catch (error) {
      console.error('❌ Failed to create recruit in database:', error);
      throw error;
    }
  }

  async updateRecruitStatus(
    id: string,
    status: string
  ): Promise<Recruit | undefined> {
    try {
      const [updated] = await db
        .update(recruitsTable)
        .set({ status })
        .where(eq(recruitsTable.id, id))
        .returning();
      
      return updated || undefined;
    } catch (error) {
      console.error(`❌ Failed to update recruit ${id} status:`, error);
      return undefined;
    }
  }

  async deleteRecruit(id: string): Promise<boolean> {
    try {
      const result = await db
        .delete(recruitsTable)
        .where(eq(recruitsTable.id, id))
        .returning();
      
      return result.length > 0;
    } catch (error) {
      console.error(`❌ Failed to delete recruit ${id}:`, error);
      return false;
    }
  }

  // Location methods
  async getAllLocations(): Promise<Location[]> {
    return Array.from(this.locations.values()).sort(
      (a, b) => b.prospectingScore - a.prospectingScore
    );
  }

  async getLocation(id: string): Promise<Location | undefined> {
    return this.locations.get(id);
  }

  async createLocation(insertLocation: InsertLocation): Promise<Location> {
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    const location: Location = {
      ...insertLocation,
      description: insertLocation.description ?? null,
      demographics: insertLocation.demographics ?? null,
      notes: insertLocation.notes ?? null,
      lastVisited: insertLocation.lastVisited ?? null,
      id,
      createdAt,
    };
    this.locations.set(id, location);
    return location;
  }

  async updateLocation(
    id: string,
    updates: Partial<InsertLocation>
  ): Promise<Location | undefined> {
    const location = this.locations.get(id);
    if (!location) return undefined;

    const updated: Location = { ...location, ...updates };
    this.locations.set(id, updated);
    return updated;
  }

  async deleteLocation(id: string): Promise<boolean> {
    return this.locations.delete(id);
  }

  async clearAllLocations(): Promise<void> {
    this.locations.clear();
  }

  // Event methods
  async getAllEvents(): Promise<Event[]> {
    return Array.from(this.events.values()).sort(
      (a, b) =>
        new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
    );
  }

  async getEvent(id: string): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = randomUUID();
    const createdAt = new Date().toISOString();
    const event: Event = {
      ...insertEvent,
      eventTime: insertEvent.eventTime ?? null,
      endDate: insertEvent.endDate ?? null,
      description: insertEvent.description ?? null,
      expectedAttendance: insertEvent.expectedAttendance ?? null,
      targetAudience: insertEvent.targetAudience ?? null,
      contactName: insertEvent.contactName ?? null,
      contactPhone: insertEvent.contactPhone ?? null,
      contactEmail: insertEvent.contactEmail ?? null,
      cost: insertEvent.cost ?? null,
      notes: insertEvent.notes ?? null,
      id,
      createdAt,
    };
    this.events.set(id, event);
    return event;
  }

  async updateEvent(
    id: string,
    updates: Partial<InsertEvent>
  ): Promise<Event | undefined> {
    const event = this.events.get(id);
    if (!event) return undefined;

    const updated: Event = { ...event, ...updates };
    this.events.set(id, updated);
    return updated;
  }

  async deleteEvent(id: string): Promise<boolean> {
    return this.events.delete(id);
  }

  async clearAllEvents(): Promise<void> {
    this.events.clear();
  }

  // Optimized method to get recruiter stats using database aggregations
  async getRecruiterStatsAggregated(recruiterId: string): Promise<{
    allTime: {
      total: number;
      surveys: number;
      prospects: number;
      leads: number;
      qrCodeScans: number;
      directEntries: number;
    };
    monthly: {
      total: number;
      surveys: number;
      prospects: number;
      leads: number;
    };
    qrScanTracking: {
      totalScans: number;
      totalSurveyScans: number;
      applicationsFromScans: number;
      surveysFromScans: number;
      totalConverted: number;
      conversionRate: number;
    };
  }> {
    try {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get all-time recruit stats using aggregation
      const allTimeRecruitStats = await db
        .select({
          total: sql<number>`count(*)::int`,
          leads: sql<number>`count(*) filter (where ${recruitsTable.status} = 'pending')::int`,
          prospects: sql<number>`count(*) filter (where ${recruitsTable.status} IN ('contacted', 'qualified'))::int`,
          qrCodeScans: sql<number>`count(*) filter (where ${recruitsTable.source} = 'qr_code')::int`,
          directEntries: sql<number>`count(*) filter (where ${recruitsTable.source} = 'direct')::int`,
        })
        .from(recruitsTable)
        .where(eq(recruitsTable.recruiterId, recruiterId));

      // Get monthly recruit stats using aggregation
      const monthlyRecruitStats = await db
        .select({
          total: sql<number>`count(*)::int`,
          leads: sql<number>`count(*) filter (where ${recruitsTable.status} = 'pending')::int`,
          prospects: sql<number>`count(*) filter (where ${recruitsTable.status} IN ('contacted', 'qualified'))::int`,
        })
        .from(recruitsTable)
        .where(
          and(
            eq(recruitsTable.recruiterId, recruiterId),
            sql`${recruitsTable.submittedAt} >= ${monthStart.toISOString()}`
          )
        );

      // Get survey stats using aggregation
      const allTimeSurveyStats = await db
        .select({
          total: sql<number>`count(*)::int`,
        })
        .from(qrSurveyResponses)
        .where(eq(qrSurveyResponses.recruiterId, recruiterId));

      const monthlySurveyStats = await db
        .select({
          total: sql<number>`count(*)::int`,
        })
        .from(qrSurveyResponses)
        .where(
          and(
            eq(qrSurveyResponses.recruiterId, recruiterId),
            sql`${qrSurveyResponses.createdAt} >= ${monthStart.toISOString()}`
          )
        );

      // Get QR scan tracking stats using aggregation
      const qrScanStats = await db
        .select({
          totalScans: sql<number>`count(*)::int`,
          totalSurveyScans: sql<number>`count(*) filter (where ${qrScans.scanType} = 'survey')::int`,
          applicationsFromScans: sql<number>`count(*) filter (where ${qrScans.scanType} = 'application' AND ${qrScans.convertedToApplication} = true)::int`,
          surveysFromScans: sql<number>`count(*) filter (where ${qrScans.scanType} = 'survey' AND ${qrScans.convertedToSurvey} = true)::int`,
          totalConverted: sql<number>`count(*) filter (where (${qrScans.convertedToApplication} = true OR ${qrScans.convertedToSurvey} = true))::int`,
        })
        .from(qrScans)
        .where(eq(qrScans.recruiterId, recruiterId));

      const allTimeStats = allTimeRecruitStats[0] || {
        total: 0,
        leads: 0,
        prospects: 0,
        qrCodeScans: 0,
        directEntries: 0,
      };
      const monthlyStats = monthlyRecruitStats[0] || {
        total: 0,
        leads: 0,
        prospects: 0,
      };
      const surveyAllTime = allTimeSurveyStats[0]?.total || 0;
      const surveyMonthly = monthlySurveyStats[0]?.total || 0;
      const scanStats = qrScanStats[0] || {
        totalScans: 0,
        totalSurveyScans: 0,
        applicationsFromScans: 0,
        surveysFromScans: 0,
        totalConverted: 0,
      };

      const conversionRate =
        scanStats.totalScans > 0
          ? Math.round((scanStats.totalConverted / scanStats.totalScans) * 100)
          : 0;

      return {
        allTime: {
          total: allTimeStats.total,
          surveys: surveyAllTime,
          prospects: allTimeStats.prospects,
          leads: allTimeStats.leads,
          qrCodeScans: allTimeStats.qrCodeScans,
          directEntries: allTimeStats.directEntries,
        },
        monthly: {
          total: monthlyStats.total,
          surveys: surveyMonthly,
          prospects: monthlyStats.prospects,
          leads: monthlyStats.leads,
        },
        qrScanTracking: {
          totalScans: scanStats.totalScans,
          totalSurveyScans: scanStats.totalSurveyScans,
          applicationsFromScans: scanStats.applicationsFromScans,
          surveysFromScans: scanStats.surveysFromScans,
          totalConverted: scanStats.totalConverted,
          conversionRate,
        },
      };
    } catch (error) {
      console.error(
        `❌ Failed to get aggregated stats for recruiter ${recruiterId}:`,
        error
      );
      // Return zero stats on error
      return {
        allTime: {
          total: 0,
          surveys: 0,
          prospects: 0,
          leads: 0,
          qrCodeScans: 0,
          directEntries: 0,
        },
        monthly: {
          total: 0,
          surveys: 0,
          prospects: 0,
          leads: 0,
        },
        qrScanTracking: {
          totalScans: 0,
          totalSurveyScans: 0,
          applicationsFromScans: 0,
          surveysFromScans: 0,
          totalConverted: 0,
          conversionRate: 0,
        },
      };
    }
  }
}

export const storage = new MemStorage();
