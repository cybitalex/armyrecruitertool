import { sql } from "drizzle-orm";
import { pgTable, text, varchar, date, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const recruits = pgTable("recruits", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
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
