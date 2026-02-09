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

// Stations table
export const stations = pgTable("stations", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // e.g., "Atlanta Recruiting Station"
  stationCode: text("station_code").notNull().unique(), // e.g., "ATL-001"
  address: text("address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),
  phoneNumber: text("phone_number"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type Station = typeof stations.$inferSelect;
export type InsertStation = typeof stations.$inferInsert;

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
  role: text("role").notNull().default("recruiter"), // 'recruiter', 'station_commander', 'pending_station_commander', 'admin'
  stationId: uuid("station_id").references(() => stations.id), // Link to station
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
  heightFeet: integer("height_feet"), // DEPRECATED - no longer collected
  heightInches: integer("height_inches"), // DEPRECATED - no longer collected
  weight: integer("weight"), // DEPRECATED - no longer collected
  medicalConditions: text("medical_conditions"), // DEPRECATED - no longer collected
  criminalHistory: text("criminal_history"), // DEPRECATED - no longer collected
  preferredMOS: text("preferred_mos"),
  availability: text("availability").notNull(),
  additionalNotes: text("additional_notes"),
  suggestedMOS: text("suggested_mos"), // AI-generated MOS suggestions (stored as JSON)
  status: text("status").notNull().default("pending"),
  source: text("source").notNull().default("direct"), // "qr_code" or "direct"
  ipAddress: text("ip_address"), // Track submission IP
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
  // Shipper tracking fields
  shipDate: date("ship_date"), // Date shipping to basic training
  component: text("component"), // "active" or "reserve"
  actualMOS: text("actual_mos"), // MOS assigned (different from preferred)
  shipNotificationSent: boolean("ship_notification_sent").default(false), // Track if 3-day notification was sent
});

export const insertRecruitSchema = createInsertSchema(recruits).omit({
  id: true,
  submittedAt: true,
  ipAddress: true,
});

export type InsertRecruit = z.infer<typeof insertRecruitSchema>;
export type Recruit = typeof recruits.$inferSelect;

// Location-Based QR Codes table
export const qrCodeLocations = pgTable("qr_code_locations", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  recruiterId: uuid("recruiter_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  locationLabel: text("location_label").notNull(), // User-provided label like "High School Career Fair"
  qrCode: text("qr_code").notNull().unique(), // Unique QR code identifier for this location
  qrType: text("qr_type").notNull().default("application"), // "application" or "survey"
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertQrCodeLocationSchema = createInsertSchema(
  qrCodeLocations
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertQrCodeLocation = z.infer<typeof insertQrCodeLocationSchema>;
export type QrCodeLocation = typeof qrCodeLocations.$inferSelect;

// QR Code Scans Tracking table
export const qrScans = pgTable("qr_scans", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  recruiterId: uuid("recruiter_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  qrCode: text("qr_code").notNull(), // The QR code that was scanned
  locationQrCodeId: uuid("location_qr_code_id").references(
    () => qrCodeLocations.id,
    { onDelete: "set null" }
  ), // If set, this scan was from a location-based QR
  scanType: text("scan_type").notNull().default("application"), // "application" or "survey"
  ipAddress: text("ip_address"), // Track scan IP for analytics
  userAgent: text("user_agent"), // Browser/device info
  referrer: text("referrer"), // Where they came from
  convertedToApplication: boolean("converted_to_application").default(false), // Did they submit?
  convertedToSurvey: boolean("converted_to_survey").default(false), // Did the survey form convert?
  applicationId: uuid("application_id").references(() => recruits.id, {
    onDelete: "set null",
  }), // Link to application if converted
  surveyResponseId: uuid("survey_response_id").references(
    () => qrSurveyResponses.id,
    { onDelete: "set null" }
  ), // Link to survey response if converted
  scannedAt: timestamp("scanned_at").notNull().defaultNow(),
});

export const insertQrScanSchema = createInsertSchema(qrScans).omit({
  id: true,
  scannedAt: true,
});

export type InsertQrScan = z.infer<typeof insertQrScanSchema>;
export type QrScan = typeof qrScans.$inferSelect;

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

export const insertQrSurveyResponseSchema = createInsertSchema(
  qrSurveyResponses
).omit({
  id: true,
  createdAt: true,
  ipAddress: true,
});

export type InsertQrSurveyResponse = z.infer<
  typeof insertQrSurveyResponseSchema
>;
export type QrSurveyResponse = typeof qrSurveyResponses.$inferSelect;

// Station Commander Requests table
export const stationCommanderRequests = pgTable("station_commander_requests", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  requestedStationId: uuid("requested_station_id").references(
    () => stations.id
  ),
  justification: text("justification"), // Why they need station commander access
  status: text("status").notNull().default("pending"), // 'pending', 'approved', 'denied'
  reviewedBy: uuid("reviewed_by").references(() => users.id), // Admin who reviewed
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"), // Admin's notes on approval/denial
  approvalToken: text("approval_token").unique(), // Token for email-based approval
  tokenExpires: timestamp("token_expires"), // Token expiration time
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertStationCommanderRequestSchema = createInsertSchema(
  stationCommanderRequests
).omit({
  id: true,
  createdAt: true,
});

export type InsertStationCommanderRequest = z.infer<
  typeof insertStationCommanderRequestSchema
>;
export type StationCommanderRequest =
  typeof stationCommanderRequests.$inferSelect;

// Station Change Requests table
export const stationChangeRequests = pgTable("station_change_requests", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  currentStationId: uuid("current_station_id").references(() => stations.id),
  requestedStationId: uuid("requested_station_id")
    .references(() => stations.id)
    .notNull(),
  reason: text("reason"), // Why they want to change stations
  status: text("status").notNull().default("pending"), // 'pending', 'approved', 'denied'
  reviewedBy: uuid("reviewed_by").references(() => users.id), // Admin who reviewed
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"), // Admin's notes on approval/denial
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertStationChangeRequestSchema = createInsertSchema(
  stationChangeRequests
).omit({
  id: true,
  createdAt: true,
});

export type InsertStationChangeRequest = z.infer<
  typeof insertStationChangeRequestSchema
>;
export type StationChangeRequest = typeof stationChangeRequests.$inferSelect;

// Notifications table for in-app notifications
export const notifications = pgTable("notifications", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  type: text("type").notNull(), // 'shipper_alert', 'general', etc.
  title: text("title").notNull(),
  message: text("message").notNull(),
  link: text("link"), // Optional link to relevant page
  read: boolean("read").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

// Army MOS (Military Occupational Specialties) table
export const armyMOS = pgTable("army_mos", {
  id: uuid("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  mosCode: text("mos_code").notNull().unique(), // e.g., "11B", "68W"
  title: text("title").notNull(), // Job title
  description: text("description"), // Job description
  category: text("category").notNull(), // e.g., "Infantry", "Medical", "Aviation"
  component: text("component"), // "Active", "Reserve", "Both"
  isOfficer: boolean("is_officer").default(false), // Officer vs Enlisted
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertArmyMOSSchema = createInsertSchema(armyMOS).omit({
  id: true,
  createdAt: true,
});

export type InsertArmyMOS = z.infer<typeof insertArmyMOSSchema>;
export type ArmyMOS = typeof armyMOS.$inferSelect;
