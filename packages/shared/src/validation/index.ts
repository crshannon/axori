import { z } from "zod";

// ============================================================================
// PHASE 1: NORMALIZED PROPERTY SCHEMA EXPORTS
// ============================================================================
// Export all new normalized property schemas from the dedicated file
export * from "./normalized-property";

// Common validation schemas

// Portfolio Insert Schema - excludes auto-generated fields (id, createdAt, updatedAt)
// createdBy comes from auth context, not user input
export const portfolioInsertSchema = z.object({
  name: z.string().min(1, "Portfolio name is required").max(255, "Portfolio name must be 255 characters or less"),
  description: z.string().max(1000, "Description must be 1000 characters or less").optional().nullable(),
  createdBy: z.string().uuid("Created by user ID must be a valid UUID"), // From auth context
});

// Portfolio Select Schema - includes all fields from database
export const portfolioSelectSchema = portfolioInsertSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Portfolio Update Schema - all fields optional except ID
export const portfolioUpdateSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional().nullable(),
});

// User-Portfolio relationship schemas
export const userPortfolioInsertSchema = z.object({
  userId: z.string().uuid("User ID must be a valid UUID"),
  portfolioId: z.string().uuid("Portfolio ID must be a valid UUID"),
  role: z.enum(["owner", "admin", "member", "viewer"], {
    errorMap: () => ({ message: "Role must be owner, admin, member, or viewer" }),
  }),
});

export const userPortfolioSelectSchema = userPortfolioInsertSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const userPortfolioUpdateSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(["owner", "admin", "member", "viewer"]).optional(),
});

// Property Insert Schema - excludes auto-generated fields (id, createdAt, updatedAt)
// portfolioId, userId, and addedBy come from context, not user input
export const propertyInsertSchema = z.object({
  portfolioId: z.string().uuid("Portfolio ID must be a valid UUID"), // From portfolio context
  userId: z.string().uuid("User ID must be a valid UUID"), // Required for user isolation
  addedBy: z.string().uuid("Added by user ID must be a valid UUID"), // From auth context
  address: z
    .string()
    .min(1, "Address is required")
    .refine(
      (val) => {
        // Address should include a street number (starts with a digit)
        // Pattern matches addresses like "123 Main St", "456 Oak Ave", etc.
        // Also allows addresses without numbers for edge cases (e.g., PO Box, "Main Street")
        const hasStreetNumber = /^\d+\s/.test(val.trim())
        const isPOBoxOrSpecial = /^(P\.?O\.?\s*Box|PO\s*Box)/i.test(val.trim())
        // Allow addresses without numbers for edge cases, but prefer addresses with numbers
        return val.trim().length > 0 && (hasStreetNumber || isPOBoxOrSpecial || val.trim().length >= 5)
      },
      {
        message: "Address should include a street number (e.g., '123 Main Street')",
      },
    ),
  city: z.string().min(1, "City is required"),
  state: z.string().length(2, "State must be 2 characters (e.g., TX)"),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code (must be 5 or 9 digits)"),
  // Mapbox geocoding fields - optional but recommended
  latitude: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (val === undefined ? null : String(val))),
  longitude: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (val === undefined ? null : String(val))),
  mapboxPlaceId: z.string().optional().nullable(),
  fullAddress: z.string().optional().nullable(), // Full formatted address from Mapbox
  propertyType: z.string().min(1, "Property type is required").optional().nullable(), // Optional for drafts
  status: z.enum(["draft", "active", "archived"]).default("draft"), // Draft until wizard completed
});

// Property Select Schema - includes all fields from database
export const propertySelectSchema = propertyInsertSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
  // Numeric fields from DB are strings, convert to numbers for select
  latitude: z
    .union([z.string(), z.number(), z.null()])
    .transform((val) => (val === null || val === undefined ? null : Number(val))),
  longitude: z
    .union([z.string(), z.number(), z.null()])
    .transform((val) => (val === null || val === undefined ? null : Number(val))),
});

// Property Update Schema - all fields optional except ID
export const propertyUpdateSchema = z.object({
  id: z.string().uuid(),
  address: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  state: z.string().length(2).optional(),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/).optional(),
  latitude: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (val === undefined ? undefined : String(val))),
  longitude: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (val === undefined ? undefined : String(val))),
  mapboxPlaceId: z.string().optional().nullable(),
  fullAddress: z.string().optional().nullable(),
  propertyType: z.string().min(1).optional().nullable(),
  status: z.enum(["draft", "active", "archived"]).optional(),
});

