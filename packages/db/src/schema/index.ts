import { pgTable, text, timestamp, uuid, boolean, numeric, pgEnum, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

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
  onboardingStep: text("onboarding_step"), // Current step (1-7) or null if completed/not started
  onboardingCompleted: timestamp("onboarding_completed"), // Timestamp when onboarding was completed, null if not completed
  onboardingData: text("onboarding_data"), // JSON string storing onboarding responses (phase, persona, ownership, freedomNumber, strategy, markets)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const markets = pgTable("markets", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(), // e.g., "Indianapolis"
  state: text("state").notNull(), // e.g., "IN"
  region: text("region"), // e.g., "Midwest"
  investmentProfile: text("investment_profile"), // JSON array string: ["cash_flow", "appreciation", "hybrid"]
  avgCapRate: numeric("avg_cap_rate", { precision: 5, scale: 2 }), // e.g., 8.50
  medianPrice: numeric("median_price", { precision: 12, scale: 2 }), // e.g., 250000.00
  rentToPriceRatio: numeric("rent_to_price_ratio", { precision: 5, scale: 4 }), // e.g., 0.0067
  active: boolean("active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const relationshipTypeEnum = pgEnum("relationship_type", [
  "owns_property",
  "watching",
  "target_market",
]);

export const userMarkets = pgTable("user_markets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  marketId: uuid("market_id")
    .notNull()
    .references(() => markets.id, { onDelete: "cascade" }),
  relationshipType: relationshipTypeEnum("relationship_type").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const marketsRelations = relations(markets, ({ many }) => ({
  userMarkets: many(userMarkets),
}));

export const usersRelations = relations(users, ({ many }) => ({
  userMarkets: many(userMarkets),
}));

export const userMarketsRelations = relations(userMarkets, ({ one }) => ({
  user: one(users, {
    fields: [userMarkets.userId],
    references: [users.id],
  }),
  market: one(markets, {
    fields: [userMarkets.marketId],
    references: [markets.id],
  }),
}));


