/**
 * Enhanced Zod schemas for property expenses with API-specific validation
 *
 * These schemas extend the base schemas with custom validation rules for API usage.
 * - amount: Enhanced with min validation
 * - expenseDate: Validated as ISO date string
 */

import { propertyExpenseInsertSchema, propertyExpenseSelectSchema } from "../base/expenses";
import { z } from "zod";

// ============================================================================
// Enhanced Property Expense Schemas
// ============================================================================

/**
 * Property expense insert schema for API usage
 * - amount: Must be positive number
 * - expenseDate: ISO date string format
 * - Note: createInsertSchema already excludes auto-generated fields (id, createdAt, updatedAt)
 *
 * @note Type annotation needed due to Zod version mismatch (v3 in shared, v4 in web)
 * This doesn't affect runtime behavior - the schema works correctly.
 */
export const propertyExpenseInsertApiSchema = (propertyExpenseInsertSchema
  .extend({
    amount: z.number().min(0, "Amount must be positive"),
    expenseDate: z.string().date("Expense date must be a valid date"),
    recurrenceEndDate: z.string().date().optional().nullable(),
  }) as unknown) as z.ZodType<any>;

/**
 * Property expense update schema for API usage
 * All fields optional
 *
 * @note Type annotation needed due to Zod version mismatch (v3 in shared, v4 in web)
 * This doesn't affect runtime behavior - the schema works correctly.
 */
export const propertyExpenseUpdateApiSchema = ((propertyExpenseInsertApiSchema as any)
  .partial() as unknown) as z.ZodType<any>;

/**
 * Property expense select schema (no changes needed, just re-export)
 */
export const propertyExpenseSelectApiSchema = propertyExpenseSelectSchema;