// Legacy schema for backward compatibility (deprecated - use propertyInsertSchema)
// Note: This schema is kept for backwards compatibility but should be updated to use portfolioId, userId
export const propertySchema = propertyInsertSchema.omit({ portfolioId: true, userId: true, addedBy: true });

// Name validation pattern: letters, spaces, hyphens, apostrophes
const namePattern = /^[a-zA-Z\s'-]+$/;

// User Insert Schema - excludes auto-generated fields (id, clerkId, createdAt, updatedAt)
export const userInsertSchema = z.object({
  email: z.string().email("Invalid email address"),
  firstName: z
    .string()
    .max(50, "First name must be 50 characters or less")
    .regex(namePattern, "First name can only contain letters, spaces, hyphens, and apostrophes")
    .trim()
    .optional(),
  lastName: z
    .string()
    .max(50, "Last name must be 50 characters or less")
    .regex(namePattern, "Last name can only contain letters, spaces, hyphens, and apostrophes")
    .trim()
    .optional(),
  name: z.string().min(1, "Name is required").optional(), // Keep for backward compatibility
});

// User Select Schema - includes all fields from database
export const userSelectSchema = userInsertSchema.extend({
  id: z.string().uuid(),
  clerkId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// User Update Schema - all fields optional except ID
export const userUpdateSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email("Invalid email address").optional(),
  firstName: z
    .string()
    .max(50, "First name must be 50 characters or less")
    .regex(namePattern, "First name can only contain letters, spaces, hyphens, and apostrophes")
    .trim()
    .optional(),
  lastName: z
    .string()
    .max(50, "Last name must be 50 characters or less")
    .regex(namePattern, "Last name can only contain letters, spaces, hyphens, and apostrophes")
    .trim()
    .optional(),
  name: z.string().min(1).optional(),
});

// Legacy schema for backward compatibility (deprecated - use userInsertSchema/userSelectSchema)
export const userSchema = userInsertSchema;

// Market schemas
export const marketSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  state: z.string().length(2),
  region: z.string().optional(),
  investmentProfile: z.array(z.enum(["cash_flow", "appreciation", "hybrid"])).optional(),
  avgCapRate: z.number().optional(),
  medianPrice: z.number().optional(),
  rentToPriceRatio: z.number().optional(),
  active: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const userMarketSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  marketId: z.string().uuid(),
  relationshipType: z.enum(["owns_property", "watching", "target_market"]),
  createdAt: z.date(),
});

// Onboarding schemas
export const onboardingDataSchema = z
  .object({
    phase: z.enum(["Explorer", "Starting", "Building", "Optimizing"]).optional(),
    persona: z
      .enum([
        "House Hacker",
        "Accidental Landlord",
        "Aggressive Grower",
        "Passive Income Seeker",
        "Value-Add Investor",
      ])
      .optional(),
    ownership: z.enum(["Personal", "LLC"]).optional(),
    llcName: z.string().optional(),
    freedomNumber: z.number().int().min(1000).max(100000).optional(),
    strategy: z.enum(["Cash Flow", "Appreciation", "BRRRR", "Hybrid"]).optional(),
    markets: z.array(z.string().uuid()).max(3, "Select at most 3 markets").optional(), // Array of market IDs (0-3)
  })
  .refine(
    (data) => {
      // If ownership is LLC, llcName is required
      if (data.ownership === "LLC") {
        return data.llcName && data.llcName.trim().length > 0;
      }
      return true;
    },
    {
      message: "LLC name is required when ownership structure is LLC",
      path: ["llcName"],
    }
  );

export const onboardingStepSchema = z
  .union([
    z.literal("1"),
    z.literal("2"),
    z.literal("3"),
    z.literal("4"),
    z.literal("5"),
    z.literal("6"),
    z.literal("7"),
  ])
  .nullable();

// Onboarding update schema - for updating user onboarding progress
export const onboardingUpdateSchema = z.object({
  step: onboardingStepSchema,
  data: onboardingDataSchema.optional(),
  markets: z.array(z.string().uuid()).max(3, "Select at most 3 markets").optional(), // Array of market IDs for step 7 (0-3)
  firstName: z
    .string()
    .max(50, "First name must be 50 characters or less")
    .regex(namePattern, "First name can only contain letters, spaces, hyphens, and apostrophes")
    .trim()
    .optional(),
  lastName: z
    .string()
    .max(50, "Last name must be 50 characters or less")
    .regex(namePattern, "Last name can only contain letters, spaces, hyphens, and apostrophes")
    .trim()
    .optional(),
});

