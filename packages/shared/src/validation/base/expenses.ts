/**
 * Base Zod schemas auto-generated from Drizzle schema for property expenses
 *
 * These schemas are generated using drizzle-zod from the Drizzle schema definitions.
 * Custom validation enhancements are added in the enhanced/ directory.
 */

import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { propertyExpenses } from "@axori/db/src/schema";

// ============================================================================
// Property Expenses
// ============================================================================

export const propertyExpenseInsertSchema = createInsertSchema(propertyExpenses);
export const propertyExpenseSelectSchema = createSelectSchema(propertyExpenses);

