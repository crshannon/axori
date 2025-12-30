import { pgTable, text, timestamp, uuid, boolean, numeric, pgEnum, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Portfolio role enum for user-portfolio relationships
export const portfolioRoleEnum = pgEnum("portfolio_role", [
  "owner", // Portfolio creator/owner - full access
  "admin", // Administrative access - can manage properties and members
  "member", // Standard member - can view and edit properties
  "viewer", // Read-only access
]);

// Property status enum
export const propertyStatusEnum = pgEnum("property_status", [
  "draft", // Incomplete - still in wizard or user exited
  "active", // Complete - ready for use
  "archived", // Archived/hidden (future use)
]);

export const properties = pgTable("properties", {
  id: uuid("id").defaultRandom().primaryKey(),
  portfolioId: uuid("portfolio_id")
    .references(() => portfolios.id, { onDelete: "cascade" })
    .notNull(), // Property belongs to a portfolio
  addedBy: uuid("added_by")
    .references(() => users.id, { onDelete: "set null" })
    .notNull(), // User who added this property to the portfolio
  address: text("address").notNull(), // Street address (e.g., "123 Main St")
  city: text("city").notNull(),
  state: text("state").notNull(), // 2-letter state code (e.g., "TX")
  zipCode: text("zip_code").notNull(), // ZIP code (e.g., "78704")
  // Mapbox geocoding data
  latitude: numeric("latitude", { precision: 10, scale: 7 }), // Decimal degrees from Mapbox
  longitude: numeric("longitude", { precision: 10, scale: 7 }), // Decimal degrees from Mapbox
  mapboxPlaceId: text("mapbox_place_id"), // Mapbox place ID for reference
  fullAddress: text("full_address"), // Full formatted address from Mapbox (e.g., "123 Main St, Austin, TX 78704")
  propertyType: text("property_type"), // Nullable for drafts - required when status is "active"
  status: propertyStatusEnum("status").notNull().default("draft"), // Draft until wizard completed
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

// Portfolios table - groups users and properties together
export const portfolios = pgTable("portfolios", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(), // Portfolio name (e.g., "Family Real Estate LLC")
  description: text("description"), // Optional description
  createdBy: uuid("created_by")
    .references(() => users.id, { onDelete: "set null" })
    .notNull(), // User who created the portfolio (initial owner)
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User-Portfolio junction table (many-to-many)
// Allows multiple users to access the same portfolio with different roles
export const userPortfolios = pgTable("user_portfolios", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  portfolioId: uuid("portfolio_id")
    .references(() => portfolios.id, { onDelete: "cascade" })
    .notNull(),
  role: portfolioRoleEnum("role").notNull().default("member"), // User's role in this portfolio
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => ({
  // Ensure a user can only have one role per portfolio
  userPortfolioUnique: unique("user_portfolio_unique").on(
    table.userId,
    table.portfolioId,
  ),
}));

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
  userPortfolios: many(userPortfolios),
  createdPortfolios: many(portfolios, {
    relationName: "portfolioCreator",
  }),
  addedProperties: many(properties, {
    relationName: "propertyAdder",
  }),
}));

export const portfoliosRelations = relations(portfolios, ({ one, many }) => ({
  creator: one(users, {
    fields: [portfolios.createdBy],
    references: [users.id],
    relationName: "portfolioCreator",
  }),
  userPortfolios: many(userPortfolios),
  properties: many(properties),
}));

export const userPortfoliosRelations = relations(userPortfolios, ({ one }) => ({
  user: one(users, {
    fields: [userPortfolios.userId],
    references: [users.id],
  }),
  portfolio: one(portfolios, {
    fields: [userPortfolios.portfolioId],
    references: [portfolios.id],
  }),
}));

export const propertiesRelations = relations(properties, ({ one }) => ({
  portfolio: one(portfolios, {
    fields: [properties.portfolioId],
    references: [portfolios.id],
  }),
  addedByUser: one(users, {
    fields: [properties.addedBy],
    references: [users.id],
    relationName: "propertyAdder",
  }),
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