// User Select Schema - update to include onboarding fields
export const userSelectSchemaWithOnboarding = userSelectSchema.extend({
  onboardingStep: onboardingStepSchema,
  onboardingCompleted: z.date().nullable(),
  onboardingData: z.string().nullable(), // JSON string, parse with onboardingDataSchema
});

// Property Details Insert Schema - excludes auto-generated fields (id, createdAt, updatedAt)
export const propertyDetailsInsertSchema = z.object({
  propertyId: z.string().uuid("Property ID must be a valid UUID"),
  bedrooms: z.number().int().min(0).max(50).optional().nullable(),
  bathrooms: z.number().min(0).max(50).optional().nullable(), // Allow 2.5 baths
  squareFeet: z.number().int().min(0).max(100000).optional().nullable(),
  lotSize: z.number().int().min(0).optional().nullable(), // Square feet
  yearBuilt: z.number().int().min(1700).max(new Date().getFullYear() + 1).optional().nullable(),
});

// Property Details Select Schema - includes all fields from database
export const propertyDetailsSelectSchema = propertyDetailsInsertSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Property Details Update Schema - all fields optional except ID
export const propertyDetailsUpdateSchema = z.object({
  id: z.string().uuid(),
  bedrooms: z.number().int().min(0).max(50).optional().nullable(),
  bathrooms: z.number().min(0).max(50).optional().nullable(),
  squareFeet: z.number().int().min(0).max(100000).optional().nullable(),
  lotSize: z.number().int().min(0).optional().nullable(),
  yearBuilt: z.number().int().min(1700).max(new Date().getFullYear() + 1).optional().nullable(),
});

// Property Finances Insert Schema - excludes auto-generated fields (id, createdAt, updatedAt)
export const propertyFinancesInsertSchema = z.object({
  propertyId: z.string().uuid("Property ID must be a valid UUID"),
  // Purchase information
  purchaseDate: z.union([z.string(), z.date()]).optional().nullable().transform((val) => {
    if (!val) return null;
    if (typeof val === 'string') return val;
    return val.toISOString().split('T')[0]; // Convert Date to YYYY-MM-DD
  }),
  purchasePrice: z.number().min(0).optional().nullable(),
  closingCosts: z.number().min(0).optional().nullable(),
  currentValue: z.number().min(0).optional().nullable(),
  // Ownership
  entityType: z.enum(["Personal", "LLC", "Trust", "Corporation"]).optional().nullable(),
  entityName: z.string().max(255).optional().nullable(),
  // Financing
  financeType: z.enum(["Cash", "Mortgage", "Owner Financing"]).optional().nullable(),
  loanType: z.enum(["Conventional", "FHA", "VA", "USDA", "Portfolio", "Hard Money", "Other"]).optional().nullable(),
  loanAmount: z.number().min(0).optional().nullable(),
  interestRate: z.number().min(0).max(100).optional().nullable(), // Percentage
  loanTerm: z.number().int().min(1).max(50).optional().nullable(), // Years
  lender: z.string().max(255).optional().nullable(),
});

// Property Finances Select Schema - includes all fields from database
export const propertyFinancesSelectSchema = propertyFinancesInsertSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Property Finances Update Schema - all fields optional except ID
export const propertyFinancesUpdateSchema = z.object({
  id: z.string().uuid(),
  purchaseDate: z.union([z.string(), z.date()]).optional().nullable(),
  purchasePrice: z.number().min(0).optional().nullable(),
  closingCosts: z.number().min(0).optional().nullable(),
  currentValue: z.number().min(0).optional().nullable(),
  entityType: z.enum(["Personal", "LLC", "Trust", "Corporation"]).optional().nullable(),
  entityName: z.string().max(255).optional().nullable(),
  financeType: z.enum(["Cash", "Mortgage", "Owner Financing"]).optional().nullable(),
  loanType: z.enum(["Conventional", "FHA", "VA", "USDA", "Portfolio", "Hard Money", "Other"]).optional().nullable(),
  loanAmount: z.number().min(0).optional().nullable(),
  interestRate: z.number().min(0).max(100).optional().nullable(),
  loanTerm: z.number().int().min(1).max(50).optional().nullable(),
  lender: z.string().max(255).optional().nullable(),
});

// Property Management schemas are now exported from normalized-property.ts
// These old schemas are deprecated - use the new ones from normalized-property.ts

