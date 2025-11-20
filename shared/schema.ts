import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  date,
  integer,
  timestamp,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users/Recruiters table
export const users = pgTable("users", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name").notNull(),
  rank: text("rank"), // e.g., "SGT", "SSG", "SFC"
  unit: text("unit"),
  phoneNumber: text("phone_number"),
  zipCode: text("zip_code"), // Recruiter's assigned zip code for searches
  profilePicture: text("profile_picture"), // Base64 encoded image or URL
  isVerified: boolean("is_verified").notNull().default(false),
  verificationToken: text("verification_token"),
  verificationExpires: timestamp("verification_expires"),
  qrCode: text("qr_code").notNull().unique(), // Unique QR code identifier
  resetPasswordToken: text("reset_password_token"),
  resetPasswordExpires: timestamp("reset_password_expires"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  qrCode: true,
  verificationToken: true,
  verificationExpires: true,
  resetPasswordToken: true,
  resetPasswordExpires: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Recruits/Applicants table (updated with recruiter tracking)
export const recruits = pgTable("recruits", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  recruiterId: uuid("recruiter_id").references(() => users.id), // Which recruiter they came from
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  middleName: text("middle_name"),
  dateOfBirth: date("date_of_birth").notNull(),
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
  source: text("source").notNull().default("direct"), // "qr_code" or "direct"
  ipAddress: text("ip_address"), // Track submission IP
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
});

export const insertRecruitSchema = createInsertSchema(recruits).omit({
  id: true,
  submittedAt: true,
  ipAddress: true,
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
  eventUrl: text("event_url"), // URL to event details page (official event website, Eventbrite, etc.)
  locationUrl: text("location_url"), // URL to location/venue (Google Maps, venue website)
  createdAt: text("created_at").notNull(),
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  createdAt: true,
});

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

// QR Survey Responses table (for presentation/quick feedback scans)
export const qrSurveyResponses = pgTable("qr_survey_responses", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  recruiterId: uuid("recruiter_id")
    .references(() => users.id)
    .notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  rating: integer("rating").notNull(), // 1-5 rating
  feedback: text("feedback"),
  source: text("source").notNull().default("presentation"), // e.g., "presentation", "event"
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertQrSurveyResponseSchema = createInsertSchema(qrSurveyResponses).omit({
  id: true,
  createdAt: true,
  ipAddress: true,
});

export type InsertQrSurveyResponse = z.infer<typeof insertQrSurveyResponseSchema>;
export type QrSurveyResponse = typeof qrSurveyResponses.$inferSelect;
