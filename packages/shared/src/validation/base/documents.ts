/**
 * Base Zod schemas auto-generated from Drizzle schema for property documents
 *
 * These schemas are generated using drizzle-zod from the Drizzle schema definitions.
 * Custom validation enhancements are added in the enhanced/ directory.
 */

import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { propertyDocuments } from "@axori/db/src/schema";

// ============================================================================
// Property Documents
// ============================================================================

export const propertyDocumentInsertSchema = createInsertSchema(propertyDocuments);
export const propertyDocumentSelectSchema = createSelectSchema(propertyDocuments);
