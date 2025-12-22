import { z } from "zod";

// Common validation schemas

export const propertySchema = z.object({
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().length(2, "State must be 2 characters"),
  zipCode: z.string().regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code"),
  propertyType: z.string().min(1, "Property type is required"),
});

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
export const onboardingDataSchema = z.object({
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
  freedomNumber: z.number().int().min(1000).max(100000).optional(),
  strategy: z.enum(["Cash Flow", "Appreciation", "BRRRR"]).optional(),
  markets: z.array(z.string().uuid()).max(3, "Select at most 3 markets").optional(), // Array of market IDs (0-3)
});

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


