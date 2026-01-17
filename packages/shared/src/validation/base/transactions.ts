/**
 * Base Zod schemas auto-generated from Drizzle schema for property transactions
 *
 * These schemas are generated using drizzle-zod from the Drizzle schema definitions.
 * Custom validation enhancements are added in the enhanced/ directory.
 */

import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { propertyTransactions } from "@axori/db/src/schema";

// ============================================================================
// Property Transactions
// ============================================================================

export const propertyTransactionInsertSchema = createInsertSchema(propertyTransactions);
export const propertyTransactionSelectSchema = createSelectSchema(propertyTransactions);

