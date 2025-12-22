import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const properties = pgTable("properties", {
  id: uuid("id").defaultRandom().primaryKey(),
  address: text("address").notNull(),
  city: text("city").notNull(),
  state: text("state").notNull(),
  zipCode: text("zip_code").notNull(),
  propertyType: text("property_type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  name: text("name"), // Keep for backward compatibility
  clerkId: text("clerk_id").unique().notNull(),
  // Onboarding tracking
  onboardingStep: text("onboarding_step"), // Current step (1-5) or null if completed/not started
  onboardingCompleted: timestamp("onboarding_completed"), // Timestamp when onboarding was completed, null if not completed
  onboardingData: text("onboarding_data"), // JSON string storing onboarding responses (phase, persona, ownership, freedomNumber, strategy)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});


