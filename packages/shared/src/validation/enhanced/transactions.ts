/**
 * Enhanced Zod schemas for property transactions with API-specific validation
 *
 * These schemas extend the base schemas with custom validation rules for API usage.
 * - amount: Enhanced with positive number validation
 * - transactionDate: Validated as ISO date string
 * - type-specific field validation (vendor for expenses, payer for income)
 */

import { propertyTransactionInsertSchema, propertyTransactionSelectSchema } from "../base/transactions";
import { z } from "zod";

// ============================================================================
// Enhanced Property Transaction Schemas
// ============================================================================

/**
 * Property transaction insert schema for API usage
 * - amount: Must be positive number (converted from string in DB)
 * - transactionDate: ISO date string format (YYYY-MM-DD)
 * - Type-specific validation: vendor required for expenses, payer required for income
 *
 * @note Type annotation needed due to Zod version mismatch (v3 in shared, v4 in web)
 * This doesn't affect runtime behavior - the schema works correctly.
 */
export const propertyTransactionInsertApiSchema = ((propertyTransactionInsertSchema as any)
  .extend({
    amount: z.number().positive("Amount must be positive"),
    transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    recurrenceEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  })
  .refine(
    (data: any) => {
      // If expense, vendor should be provided
      if (data.type === "expense" && (!data.vendor || (typeof data.vendor === 'string' && !data.vendor.trim()))) {
        return false;
      }
      // If income, payer should be provided
      if (data.type === "income" && (!data.payer || (typeof data.payer === 'string' && !data.payer.trim()))) {
        return false;
      }
      return true;
    },
    {
      message: "Vendor is required for expenses, payer is required for income",
      path: ["vendor"], // Error will show on vendor field
    }
  ) as unknown) as z.ZodType<any>;

/**
 * Property transaction update schema for API usage
 * All fields optional except id
 *
 * @note Type annotation needed due to Zod version mismatch (v3 in shared, v4 in web)
 * This doesn't affect runtime behavior - the schema works correctly.
 */
export const propertyTransactionUpdateApiSchema = ((propertyTransactionInsertApiSchema as any)
  .partial()
  .extend({
    id: z.string().uuid("Transaction ID must be a valid UUID"),
  })
  .refine(
    (data: any) => {
      // If type is being updated to expense and vendor is not provided, fail
      if (data.type === "expense" && (!data.vendor || (typeof data.vendor === 'string' && !data.vendor.trim()))) {
        return false;
      }
      // If type is being updated to income and payer is not provided, fail
      if (data.type === "income" && (!data.payer || (typeof data.payer === 'string' && !data.payer.trim()))) {
        return false;
      }
      return true;
    },
    {
      message: "Vendor is required for expenses, payer is required for income",
    }
  ) as unknown) as z.ZodType<any>;

/**
 * Property transaction select schema (no changes needed, just re-export)
 */
export const propertyTransactionSelectApiSchema = propertyTransactionSelectSchema;

