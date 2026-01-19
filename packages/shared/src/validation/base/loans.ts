/**
 * Base Zod schemas auto-generated from Drizzle schema for loans
 *
 * These schemas are generated using drizzle-zod from the Drizzle schema definitions.
 * Custom validation enhancements (e.g., interestRate as percentage) are added in
 * the enhanced/ directory.
 */

import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { loans } from "@axori/db/src/schema";

// ============================================================================
// Loans
// ============================================================================

export const loanInsertSchema = createInsertSchema(loans);
export const loanSelectSchema = createSelectSchema(loans);

