/**
 * Base Zod schemas auto-generated from Drizzle schema for property bank accounts
 *
 * These schemas are generated using drizzle-zod from the Drizzle schema definitions.
 * Custom validation enhancements can be added in the enhanced/ directory.
 */

import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { propertyBankAccounts } from "@axori/db/src/schema";

// ============================================================================
// Property Bank Accounts
// ============================================================================

export const propertyBankAccountInsertSchema = createInsertSchema(propertyBankAccounts);
export const propertyBankAccountSelectSchema = createSelectSchema(propertyBankAccounts);
