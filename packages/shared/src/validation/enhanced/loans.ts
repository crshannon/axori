/**
 * Enhanced Zod schemas for loans with API-specific validation
 *
 * These schemas extend the base schemas with custom validation rules for API usage.
 * - interestRate: Converted to percentage (0-100) for API, decimal for DB
 * - userId: Added for authorization (not stored in loans table)
 * - Numeric fields: Enhanced with min/max validation and type conversion
 *
 * Note: Drizzle numeric() fields generate as z.string() in base schema,
 * so we override them to z.number() for API usage.
 */

import { loanInsertSchema, loanSelectSchema } from "../base/loans";
import { z } from "zod";

// ============================================================================
// Enhanced Loan Schemas
// ============================================================================

/**
 * Loan insert schema for API usage
 * - interestRate: Expects percentage (0-100), will be converted to decimal for DB
 * - userId: Required for authorization, not stored in loans table
 * - Numeric fields: Converted from string (DB) to number (API)
 * - Note: createInsertSchema already excludes auto-generated fields (id, createdAt, updatedAt)
 *
 * Using .extend() to override field types from base schema (numeric fields are strings in DB)
 *
 * @note Type annotation needed due to Zod version mismatch (v3 in shared, v4 in web)
 * This doesn't affect runtime behavior - the schema works correctly.
 */
export const loanInsertApiSchema = (loanInsertSchema.extend({
  // API expects interestRate as percentage (0-100), override string from base schema
  interestRate: z.number().min(0).max(100, "Interest rate must be between 0 and 100"),
  // userId for authorization (not stored in loans table)
  userId: z.string().uuid("User ID must be a valid UUID"),
  // Convert numeric string fields to numbers for API
  originalLoanAmount: z.number().min(0, "Original loan amount must be positive"),
  currentBalance: z.number().min(0, "Current balance must be positive"),
  // termMonths is already a number in base schema, just add validation
  termMonths: z.number().int().min(1, "Term must be at least 1 month"),
}) as unknown) as z.ZodType<any>;

/**
 * Loan update schema for API usage
 * All fields optional except propertyId
 * Note: userId is not included in updates (only needed for authorization on create)
 *
 * @note Type annotation needed due to Zod version mismatch (v3 in shared, v4 in web)
 * This doesn't affect runtime behavior - the schema works correctly.
 */
export const loanUpdateApiSchema = ((loanInsertApiSchema as any)
  .omit({
    userId: true, // userId not needed for updates
  })
  .partial()
  .extend({
    propertyId: z.string().uuid("Property ID must be a valid UUID"),
  }) as unknown) as z.ZodType<any>;

/**
 * Loan select schema (no changes needed, just re-export)
 */
export const loanSelectApiSchema = loanSelectSchema;

