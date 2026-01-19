/**
 * Enhanced Zod schemas for property acquisition with API-specific validation
 *
 * These schemas provide API-specific validation while maintaining alignment with
 * the Drizzle table definition as the single source of truth.
 *
 * Note: We use a standalone schema here instead of extending the drizzle-generated
 * schema due to Zod version compatibility issues with .extend() on drizzle-generated schemas.
 * The schema structure mirrors the Drizzle table definition exactly.
 */

import { z } from "zod";
import { propertyAcquisitionSelectSchema } from "../base/properties";

// ============================================================================
// Enhanced Property Acquisition Schemas
// ============================================================================

/**
 * Property acquisition insert schema for API usage
 *
 * This schema accepts numbers for numeric fields (API format) instead of strings (DB format).
 * The API route handles converting numbers to strings for the database.
 *
 * Schema structure mirrors the propertyAcquisition Drizzle table definition:
 * - Single source of truth: Drizzle table definition in @axori/db/src/schema
 * - Type safety: API receives numbers, DB stores strings
 * - Field structure: Matches Drizzle schema exactly
 */
export const propertyAcquisitionInsertApiSchema = z.object({
  propertyId: z.string().uuid(),
  // Numeric fields as numbers (will be converted to strings in API route)
  purchasePrice: z.number().min(0).optional().nullable(),
  closingCostsTotal: z.number().min(0).optional().nullable(),
  downPaymentAmount: z.number().min(0).optional().nullable(),
  earnestMoney: z.number().min(0).optional().nullable(),
  sellerCredits: z.number().min(0).optional().nullable(),
  buyerAgentCommission: z.number().min(0).optional().nullable(),
  arvAtPurchase: z.number().min(0).optional().nullable(),
  rehabBudget: z.number().min(0).optional().nullable(),
  depreciationBasis: z.number().min(0).optional().nullable(),
  landValue: z.number().min(0).optional().nullable(),
  // Date fields
  purchaseDate: z.string().optional().nullable(),
  // Text/enum fields
  acquisitionMethod: z.string().optional().nullable(),
  downPaymentSource: z.string().optional().nullable(),
  closingCostsBreakdown: z.string().optional().nullable(),
  // Boolean fields
  isBrrrr: z.boolean().optional().nullable(),
}).strict(); // Use strict() to only allow defined fields

/**
 * Property acquisition update schema for API usage
 * All fields optional except propertyId
 */
export const propertyAcquisitionUpdateApiSchema = propertyAcquisitionInsertApiSchema
  .partial()
  .extend({
    propertyId: z.string().uuid("Property ID must be a valid UUID"),
  });

/**
 * Property acquisition select schema (no changes needed, just re-export)
 */
export const propertyAcquisitionSelectApiSchema = propertyAcquisitionSelectSchema;
