/**
 * Enhanced Zod schemas for loans with API-specific validation
 *
 * These schemas provide API-specific validation while maintaining alignment with
 * the Drizzle table definition as the single source of truth.
 *
 * Note: We use a standalone schema here instead of extending the drizzle-generated
 * schema due to Zod version compatibility issues with .extend() on drizzle-generated schemas.
 * The schema structure mirrors the Drizzle table definition exactly.
 */

import { z } from "zod";
import { loanSelectSchema } from "../base/loans";

// ============================================================================
// Enhanced Loan Schemas
// ============================================================================

/**
 * Loan insert schema for API usage
 *
 * This schema accepts numbers for numeric fields (API format) instead of strings (DB format).
 * The API route handles converting numbers to strings for the database.
 *
 * Schema structure mirrors the loans Drizzle table definition:
 * - Single source of truth: Drizzle table definition in @axori/db/src/schema
 * - Type safety: API receives numbers, DB stores strings
 * - Field structure: Matches Drizzle schema exactly
 *
 * - interestRate: Expects percentage (0-100), will be converted to decimal for DB
 * - userId: Required for authorization, not stored in loans table
 */
export const loanInsertApiSchema = z.object({
  propertyId: z.string().uuid("Property ID must be a valid UUID"),
  // Status
  status: z.enum(["active", "paid_off", "refinanced", "defaulted", "sold"]).optional(),
  isPrimary: z.boolean().optional(),
  loanPosition: z.number().int().min(1).optional(),
  // Lender
  lenderName: z.string().min(1, "Lender name is required"),
  servicerName: z.string().optional().nullable(),
  loanNumber: z.string().optional().nullable(),
  // Type
  loanType: z.enum([
    "conventional",
    "fha",
    "va",
    "usda",
    "dscr",
    "portfolio",
    "hard_money",
    "bridge",
    "heloc",
    "construction",
    "owner_financed",
    "seller_finance",
    "commercial",
    "other",
  ]).optional(),
  loanPurpose: z.string().optional().nullable(),
  // Terms - numeric fields as numbers (will be converted to strings in API route)
  originalLoanAmount: z.number().min(0, "Original loan amount must be positive"),
  interestRate: z.number().min(0).max(100, "Interest rate must be between 0 and 100"), // Percentage (0-100)
  termMonths: z.number().int().min(1, "Term must be at least 1 month"),
  startDate: z.string().optional().nullable(),
  maturityDate: z.string().optional().nullable(),
  // Current - numeric fields as numbers
  currentBalance: z.number().min(0, "Current balance must be positive"),
  balanceAsOfDate: z.string().optional().nullable(),
  // Payment - numeric fields as numbers
  monthlyPrincipalInterest: z.number().min(0).optional().nullable(),
  monthlyEscrow: z.number().min(0).optional().nullable(),
  monthlyPmi: z.number().min(0).optional().nullable(),
  monthlyMip: z.number().min(0).optional().nullable(), // FHA mortgage insurance
  totalMonthlyPayment: z.number().min(0).optional().nullable(),
  paymentDueDay: z.number().int().min(1).max(31).optional().nullable(),
  // userId for authorization (not stored in loans table)
  userId: z.string().uuid("User ID must be a valid UUID"),
}).strict(); // Use strict() to only allow defined fields

/**
 * Loan update schema for API usage
 * All fields optional except propertyId
 * Note: userId is not included in updates (only needed for authorization on create)
 */
export const loanUpdateApiSchema = loanInsertApiSchema
  .omit({
    userId: true, // userId not needed for updates
  })
  .partial()
  .extend({
    propertyId: z.string().uuid("Property ID must be a valid UUID"),
  });

/**
 * Loan select schema (no changes needed, just re-export)
 */
export const loanSelectApiSchema = loanSelectSchema;

