import { sql } from "drizzle-orm";
import { pgTable, text, varchar, date, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const recruits = pgTable("recruits", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  middleName: text("middle_name"),
  dateOfBirth: date("date_of_birth").notNull(),
  ssn: text("ssn").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  educationLevel: text("education_level").notNull(),
  hasDriversLicense: text("has_drivers_license").notNull(),
  hasPriorService: text("has_prior_service").notNull(),
  priorServiceBranch: text("prior_service_branch"),
  priorServiceYears: integer("prior_service_years"),
  heightFeet: integer("height_feet").notNull(),
  heightInches: integer("height_inches").notNull(),
  weight: integer("weight").notNull(),
  medicalConditions: text("medical_conditions"),
  criminalHistory: text("criminal_history").notNull(),
  preferredMOS: text("preferred_mos"),
  availability: text("availability").notNull(),
  additionalNotes: text("additional_notes"),
  status: text("status").notNull().default("pending"),
  submittedAt: text("submitted_at").notNull(),
});

export const insertRecruitSchema = createInsertSchema(recruits).omit({
  id: true,
  submittedAt: true,
});

export type InsertRecruit = z.infer<typeof insertRecruitSchema>;
export type Recruit = typeof recruits.$inferSelect;

// Prospecting Locations table
export const locations = pgTable("locations", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // e.g., "school", "gym", "mall", "event_venue", "community_center"
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  description: text("description"),
  prospectingScore: integer("prospecting_score").notNull().default(0), // 0-100 score
  footTraffic: text("foot_traffic"), // "low", "medium", "high"
  demographics: text("demographics"), // JSON string of demographic data
  notes: text("notes"),
  lastVisited: text("last_visited"),
  createdAt: text("created_at").notNull(),
});

export const insertLocationSchema = createInsertSchema(locations).omit({
  id: true,
  createdAt: true,
});

export type InsertLocation = z.infer<typeof insertLocationSchema>;
export type Location = typeof locations.$inferSelect;

// Recruiting Events table
export const events = pgTable("events", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  type: text("type").notNull(), // e.g., "career_fair", "sports_event", "festival", "community_event"
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  latitude: text("latitude").notNull(),
  longitude: text("longitude").notNull(),
  eventDate: text("event_date").notNull(),
  eventTime: text("event_time"),
  endDate: text("end_date"),
  description: text("description"),
  expectedAttendance: integer("expected_attendance"),
  targetAudience: text("target_audience"), // e.g., "high_school", "college", "veterans", "general"
  contactName: text("contact_name"),
  contactPhone: text("contact_phone"),
  contactEmail: text("contact_email"),
  registrationRequired: text("registration_required").notNull().default("no"),
  cost: text("cost"),
  status: text("status").notNull().default("upcoming"), // "upcoming", "confirmed", "completed", "cancelled"
  notes: text("notes"),
  createdAt: text("created_at").notNull(),
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
});

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;
